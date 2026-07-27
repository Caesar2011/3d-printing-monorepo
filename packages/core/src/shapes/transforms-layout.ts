import type { Shape } from './Shape.js'
import { OperatorNode } from './OperatorNode.js'

const layoutAxes = ['x', 'y', 'z'] as const
type LayoutAxis = (typeof layoutAxes)[number]
type LayoutAlign = 'after' | 'before' | 'center' | 'start' | 'end'
type LayoutPosition = Partial<Record<LayoutAxis, string>> & { align?: LayoutAlign; gap?: number }
type LayoutItemProps = { id: string; layout?: LayoutPosition[] }
type LayoutProps = { gap?: number }
type LayoutItemShapes = { id: string; layout?: LayoutPosition[]; shapes: Shape[] }
type Translation = Record<LayoutAxis, number>
type LayoutConstraint = {
  reference: LayoutItemShapes
  align: LayoutAlign
  gap: number
  referenceTranslation: number
}

function boundingBox(shapes: Shape[]) {
  if (shapes.length === 0) throw new RangeError('Layout items must render at least one shape')
  const boxes = shapes.map((shape) => shape.boundingBox)
  const min = boxes.reduce((result, box) => result.min(box.position), boxes[0].position)
  const max = boxes.reduce((result, box) => result.max(box.position.a(box.size)), boxes[0].position.a(boxes[0].size))
  return { min, max }
}

function layoutConstraints(
  item: LayoutItemShapes,
  axis: LayoutAxis,
  byId: Map<string, LayoutItemShapes>,
  resolve: (id: string) => number,
  defaultGap: number,
): LayoutConstraint[] {
  return (item.layout ?? [])
    .map((position) => {
      const referencedAxes = layoutAxes.filter((candidate) => position[candidate] !== undefined)
      if (referencedAxes.length !== 1) throw new Error('Each layout position must reference exactly one axis')

      const referenceId = position[axis]
      if (referenceId === undefined) return undefined

      const reference = byId.get(referenceId)
      if (!reference) throw new Error(`Layout item "${item.id}" references unknown item "${referenceId}"`)

      const align = position.align ?? 'after'
      const gap = position.gap ?? (align === 'before' || align === 'after' ? defaultGap : 0)
      return { reference, align, gap, referenceTranslation: resolve(referenceId) }
    })
    .filter((constraint): constraint is LayoutConstraint => constraint !== undefined)
}

function resolveStationaryTranslation(
  id: string,
  axis: LayoutAxis,
  item: LayoutItemShapes,
  constraints: LayoutConstraint[],
): number {
  if (constraints.length > 1)
    throw new Error(`Layout item "${id}" has incompatible ${axis}-axis constraints (max one start/center/end)`)

  const { reference, align, gap, referenceTranslation } = constraints[0]
  const itemBox = boundingBox(item.shapes)
  const referenceBox = boundingBox(reference.shapes)
  const itemMin = itemBox.min[axis]
  const itemMax = itemBox.max[axis]

  if (align === 'start') return referenceBox.min[axis] + referenceTranslation + gap - itemMin
  if (align === 'end') return referenceBox.max[axis] + referenceTranslation - gap - itemMax
  return (referenceBox.min[axis] + referenceBox.max[axis]) / 2 + referenceTranslation + gap - (itemMin + itemMax) / 2
}

function resolveDirectionalTranslation(
  id: string,
  axis: LayoutAxis,
  item: LayoutItemShapes,
  constraints: LayoutConstraint[],
): number {
  const after = constraints.filter(({ align }) => align === 'after')
  const before = constraints.filter(({ align }) => align === 'before')
  if (after.length > 0 && before.length > 0)
    throw new Error(`Layout item "${id}" cannot be both before and after on ${axis}-axis`)

  const itemBox = boundingBox(item.shapes)
  return after.length > 0
    ? Math.max(
        ...after.map(
          ({ reference, gap, referenceTranslation }) =>
            boundingBox(reference.shapes).max[axis] + referenceTranslation + gap,
        ),
      ) - itemBox.min[axis]
    : Math.min(
        ...before.map(
          ({ reference, gap, referenceTranslation }) =>
            boundingBox(reference.shapes).min[axis] + referenceTranslation - gap,
        ),
      ) - itemBox.max[axis]
}

function resolveTranslation(
  id: string,
  axis: LayoutAxis,
  item: LayoutItemShapes,
  constraints: LayoutConstraint[],
): number {
  if (constraints.length === 0) return 0

  const stationary = constraints.filter(({ align }) => align !== 'after' && align !== 'before')
  if (stationary.length > 0) {
    if (stationary.length !== constraints.length)
      throw new Error(
        `Layout item "${id}" has incompatible ${axis}-axis constraints (cannot mix start/center/end with after/before)`,
      )
    return resolveStationaryTranslation(id, axis, item, stationary)
  }

  return resolveDirectionalTranslation(id, axis, item, constraints)
}

function resolveLayout(items: LayoutItemShapes[], defaultGap = 0): Map<string, Translation> {
  const byId = new Map(items.map((item) => [item.id, item]))
  if (byId.size !== items.length) throw new Error('Layout item ids must be unique')
  const translations = new Map(items.map((item) => [item.id, { x: 0, y: 0, z: 0 }]))

  for (const axis of layoutAxes) {
    const resolved = new Set<string>()
    const resolving = new Set<string>()
    const resolve = (id: string): number => {
      if (resolved.has(id)) return translations.get(id)![axis]
      if (resolving.has(id)) throw new Error(`Circular layout reference on ${axis}-axis involving "${id}"`)
      const item = byId.get(id)
      if (!item) throw new Error(`Unknown layout item "${id}"`)
      resolving.add(id)
      const constraints = layoutConstraints(item, axis, byId, resolve, defaultGap)
      translations.get(id)![axis] = resolveTranslation(id, axis, item, constraints)
      resolving.delete(id)
      resolved.add(id)
      return translations.get(id)![axis]
    }
    items.forEach((item) => resolve(item.id))
  }
  return translations
}

export class LayoutItemNode extends OperatorNode<LayoutItemProps> {
  public getClass(): new (props: unknown) => OperatorNode<LayoutItemProps> {
    return LayoutItemNode
  }
  public renderFn(children: Shape[]): Shape[] {
    return children
  }
}

export class LayoutNode extends OperatorNode<LayoutProps> {
  public getClass(): new (props: unknown) => OperatorNode<LayoutProps> {
    return LayoutNode
  }
  public renderFn(): Shape[] {
    if (!this.children.every((child) => child instanceof LayoutItemNode)) {
      throw new Error('<layout> accepts only <layoutItem> children')
    }
    const itemShapes = (this.children as LayoutItemNode[]).map((item) => ({
      id: item.props.id,
      layout: item.props.layout,
      shapes: item.render(),
    }))
    const translations = resolveLayout(itemShapes, this.props.gap)
    return itemShapes
      .map(({ id, shapes }) => shapes.map((shape) => shape.translate({ by: translations.get(id)! })))
      .flat()
  }
}
