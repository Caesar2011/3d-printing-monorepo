import { memo } from 'react'
import { ShapeType, V } from '@jsxcad/core'
import { HexGrid, Cuboid, Colors, renderComponent } from '@jsxcad/game'

import { logger } from './logger.js'

const App = memo(() => {
  const dim = V({ x: 200, y: 100, z: 2 })
  return (
    <entity name={'app'}>
      <entity name={'hex'}>
        <HexGrid size={dim} hexInnerDiameter={10} hexWidth={1} center={true} />
      </entity>
      <subtract name={'outer'} type={ShapeType.Technical} color={Colors.BLUE_2}>
        <translate by={{ xy: -0.1 }}>
          <Cuboid size={dim.a({ xy: 0.2 })} />
        </translate>
        <Cuboid size={dim} />
      </subtract>
    </entity>
  )
})

const Root = () => {
  return <App />
}

renderComponent(<Root />).catch(logger.error)
