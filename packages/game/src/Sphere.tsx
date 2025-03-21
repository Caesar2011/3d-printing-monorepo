import type { FC, JSX } from 'react'

import { usePrimitiveContext } from './PrimitiveContext.js'

export const Sphere: FC<Omit<JSX.IntrinsicElements['sphere'], 'segments'> & { segments?: number }> = (props) => {
  const segments = props.segments ?? usePrimitiveContext().sphereSegments
  return <sphere {...{ ...props, segments }} />
}
