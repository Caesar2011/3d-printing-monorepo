import type { AxisRecordDefinition } from './index.js'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      cuboid: {
        size: AxisRecordDefinition
      }
      union: {
        children: JSX.Element[]
      }
      subtract: {
        children: JSX.Element[]
      }
      intersect: {
        children: JSX.Element[]
      }
    }
  }
}
