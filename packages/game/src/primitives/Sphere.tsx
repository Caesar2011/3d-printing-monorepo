import type { FC } from 'react'

import { usePrimitiveContext } from './PrimitiveContext.js'

import IntrinsicElements = React.JSX.IntrinsicElements

export const Sphere: FC<Omit<IntrinsicElements['sphere'], 'segments'> & { segments?: number }> = (props) => {
  const segments = props.segments ?? usePrimitiveContext().sphereSegments
  return <sphere {...{ ...props, segments }} />
}
