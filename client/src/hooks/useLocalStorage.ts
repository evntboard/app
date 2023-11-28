'use client'

import {useEffect, useState} from "react";

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (data: T) => void] {
  const [data, setData] = useState<T>(defaultValue)

  useEffect(() => {
    try {
      setData(JSON.parse(String(localStorage.getItem(key))));
    } catch (e) {
      localStorage.setItem(key, JSON.stringify(defaultValue))
      setData(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const innerSetData = (data: T) => {
    setData(data)
    localStorage.setItem(key, JSON.stringify(data))
  }

  return [data, innerSetData]
}