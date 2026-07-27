import type { TProps } from './shapes/index.js'

type Children = {
  children: JSX.Element[]
}

declare module 'react' {
  namespace JSX {
    // eslint-disable-next-line
    interface IntrinsicElements extends TProps {}
  }
}
