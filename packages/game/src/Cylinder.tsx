import type { FC, JSX } from 'react'

import { usePrimitiveContext } from './PrimitiveContext.js'

export const Cylinder: FC<Omit<JSX.IntrinsicElements['cylinder'], 'segments'> & { segments?: number }> = (props) => {
  const segments = props.segments ?? usePrimitiveContext().cylinderSegments
  return <cylinder {...{ ...props, segments }} />
}
