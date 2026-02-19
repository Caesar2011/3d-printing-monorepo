import { memo } from 'react'
import { ShapeType, V } from '@jsxcad/core'
import {
  Colors,
  Container,
  ContainerContextProvider,
  Cylinder,
  CylinderEdge,
  DebugAxes,
  Edge,
  renderComponent,
  RoundedCylinder,
  SvgShape,
} from '@jsxcad/game'

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
              <Container
                size={V({ x: 80, y: 60, z: 20 })}
                divisions={{ at: [0.5], children: [{ imprintSrc: 'res/energy1-simple.svg' }, {}] }}
                cutoutEdges={Edge.BOT}
                scoop={true}
              />
            </entity>
          </translate>

          {/* Container split in half along X */}
          <translate by={{ x: 100, y: 100 }}>
            <entity name={'split-tray-x'} type={ShapeType.Part} color={Colors.GREEN_3}>
              <Container size={V({ x: 80, y: 60, z: 20 })} cutoutEdges={Edge.BOT} scoop={true} />
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
                edges={Edge.SIDE | Edge.BOT}
                cutout={{
                  side: {},
                  bottom: {},
                }}
              />
            </entity>
          </translate>
          {/* */}
        </ContainerContextProvider>

        {/* --- Rounded Cylinder examples --- */}

        {/* Regular cylinder for comparison */}
        <translate by={{ y: -30 }}>
          <entity name={'cylinder-plain'} type={ShapeType.Part} color={Colors.GRAY_2}>
            <Cylinder size={{ xy: 20, z: 30 }} />
          </entity>
        </translate>

        {/* Both edges rounded */}
        <translate by={{ x: 30, y: -30 }}>
          <entity name={'cylinder-round-all'} type={ShapeType.Part} color={Colors.BLUE_2}>
            <RoundedCylinder size={{ xy: 20, z: 30 }} radius={3} edges={CylinderEdge.ALL} />
          </entity>
        </translate>

        {/* Only top edge rounded */}
        <translate by={{ x: 60, y: -30 }}>
          <entity name={'cylinder-round-top'} type={ShapeType.Part} color={Colors.GREEN_2}>
            <RoundedCylinder size={{ xy: 20, z: 30 }} radius={3} edges={CylinderEdge.TOP} />
          </entity>
        </translate>

        {/* Only bottom edge rounded */}
        <translate by={{ x: 90, y: -30 }}>
          <entity name={'cylinder-round-bot'} type={ShapeType.Part} color={Colors.ORANGE_2}>
            <RoundedCylinder size={{ xy: 20, z: 30 }} radius={3} edges={CylinderEdge.BOT} />
          </entity>
        </translate>

        {/* Large round radius */}
        <translate by={{ x: 120, y: -30 }}>
          <entity name={'cylinder-round-large'} type={ShapeType.Part} color={Colors.RED_2}>
            <RoundedCylinder size={{ xy: 30, z: 30 }} radius={10} />
          </entity>
        </translate>
      </DebugAxes>
      {/* */}
      <entity color={Colors.GREEN_2}>
        <SvgShape file={'res/energy1-simple.svg'} size={100} />
      </entity>
    </entity>
  )
})

const Root = () => {
  return <App />
}

renderComponent(<Root />).catch(logger.error)
