import type { TProps } from './ShapeType.js'

type Children = {
  children: JSX.Element[]
}

declare module 'react' {
  namespace JSX {
    // eslint-disable-next-line
    interface IntrinsicElements extends TProps {}
  }
}
