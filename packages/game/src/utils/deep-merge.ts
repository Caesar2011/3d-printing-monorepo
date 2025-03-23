// Create a DeepPartial type to allow nested properties to be optional.
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// A helper function that recursively merges two objects.
// It takes the original value and the partial update, and returns a merged value.
export function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  const output = { ...target } as T
  for (const key in source) {
    if (!(key in source)) continue

    const sourceVal = source[key]
    const targetVal = target[key]

    // If the source property is an object and not an array, merge recursively.
    if (sourceVal !== undefined && sourceVal !== null && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
      output[key] = deepMerge(targetVal, sourceVal)
    } else {
      output[key] = (sourceVal as T[Extract<keyof T, string>]) ?? targetVal
    }
  }
  return output
}
