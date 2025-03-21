export function range(stop: number): number[]
export function range(start: number, stop: number): number[]
export function range(start: number, stop: number, step: number): number[]
export function range(a: number, b?: number, c?: number): number[] {
  const [start, stop, step] = b === undefined ? [0, a, 1] : c === undefined ? [a, b, 1] : [a, b, c]

  if (step === 0) throw new Error('range() arg 3 must not be zero')

  const result: number[] = []
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i)
  }
  return result
}
