import type { AxisRecordDefinition } from '@jsxcad/core/dist/Vector3.js'
import { V } from '@jsxcad/core/dist/Vector3.js'

import { Cuboid, Fillet } from '../primitives/index.js'

interface DividerCutoutProps {
  dim: AxisRecordDefinition
  upperFiletRadius: number
}

export const DividerCutout = ({ dim, upperFiletRadius }: DividerCutoutProps) => (
  <union>
    <translate by={{ yz: V(dim) }}>
      <rotate by={{ y: Math.PI / 2 }}>
        <Fillet size={{ z: V(dim).x, xy: upperFiletRadius }} />
      </rotate>
    </translate>
    <translate by={{ xz: V(dim) }}>
      <rotate by={{ y: Math.PI / 2, z: Math.PI }}>
        <Fillet size={{ z: V(dim).x, xy: upperFiletRadius }} />
      </rotate>
    </translate>
    <Cuboid size={dim} />
  </union>
)
