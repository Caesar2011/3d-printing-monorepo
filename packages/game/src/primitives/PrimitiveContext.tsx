import type { PropsWithChildren } from 'react'
import React, { createContext, useContext } from 'react'

export type PrimitiveContextType = {
  sphereSegments: number
  cylinderSegments: number
}

const DEFAULT_VALUES: PrimitiveContextType = {
  sphereSegments: 20,
  cylinderSegments: 16,
}

const PrimitiveContext = createContext<PrimitiveContextType>(DEFAULT_VALUES)

export const PrimitiveContextProvider: React.FC<PropsWithChildren<Partial<PrimitiveContextType>>> = ({
  children,
  ...props
}) => {
  const parentContext = useContext(PrimitiveContext)
  const value = { ...parentContext, ...props }

  return <PrimitiveContext.Provider value={value}>{children}</PrimitiveContext.Provider>
}

export const usePrimitiveContext = () => useContext(PrimitiveContext)
