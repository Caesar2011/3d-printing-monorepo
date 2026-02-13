import type { FC } from 'react'

import { usePrimitiveContext } from './PrimitiveContext.js'

import IntrinsicElements = React.JSX.IntrinsicElements

export const Cylinder: FC<Omit<IntrinsicElements['cylinder'], 'segments'> & { segments?: number }> = (props) => {
  const segments = props.segments ?? usePrimitiveContext().cylinderSegments
  return <cylinder {...{ ...props, segments }} />
}
