import { memo } from 'react'
import { ShapeType, V } from '@jsxcad/core'
import { Colors, DebugAxes, renderComponent, ContainerContextProvider, Container } from '@jsxcad/game'

import { logger } from './logger.js'

const App = memo(() => {
  return (
    <entity name={'app'}>
      <DebugAxes x={350} y={80} z={50}>
        <ContainerContextProvider cutout={{ border: 5, borderRadius: 2 }}>
          {/* Simple container with hex cutouts on all sides and bottom */}
          <entity name={'full-cutout-box'} type={ShapeType.Part} color={Colors.BLUE_2}>
            <Container
              size={V({ x: 80, y: 60, z: 40 })}
              cutout={{
                side: {},
                bottom: {},
              }}
            />
          </entity>

          {/* Container split in half along X */}
          <translate by={{ x: 100 }}>
            <entity name={'split-half'} type={ShapeType.Part} color={Colors.GREEN_2}>
              <Container size={V({ x: 80, y: 60, z: 40 })} divisions={{ at: [0.5] }} />
            </entity>
          </translate>

          {/* Container split into 3 columns, left column further split into 2 rows */}
          <translate by={{ x: 200 }}>
            <entity name={'complex-split'} type={ShapeType.Part} color={Colors.ORANGE_2}>
              <Container
                size={V({ x: 120, y: 80, z: 40 })}
                divisions={{
                  at: [0.333, 0.666],
                  children: [{ at: [0.5] }, null, { at: [0.333, 0.666] }],
                }}
                cutout={{
                  side: {},
                  bottom: {},
                }}
              />
            </entity>
          </translate>
        </ContainerContextProvider>
      </DebugAxes>
    </entity>
  )
})

const Root = () => {
  return <App />
}

renderComponent(<Root />).catch(logger.error)
