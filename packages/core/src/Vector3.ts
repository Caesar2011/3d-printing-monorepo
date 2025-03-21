export type Vec1 = [number]
export type Vec2 = [number, number]
export type Vec3 = [number, number, number]
export type Vec = Vec1 | Vec2 | Vec3

export type UniqueAxisString = 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz'
export type AxisDefinition = Vec | Vector3 | number
export type RecordDefinition = Partial<Record<UniqueAxisString, AxisDefinition>>
export type AxisRecordDefinition = AxisDefinition | RecordDefinition

export class Vector3 {
  private readonly values: Vec3

  constructor(a?: AxisRecordDefinition) {
    this.values = axisOrRecordToVec3(a)
  }

  public elementWiseOther(other: AxisRecordDefinition, fn: (a: number, b: number) => number): Vector3 {
    const otherVec = axisOrRecordToVec3(other)
    return new Vector3(this.values.map((val, idx) => fn(val, otherVec[idx])) as Vec3)
  }

  public elementWise(fn: (a: number) => number): Vector3 {
    return new Vector3(this.values.map(fn) as Vec3)
  }

  public a(add: AxisRecordDefinition): Vector3 {
    return this.elementWiseOther(add, (a, b) => a + b)
  }

  public s(add: AxisRecordDefinition): Vector3 {
    return this.elementWiseOther(add, (a, b) => a - b)
  }

  public m(add: AxisRecordDefinition): Vector3 {
    return this.elementWiseOther(add, (a, b) => a * b)
  }

  public d(add: AxisRecordDefinition): Vector3 {
    return this.elementWiseOther(add, (a, b) => a / b)
  }

  public min(b: AxisRecordDefinition): Vector3 {
    return this.elementWiseOther(b, (a, b) => Math.min(a, b))
  }

  public max(b: AxisRecordDefinition): Vector3 {
    return this.elementWiseOther(b, (a, b) => Math.max(a, b))
  }

  public get abs(): Vector3 {
    return this.elementWise(Math.abs)
  }

  public get v(): Vec3 {
    return [...this.values]
  }

  public get x(): number {
    return this.values[0]
  }

  public get y(): number {
    return this.values[1]
  }

  public get z(): number {
    return this.values[2]
  }

  public get volume(): number {
    return this.x * this.y * this.z
  }
}

export function V(a?: AxisRecordDefinition): Vector3 {
  return new Vector3(a)
}

export function axisOrRecordToVec3(a?: AxisRecordDefinition): Vec3 {
  if (a === undefined) {
    return [0, 0, 0]
  } else if (typeof a !== 'object' || Array.isArray(a) || a instanceof Vector3) {
    return axisToVec3(a)
  } else {
    return [
      axisToVec3(a.x)[0] + axisToVec3(a.xy)[0] + axisToVec3(a.xz)[0] + axisToVec3(a.xyz)[0],
      axisToVec3(a.y)[1] + axisToVec3(a.xy)[1] + axisToVec3(a.yz)[1] + axisToVec3(a.xyz)[1],
      axisToVec3(a.z)[2] + axisToVec3(a.xz)[2] + axisToVec3(a.yz)[2] + axisToVec3(a.xyz)[2],
    ]
  }
}

export function axisToVec3(axis: AxisDefinition | undefined): Vec3 {
  function isVec(v: unknown): v is Vec {
    return Array.isArray(axis) && typeof axis[0] === 'number'
  }

  if (axis === undefined) return [0, 0, 0]
  if (isVec(axis)) {
    return [axis[0], axis[1] ?? 0, axis[2] ?? 0]
  }
  if (typeof axis === 'number') return [axis, axis, axis]

  return axis.v
}
