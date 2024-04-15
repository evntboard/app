import Pocketbase from 'pocketbase'
import { TypedPocketBase } from '~/types/pocketbase';

export let pb: TypedPocketBase | null = null

if (typeof window !== 'undefined') {
  if (import.meta.env.PROD) {
    pb = new Pocketbase(window.location.origin) as TypedPocketBase
  } else {
    pb = new Pocketbase('http://127.0.0.1:8090') as TypedPocketBase
  }

  pb.authStore.loadFromCookie(document.cookie)
}
