import type { PropsWithChildren } from 'react'
import React, { createContext, useContext } from 'react'

import { Edge } from '../primitives/Cuboid.js'
import type { DeepPartial, DeepRequired } from '../utils/deep-merge.js'
import { deepMerge } from '../utils/deep-merge.js'

import type { ContainerContextOpts } from './types.js'
import { CutoutType } from './types.js'

export type ContainerContextType = DeepRequired<ContainerContextOpts>

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
  scoopFactor: 1.3,
  maxImprintSize: { x: 40, y: 40, z: 0.5 },
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
