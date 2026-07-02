import { useEffect, useState } from "react";

export function useLocalStorageState<T>(initialState: T, key: string) {
  const [value, setValue] = useState<T>(initialState);

  useEffect(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      setValue(JSON.parse(storedValue) as T);
    }
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue] as const;
}
