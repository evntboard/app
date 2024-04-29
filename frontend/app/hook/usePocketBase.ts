import Pocketbase from 'pocketbase'
import { useMemo } from 'react'
import { useRootContext } from '~/context/root'
import { TypedPocketBase } from '~/types/pocketbase'

export const usePocketBase = () => {
  const rootContext = useRootContext()

  return useMemo(() => {
    const pb = new Pocketbase(rootContext.API_URL) as TypedPocketBase
    // only run this on client side :)
    if (typeof window !== 'undefined') {
      pb.authStore.loadFromCookie(document.cookie)
    }
    return pb
  }, [])
}