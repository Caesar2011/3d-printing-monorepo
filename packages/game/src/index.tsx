import { memo } from 'react'
import { ShapeType } from '@jsxcad/core/dist/Shape.js'
import { V } from '@jsxcad/core'

import { Cuboid } from './Cuboid.js'
import { renderComponent } from './render-component.js'
import { Colors } from './colors.js'
import { HexGrid } from './HexGrid.js'

const App = memo(() => {
  const dim = V({ x: 200, y: 100, z: 2 })
  return (
    <>
      <HexGrid size={dim} hexInnerDiameter={10} hexWidth={1.1} center={true} />
      <subtract name={'outer'} type={ShapeType.Technical} color={Colors.BLUE_2}>
        <translate by={{ xy: -0.1 }}>
          <Cuboid size={dim.a({ xy: 0.2 })} />
        </translate>
        <Cuboid size={dim} />
      </subtract>
    </>
  )
})

const Root = () => {
  return <App />
}

renderComponent(<Root />).catch(console.error)
