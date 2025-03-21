import type { FC, PropsWithChildren } from 'react'
import { memo, createContext, useContext } from 'react'
import { compile } from '@jsxcad/core/dist/compile.js'
import { render } from '@jsxcad/core'

const MyCtx = createContext(4)

const MyCtxProvider: FC<PropsWithChildren<{ newNumber: number }>> = ({ newNumber, children }) => {
  return <MyCtx.Provider value={newNumber}>{children}</MyCtx.Provider>
}

const App = memo(() => {
  const me = useContext(MyCtx)
  return (
    <subtract>
      <cuboid size={me} />
      <cuboid size={3} />
    </subtract>
  )
})

const Root = () => {
  return (
    <>
      <MyCtxProvider newNumber={10}>
        <App />
        <App />
      </MyCtxProvider>
      <App />
    </>
  )
}

;(async () => compile(await render(<Root />), { fileDir: import.meta.dirname, dev: true }))()
