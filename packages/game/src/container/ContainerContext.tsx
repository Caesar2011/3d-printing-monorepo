import type { PropsWithChildren } from 'react'
import React, { createContext, useContext } from 'react'

import { Edge } from '../primitives/Cuboid.js'
import type { DeepPartial, DeepRequired } from '../utils/deep-merge.js'
import { deepMerge } from '../utils/deep-merge.js'

import type { ContainerOpts } from './types.js'
import { CutoutGridType } from './types.js'

export type ContainerContextType = DeepRequired<ContainerOpts>

const DEFAULT_VALUES: ContainerContextType = {
  radius: 4,
  edges: Edge.SIDE,
  gripWidth: 0,
  cutout: {
    border: 15,
    type: CutoutGridType.HEX,
    size: 3,
    strokeWidth: 2,
    offset: {},
    center: false,
  },
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
