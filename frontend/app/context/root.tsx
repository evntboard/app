import { createContext, useContext } from 'react'

type RootContext = {
  API_URL?: string,
}

export const RootContext = createContext<RootContext>({
  API_URL: undefined,
})

export const useRootContext = () => useContext(RootContext)