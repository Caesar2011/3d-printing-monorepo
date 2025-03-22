import type { FC } from 'react'
import type { AxisRecordDefinition } from '@jsxcad/core'

import { Sphere } from './Sphere.js'

export const FilletCorner: FC<{ size: AxisRecordDefinition }> = ({ size }) => {
  return (
    <scale by={size}>
      <subtract>
        <cuboid size={1} />
        <Sphere size={2} />
      </subtract>
    </scale>
  )
}
