export type MutationStatus = 'success' | 'error';

export type MutationDebugInfo = {
  mutation: 'BOOKING_CREATE_SELF' | 'BOOKING_CREATE_GUEST' | string;
  status: MutationStatus;
  responseSnippet?: string;
  errorMessage?: string;
  timestamp: string;
};

export type RuntimeErrorDebugInfo = {
  message: string;
  stack?: string;
  componentStack?: string;
  route: string;
  lastMutation: MutationDebugInfo | null;
  timestamp: string;
};

const LAST_MUTATION_KEY = 'rbms:lastMutation';
const LAST_RUNTIME_ERROR_KEY = 'rbms:lastRuntimeError';
const LAST_ROUTE_KEY = 'rbms:lastRoute';

const canUseWindow = (): boolean => typeof window !== 'undefined';

export const isDebugMode = (): boolean => {
  if (!canUseWindow()) return false;
  const query = new URLSearchParams(window.location.search);
  return query.get('debug') === '1';
};

const readFromStorage = <T,>(key: string): T | null => {
  if (!canUseWindow()) return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeToStorage = (key: string, value: unknown): void => {
  if (!canUseWindow()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
};

export const setLastRoute = (route: string): void => {
  writeToStorage(LAST_ROUTE_KEY, route);
};

export const getLastRoute = (): string => {
  const stored = readFromStorage<string>(LAST_ROUTE_KEY);
  if (stored) return stored;
  if (!canUseWindow()) return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const setLastMutation = (entry: Omit<MutationDebugInfo, 'timestamp'>): MutationDebugInfo => {
  const value: MutationDebugInfo = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  writeToStorage(LAST_MUTATION_KEY, value);
  return value;
};

export const getLastMutation = (): MutationDebugInfo | null => readFromStorage<MutationDebugInfo>(LAST_MUTATION_KEY);

export const setLastRuntimeError = (error: RuntimeErrorDebugInfo): void => {
  if (!isDebugMode()) return;
  writeToStorage(LAST_RUNTIME_ERROR_KEY, error);
};

export const getLastRuntimeError = (): RuntimeErrorDebugInfo | null => readFromStorage<RuntimeErrorDebugInfo>(LAST_RUNTIME_ERROR_KEY);
