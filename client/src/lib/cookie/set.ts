"use client"

import cookie from "js-cookie";

export const setToCookie = (name: string, object: any) => {
  cookie.set(name, JSON.stringify(object), {
    domain: `.${window.location.hostname}`,
    secure: true,
    sameSite: "None",
  });
}