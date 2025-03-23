// Define the RenderContext type to match RenderOpts.
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

import type { RenderOptions } from './types.js'

export type RenderContextType = Required<RenderOptions>

// Create the RenderContext with the default values.
const RenderContext = createContext<RenderContextType | undefined>(undefined)

// Provider component that merges any provided values with the parent's context.
export const RenderContextProvider: React.FC<PropsWithChildren<RenderContextType>> = ({ children, ...props }) => {
  return <RenderContext.Provider value={props}>{children}</RenderContext.Provider>
}

// Hook to use the RenderContext in any component.
export const useRenderContext = () => {
  const ctx = useContext(RenderContext)
  if (ctx === undefined) {
    throw new Error('RenderContext useRenderContext must be defined!')
  }
  return ctx
}
