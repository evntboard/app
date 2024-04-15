import { createCookie } from '@remix-run/node'

export const cookieTreeOpen = createCookie('open', {
  maxAge: 604_800, // one week
})

export const cookieTreeSplit = createCookie('split', {
  maxAge: 604_800, // one week
})