import type { FC, PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'

import type { DeepPartial } from '../utils/deep-merge.js'
import { deepMerge } from '../utils/deep-merge.js'

import type { ShapeSpecs } from './types.js'

export type ShapeContextType = ShapeSpecs

const DEFAULT_VALUES: ShapeContextType = {
  wall: 1.5,
  floor: 2,
  tolerance: {
    magnet: {
      diameter: {
        horizontal: 0.1,
        vertical: 0.1,
      },
      height: 0.1,
    },
    lap: 0.02,
  },
}

const ShapeContext = createContext<ShapeContextType>(DEFAULT_VALUES)

export const ShapeContextProvider: FC<PropsWithChildren<DeepPartial<ShapeContextType>>> = ({ children, ...props }) => {
  const oldProps = useShapeContext()
  const mergedProps = deepMerge(oldProps, props)
  return <ShapeContext.Provider value={mergedProps}>{children}</ShapeContext.Provider>
}

// Hook to use the ShapeContext in any component.
export const useShapeContext = () => useContext(ShapeContext)
