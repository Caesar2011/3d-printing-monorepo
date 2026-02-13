import { describe, expect, test } from 'vitest'

import type { RecordDefinition } from './Vector3.js'
import { axisOrRecordToVec3, axisToVec3, Vector3 } from './Vector3.js'

interface TestCase {
  input: Parameters<typeof axisToVec3>[0]
  expected: [number, number, number]
  description: string
}

const testCases: TestCase[] = [
  {
    input: undefined,
    expected: [0, 0, 0],
    description: 'undefined input should yield [0, 0, 0]',
  },
  {
    input: 5,
    expected: [5, 5, 5],
    description: 'a number (5) should yield [5, 5, 5]',
  },
  {
    input: [5],
    expected: [5, 0, 0],
    description: 'a one-element array [5] should yield [5, 0, 0]',
  },
  {
    input: [2, 7],
    expected: [2, 7, 0],
    description: 'a two-element array [2, 7] should yield [2, 7, 0]',
  },
  {
    input: [1, 2, 3],
    expected: [1, 2, 3],
    description: 'a three-element array [1, 2, 3] should yield [1, 2, 3]',
  },
  {
    input: new Vector3(3),
    expected: [3, 3, 3],
    description: 'new Vector3(3) should yield [3, 3, 3]',
  },
]

describe('axisToVec3', () => {
  test.each(testCases)('$description', ({ input, expected }) => {
    const result = axisToVec3(input)
    expect(result).toEqual(expected)
  })
})

interface AxisOrRecordTestCase {
  args: Parameters<typeof axisOrRecordToVec3>
  expected: [number, number, number]
  description: string
}

const axisOrRecordTestCases: AxisOrRecordTestCase[] = [
  {
    args: [],
    expected: [0, 0, 0],
    description: 'no arguments should yield [0, 0, 0]',
  },
  {
    args: [[5]],
    expected: [5, 0, 0],
    description: 'a one-element array [5] should yield [5, 0, 0]',
  },
  {
    args: [[2, 7]],
    expected: [2, 7, 0],
    description: 'a two-element array [2, 7] should yield [2, 7, 0]',
  },
  {
    args: [[1, 2, 3]],
    expected: [1, 2, 3],
    description: 'a three-element array [1, 2, 3] should yield [1, 2, 3]',
  },
  {
    args: [new Vector3([3, 3, 3])],
    expected: [3, 3, 3],
    description: 'a Vector3 instance should yield its values [3, 3, 3]',
  },
  {
    args: [{ x: 1, y: 2, z: 3 } as RecordDefinition],
    expected: [1, 2, 3],
    description: 'a record with x, y, z should yield [1, 2, 3]',
  },
  {
    args: [{ xy: 2 }],
    expected: [2, 2, 0],
    description: 'a record with only the xy property should yield [2, 2, 0]',
  },
  {
    args: [{ x: 1, xy: 2, xz: 3, xyz: 4, y: 5, yz: 6, z: 7 }],
    expected: [10, 17, 20],
    description: 'a record with multiple properties should yield the sum of components [10, 17, 20]',
  },
]

describe('axisOrRecordToVec3', () => {
  test.each(axisOrRecordTestCases)('$description', ({ args, expected }) => {
    const result = axisOrRecordToVec3(...args)
    expect(result).toEqual(expected)
  })
})
