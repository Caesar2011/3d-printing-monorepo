import type { PropsWithChildren } from 'react'
import React, { createContext, useContext } from 'react'

import { Edge } from '../primitives/Cuboid.js'
import type { DeepPartial, DeepRequired } from '../utils/deep-merge.js'
import { deepMerge } from '../utils/deep-merge.js'

import type { ContainerOpts } from './types.js'
import { CutoutType } from './types.js'

export type ContainerContextType = DeepRequired<ContainerOpts>

const DEFAULT_VALUES: ContainerContextType = {
  radius: 4,
  edges: Edge.SIDE,
  gripWidth: 0,
  cutout: {
    type: CutoutType.HEX,
    border: 5,
    borderRadius: 2,
    hexInnerDiameter: 8,
    hexWidth: 1.2,
    center: true,
  },
  cutoutEdges: Edge.NONE,
}

const ContainerContext = createContext<ContainerContextType>(DEFAULT_VALUES)

export const ContainerContextProvider: React.FC<PropsWithChildren<DeepPartial<ContainerContextType>>> = ({
  children,
  ...props
}) => {
  const oldProps = useContainerContext()
  const mergedProps = deepMerge(oldProps, props)

  return <ContainerContext.Provider value={mergedProps}>{children}</ContainerContext.Provider>
}

export const useContainerContext = () => useContext(ContainerContext)
