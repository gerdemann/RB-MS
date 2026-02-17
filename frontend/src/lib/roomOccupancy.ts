import { BOOKABLE_END, BOOKABLE_START, clampInterval, intervalsToSegments, invertIntervals, mergeIntervals, toMinutes, type MinuteInterval, type RingSegment } from './bookingWindows';
import { BUSINESS_END_MINUTES, BUSINESS_START_MINUTES } from './roomBusinessDayRing';

type RoomOccupancyBooking = {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export type RoomBusySegment = RingSegment & { tone: 'own' | 'other' };

const HHMM_PATTERN = /^\d{2}:\d{2}$/;

const toLocalDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseMinutes = (value?: string | null): number | null => {
  if (!value) return null;
  if (HHMM_PATTERN.test(value)) {
    const parsed = toMinutes(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate.getHours() * 60 + parsedDate.getMinutes();
};

const bookingBelongsToDay = (booking: RoomOccupancyBooking, day?: string): boolean => {
  if (!day) return true;

  if (booking.date) return booking.date.slice(0, 10) === day;

  if (!booking.startTime || HHMM_PATTERN.test(booking.startTime)) return true;
  const parsed = new Date(booking.startTime);
  if (Number.isNaN(parsed.getTime())) return true;
  return toLocalDateKey(parsed) === day;
};

export type RoomOccupancyMetrics = {
  intervals: MinuteInterval[];
  segments: RingSegment[];
  freeIntervals: MinuteInterval[];
  freeSegments: RingSegment[];
  occupiedMinutes: number;
  freeMinutes: number;
  windowMinutes: number;
  occupiedRatio: number;
};

export const computeRoomOccupancy = (
  bookings: RoomOccupancyBooking[],
  day?: string,
  start = BOOKABLE_START,
  end = BOOKABLE_END
): RoomOccupancyMetrics => {
  const useDefaultWindow = start === BOOKABLE_START && end === BOOKABLE_END;
  const winStart = useDefaultWindow ? BUSINESS_START_MINUTES : toMinutes(start);
  const winEnd = useDefaultWindow ? BUSINESS_END_MINUTES : toMinutes(end);
  const windowMinutes = Math.max(0, winEnd - winStart);
  if (!Number.isFinite(winStart) || !Number.isFinite(winEnd) || windowMinutes <= 0) {
    return { intervals: [], segments: [], freeIntervals: [], freeSegments: [], occupiedMinutes: 0, freeMinutes: 0, windowMinutes: 0, occupiedRatio: 0 };
  }

  const intervals = mergeIntervals(bookings.flatMap((booking) => {
    if (!bookingBelongsToDay(booking, day)) return [];

    const startMinutes = parseMinutes(booking.startTime);
    const endMinutes = parseMinutes(booking.endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return [];

    const clamped = clampInterval({ startMin: startMinutes, endMin: endMinutes }, winStart, winEnd);
    return clamped ? [clamped] : [];
  }));

  const occupiedMinutes = intervals.reduce((total, interval) => total + (interval.endMin - interval.startMin), 0);
  const freeIntervals = invertIntervals(winStart, winEnd, intervals);
  const freeMinutes = Math.max(0, windowMinutes - occupiedMinutes);
  const segments = intervalsToSegments(winStart, winEnd, intervals);
  const freeSegments = intervalsToSegments(winStart, winEnd, freeIntervals);

  return {
    intervals,
    segments,
    freeIntervals,
    freeSegments,
    occupiedMinutes,
    freeMinutes,
    windowMinutes,
    occupiedRatio: windowMinutes > 0 ? Math.min(1, Math.max(0, occupiedMinutes / windowMinutes)) : 0
  };
};

export const computeRoomOccupancySegments = (
  bookings: RoomOccupancyBooking[],
  day?: string,
  start = BOOKABLE_START,
  end = BOOKABLE_END
): RingSegment[] => computeRoomOccupancy(bookings, day, start, end).segments;

const normalizeWindowMinutes = (start: string, end: string): { winStart: number; winEnd: number; windowMinutes: number } => {
  const useDefaultWindow = start === BOOKABLE_START && end === BOOKABLE_END;
  const winStart = useDefaultWindow ? BUSINESS_START_MINUTES : toMinutes(start);
  const winEnd = useDefaultWindow ? BUSINESS_END_MINUTES : toMinutes(end);
  return {
    winStart,
    winEnd,
    windowMinutes: Math.max(0, winEnd - winStart)
  };
};

export const computeRoomBusySegments = <TBooking extends RoomOccupancyBooking>(
  bookings: TBooking[],
  options?: {
    day?: string;
    start?: string;
    end?: string;
    isOwnBooking?: (booking: TBooking) => boolean;
  }
): RoomBusySegment[] => {
  const day = options?.day;
  const start = options?.start ?? BOOKABLE_START;
  const end = options?.end ?? BOOKABLE_END;
  const { winStart, winEnd, windowMinutes } = normalizeWindowMinutes(start, end);
  if (!Number.isFinite(winStart) || !Number.isFinite(winEnd) || windowMinutes <= 0) return [];

  const normalized = bookings.flatMap((booking) => {
    if (!bookingBelongsToDay(booking, day)) return [];
    const startMinutes = parseMinutes(booking.startTime);
    const endMinutes = parseMinutes(booking.endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return [];
    const clamped = clampInterval({ startMin: startMinutes, endMin: endMinutes }, winStart, winEnd);
    if (!clamped) return [];
    return [{ ...clamped, tone: options?.isOwnBooking?.(booking) ? 'own' as const : 'other' as const }];
  });
  if (normalized.length === 0) return [];

  const bounds = Array.from(new Set(normalized.flatMap((interval) => [interval.startMin, interval.endMin]))).sort((a, b) => a - b);
  const rawSegments: RoomBusySegment[] = [];

  for (let index = 0; index < bounds.length - 1; index += 1) {
    const startMin = bounds[index];
    const endMin = bounds[index + 1];
    if (endMin <= startMin) continue;
    const covering = normalized.filter((interval) => interval.startMin < endMin && interval.endMin > startMin);
    if (covering.length === 0) continue;

    rawSegments.push({
      p0: (startMin - winStart) / windowMinutes,
      p1: (endMin - winStart) / windowMinutes,
      tone: covering.some((interval) => interval.tone === 'own') ? 'own' : 'other'
    });
  }

  if (rawSegments.length === 0) return [];

  const merged: RoomBusySegment[] = [rawSegments[0]];
  for (let index = 1; index < rawSegments.length; index += 1) {
    const segment = rawSegments[index];
    const previous = merged[merged.length - 1];
    if (segment.tone === previous.tone && Math.abs(segment.p0 - previous.p1) < 0.000001) {
      previous.p1 = segment.p1;
      continue;
    }
    merged.push(segment);
  }

  return merged;
};
