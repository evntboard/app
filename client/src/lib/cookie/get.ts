"use server"

import {cookies} from "next/headers";

export const getFromCookie = (name: string, defaultValue: any): any => {
  const layout = cookies().get(
    encodeURIComponent(name),
  );
  if (layout) {
    return JSON.parse(layout.value);
  }
  return defaultValue;
}