declare module '@jscad/3mf-serializer' {
  import type { Geom3 } from '@jscad/modeling/src/geometries/geom3'
  /**
   * MIME-Type for 3MF files.
   */
  export const mimeType: string

  /**
   * File extension for 3MF files.
   */
  export const fileExtension: string

  /**
   * Options for the 3MF serialization.
   */
  export interface SerializeOptions {
    /**
     * Unit of design.
     * Valid values: 'micron', 'millimeter', 'centimeter', 'inch', 'foot', 'meter'
     * @default 'millimeter'
     */
    unit?: string
    /**
     * If true, metadata (e.g. CreationDate) is included in the 3MF contents.
     * @default true
     */
    metadata?: boolean
    /**
     * Default color as RGBA, e.g. [1, 0.627, 0, 1] for JSCAD Orange.
     * @default [1, 0.627, 0, 1]
     */
    defaultcolor?: number[]
    /**
     * If true, the result is returned as a 3MF package (ZIP).
     * Otherwise, the result is an XML string.
     * @default true
     */
    compress?: boolean
  }

  /**
   * Serializes one or more 3D geometries (geom3) to 3MF contents.
   *
   * @param options - Options for serialization.
   * @param objects - One or more objects to serialize.
   * @returns If `compress` is true (or omitted, default true), an ArrayBuffer[] containing the 3MF package.
   *          Otherwise, a string[] containing the XML contents.
   *
   * @example
   * const geometry = primitives.cube();
   * // With compression (default): returns an ArrayBuffer[]
   * const package = serialize({ unit: 'meter' }, geometry);
   *
   * // Without compression: returns a string[]
   * const xml = serialize({ compress: false }, geometry);
   */
  export function serialize(
    options: { compress: true; unit?: string; metadata?: boolean; defaultcolor?: number[] } | undefined,
    ...objects: Geom3[]
  ): ArrayBuffer[]

  export function serialize(
    options: { compress?: false; unit?: string; metadata?: boolean; defaultcolor?: number[] } | undefined,
    ...objects: Geom3[]
  ): string[]
}
