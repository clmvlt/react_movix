import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { addDays, isTodayApiDate, isValidApiDate, todayApiDate } from "@/lib/date";

const STORAGE_KEY = "movix.workingDate";

const WORKING_DATE_ROUTES = ["/app/expeditions", "/app/tours"];

const WORKING_DATE_EXACT_ROUTES = ["/app"];

interface WorkingDateValue {
  date: string;
  isToday: boolean;
  setDate: (value: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  resetToToday: () => void;
}

const WorkingDateContext = createContext<WorkingDateValue | undefined>(undefined);

function readInitialDate(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidApiDate(stored)) return stored as string;
  } catch {
    /* storage unavailable */
  }
  return todayApiDate();
}

export function WorkingDateProvider({ children }: { children: ReactNode }) {
  const [date, setDateState] = useState<string>(readInitialDate);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, date);
    } catch {
      /* ignore */
    }
  }, [date]);

  const setDate = useCallback((value: string) => {
    if (isValidApiDate(value)) setDateState(value);
  }, []);

  const value = useMemo<WorkingDateValue>(
    () => ({
      date,
      isToday: isTodayApiDate(date),
      setDate,
      goToPreviousDay: () => setDateState((current) => addDays(current, -1)),
      goToNextDay: () => setDateState((current) => addDays(current, 1)),
      resetToToday: () => setDateState(todayApiDate()),
    }),
    [date, setDate]
  );

  return (
    <WorkingDateContext.Provider value={value}>
      {children}
    </WorkingDateContext.Provider>
  );
}

export function useWorkingDate(): WorkingDateValue {
  const ctx = useContext(WorkingDateContext);
  if (!ctx)
    throw new Error("useWorkingDate must be used within WorkingDateProvider");
  return ctx;
}

export function useWorkingDateVisible(): boolean {
  const { pathname } = useLocation();
  if (WORKING_DATE_EXACT_ROUTES.includes(pathname)) return true;
  return WORKING_DATE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
