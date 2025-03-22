import type { FC } from 'react'
import type { AxisRecordDefinition } from '@jsxcad/core'

import { Cylinder } from './Cylinder.js'

export const Fillet: FC<{ size: AxisRecordDefinition }> = ({ size }) => {
  return (
    <scale by={size}>
      <subtract>
        <cuboid size={1} />
        <Cylinder size={2} />
      </subtract>
    </scale>
  )
}
