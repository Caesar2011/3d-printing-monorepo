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
  PrimitiveContextProvider,
  renderComponent,
  RoundedCylinder,
  ShapeContextProvider,
} from '@jsxcad/game'
import { CardContainer } from '@jsxcad/game/dist/card-container/CardContainer.js'

import { logger } from './logger.js'

const App = memo(() => {
  return (
    <entity name={'app'}>
      <DebugAxes x={350} y={80} z={50}>
        <ContainerContextProvider cutout={{ border: 5, borderRadius: 2 }}>
          {/* --- Refactored Container examples --- * /}
          <DividerTest />
          <translate by={{ y: 100 }}>
            <EmbossTest />
          </translate>
          {/* */}
          <PrimitiveContextProvider cylinderSegments={64}>
            <ShapeContextProvider wall={3}>
              {/*<ClosedContainer size={{ x: 80, y: 120, z: 30 }} lid={{ type: 'slide' }} radius={10} />*/}
              <CardContainer
                size={{ x: 80, y: 120, z: 30 }}
                dividerSpacingMin={5}
                dividerRadius={2}
                dividers={[10, 5, 2]}
              />
            </ShapeContextProvider>
          </PrimitiveContextProvider>
        </ContainerContextProvider>

        {/* --- Rounded Cylinder examples --- * /}
        <translate by={{ y: -50 }}>
          <CylinderTest />
        </translate>
        {/* */}
      </DebugAxes>
    </entity>
  )
})

/**
 * Component demonstrating a container with an SVG embossed on a division.
 */
const EmbossTest = memo(() => (
  <translate by={{ x: 100 }}>
    <entity name={'split-half'} type={ShapeType.Part} color={Colors.GREEN_2}>
      <Container
        size={V({ x: 80, y: 60, z: 20 })}
        divisions={{ at: [0.5], children: [{ embossSrc: 'res/energy1-simple.svg' }, {}] }}
        cutoutEdges={Edge.BOT}
        scoop={true}
      />
    </entity>
  </translate>
))

/**
 * Component demonstrating various container and divider configurations.
 */
const DividerTest = memo(() => (
  <>
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
  </>
))

const CylinderTest = () => {
  return (
    <>
      {/* Regular cylinder for comparison */}
      <entity name={'cylinder-plain'} type={ShapeType.Part} color={Colors.GRAY_2}>
        <Cylinder size={{ xy: 20, z: 30 }} />
      </entity>

      {/* Both edges rounded */}
      <translate by={{ x: 30 }}>
        <entity name={'cylinder-round-all'} type={ShapeType.Part} color={Colors.BLUE_2}>
          <RoundedCylinder size={{ xy: 20, z: 30 }} radius={3} edges={CylinderEdge.ALL} />
        </entity>
      </translate>

      {/* Only top edge rounded */}
      <translate by={{ x: 60 }}>
        <entity name={'cylinder-round-top'} type={ShapeType.Part} color={Colors.GREEN_2}>
          <RoundedCylinder size={{ xy: 20, z: 30 }} radius={3} edges={CylinderEdge.TOP} />
        </entity>
      </translate>

      {/* Only bottom edge rounded */}
      <translate by={{ x: 90 }}>
        <entity name={'cylinder-round-bot'} type={ShapeType.Part} color={Colors.ORANGE_2}>
          <RoundedCylinder size={{ xy: 20, z: 30 }} radius={3} edges={CylinderEdge.BOT} />
        </entity>
      </translate>

      {/* Large round radius */}
      <translate by={{ x: 120 }}>
        <entity name={'cylinder-round-large'} type={ShapeType.Part} color={Colors.RED_2}>
          <RoundedCylinder size={{ xy: 30, z: 30 }} radius={10} />
        </entity>
      </translate>
    </>
  )
}

const Root = () => {
  return <App />
}

renderComponent(<Root />).catch(logger.error)
