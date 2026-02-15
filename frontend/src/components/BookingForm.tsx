import { FormEvent, useMemo, useState } from 'react';

type BookingFormValues = {
  date: string;
  fromTime: string;
  toTime: string;
  mode: 'single' | 'recurring';
  validFrom: string;
  validTo: string;
  weekdays: number[];
};

type BookingFormSubmitPayload = BookingFormValues;

const weekdayButtons = [
  { label: 'Mo', value: 1 },
  { label: 'Di', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Do', value: 4 },
  { label: 'Fr', value: 5 },
  { label: 'Sa', value: 6 },
  { label: 'So', value: 0 }
];

const isTimeRangeValid = (fromTime: string, toTime: string): boolean => fromTime < toTime;

export function BookingForm({
  selectedDate,
  onSubmit,
  onCancel
}: {
  selectedDate: string;
  onSubmit: (payload: BookingFormSubmitPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const defaultWeekday = useMemo(() => new Date(`${selectedDate}T00:00:00.000Z`).getUTCDay(), [selectedDate]);
  const [values, setValues] = useState<BookingFormValues>({
    date: selectedDate,
    fromTime: '09:00',
    toTime: '17:00',
    mode: 'single',
    validFrom: selectedDate,
    validTo: selectedDate,
    weekdays: [defaultWeekday]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const toggleWeekday = (weekday: number) => {
    setValues((current) => {
      if (current.weekdays.includes(weekday)) {
        return { ...current, weekdays: current.weekdays.filter((value) => value !== weekday) };
      }
      return { ...current, weekdays: [...current.weekdays, weekday].sort((a, b) => a - b) };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError('');

    if (!isTimeRangeValid(values.fromTime, values.toTime)) {
      setLocalError('Zeitraum ist ungültig: „von“ muss vor „bis“ liegen.');
      return;
    }

    if (values.mode === 'recurring') {
      if (!values.validFrom || !values.validTo || values.validFrom > values.validTo) {
        setLocalError('Für Serienbuchungen muss der Gültigkeitszeitraum korrekt gesetzt sein.');
        return;
      }
      if (values.weekdays.length === 0) {
        setLocalError('Bitte mindestens einen Wochentag für die Serienbuchung auswählen.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="stack-sm" onSubmit={handleSubmit}>
      <div className="stack-xs">
        <label>Datum</label>
        <input type="date" value={values.date} readOnly />
      </div>
      <div className="inline-grid-two">
        <div className="stack-xs">
          <label>von</label>
          <input type="time" value={values.fromTime} autoFocus onChange={(event) => setValues((current) => ({ ...current, fromTime: event.target.value }))} />
        </div>
        <div className="stack-xs">
          <label>bis</label>
          <input type="time" value={values.toTime} onChange={(event) => setValues((current) => ({ ...current, toTime: event.target.value }))} />
        </div>
      </div>

      <div className="stack-xs">
        <label>Typ</label>
        <select value={values.mode} onChange={(event) => setValues((current) => ({ ...current, mode: event.target.value === 'recurring' ? 'recurring' : 'single' }))}>
          <option value="single">Einzelbuchung</option>
          <option value="recurring">Serienbuchung</option>
        </select>
      </div>

      {values.mode === 'recurring' && (
        <>
          <div className="inline-grid-two">
            <div className="stack-xs">
              <label>Serie von</label>
              <input type="date" value={values.validFrom} onChange={(event) => setValues((current) => ({ ...current, validFrom: event.target.value }))} />
            </div>
            <div className="stack-xs">
              <label>Serie bis</label>
              <input type="date" value={values.validTo} onChange={(event) => setValues((current) => ({ ...current, validTo: event.target.value }))} />
            </div>
          </div>
          <div className="stack-xs">
            <label>Wiederholungstage</label>
            <div className="weekday-toggle-group" role="group" aria-label="Wochentage">
              {weekdayButtons.map((weekday) => (
                <button
                  key={weekday.value}
                  type="button"
                  className={`weekday-toggle ${values.weekdays.includes(weekday.value) ? 'active' : ''}`}
                  onClick={() => toggleWeekday(weekday.value)}
                >
                  {weekday.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {localError && <p className="muted error-inline">{localError}</p>}

      <div className="inline-end">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Abbrechen</button>
        <button className="btn" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Speichere…' : 'Buchen'}</button>
      </div>
    </form>
  );
}
