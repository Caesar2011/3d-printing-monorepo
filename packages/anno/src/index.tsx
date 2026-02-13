import { memo } from 'react'
import { ShapeType, V } from '@jsxcad/core'
import { Colors, DebugAxes, renderComponent } from '@jsxcad/game'
import { ContainerContextProvider } from '@jsxcad/game/dist/container/ContainerContext.js'
import { Container } from '@jsxcad/game/dist/container/Container.js'
import { CutoutType } from '@jsxcad/game/dist/container/types.js'

import { logger } from './logger.js'

const App = memo(() => {
  return (
    <entity name={'app'}>
      <DebugAxes x={250} y={80} z={50}>
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

          {/* Container with only front and back cutouts, empty (no grid) */}
          <translate by={{ x: 100 }}>
            <entity name={'front-back-empty'} type={ShapeType.Part} color={Colors.GREEN_2}>
              <Container
                size={V({ x: 80, y: 60, z: 40 })}
                cutout={{
                  front: { type: CutoutType.EMPTY },
                  back: { type: CutoutType.EMPTY },
                }}
              />
            </entity>
          </translate>

          {/* Container with hex on sides but custom settings on right */}
          <translate by={{ x: 200 }}>
            <entity name={'custom-right'} type={ShapeType.Part} color={Colors.ORANGE_2}>
              <Container
                size={V({ x: 80, y: 60, z: 40 })}
                radius={6}
                cutout={{
                  side: { hexInnerDiameter: 6, hexWidth: 1 },
                  right: { border: 10 },
                  bottom: { type: CutoutType.EMPTY, border: 8 },
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
