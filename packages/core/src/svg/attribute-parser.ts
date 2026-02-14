import jscad from '@jscad/modeling'
import type { Color } from '@jscad/modeling/src/geometries/types.js'

import { logger } from '../logger.js'

const { maths } = jscad
const { mat4 } = maths

// --- Color Parsing ---

// Based on https://www.w3.org/TR/SVG11/types.html#ColorKeywords
const svgColors: Record<string, [number, number, number]> = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50],
}

/** Parses an SVG color string into an RGBA array. */
export function parseColor(value: string | undefined): Color | undefined {
  if (value === undefined || value.toLowerCase() === 'none') {
    return undefined
  }

  const nameColor = svgColors[value.toLowerCase()] as (typeof svgColors)[keyof typeof svgColors] | undefined
  if (nameColor) {
    return [nameColor[0] / 255, nameColor[1] / 255, nameColor[2] / 255, 1]
  }

  if (value.startsWith('#')) {
    const hex = value.slice(1)
    if (hex.length === 3) {
      const [r, g, b] = hex.split('').map((c) => parseInt(c + c, 16))
      return [r / 255, g / 255, b / 255, 1]
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return [r / 255, g / 255, b / 255, 1]
    }
  }

  const rgbMatch = value.match(/rgb\(\s*(\d+%?)\s*,\s*(\d+%?)\s*,\s*(\d+%?)\s*\)/)
  if (rgbMatch) {
    const parse = (v: string) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseInt(v))
    return [parse(rgbMatch[1]) / 255, parse(rgbMatch[2]) / 255, parse(rgbMatch[3]) / 255, 1]
  }

  logger.warn(`SVG: unsupported color format "${value}"`)
  return undefined
}

// --- Unit Parsing ---

const inchMM = 25.4
const ptMM = inchMM / 72
const pcMM = ptMM * 12

export function parseUnits(value: string | undefined, pmm = 3.54): number {
  if (value === undefined) return 0
  const num = parseFloat(value)
  if (isNaN(num)) return 0

  if (value.endsWith('mm')) return num
  if (value.endsWith('cm')) return num * 10
  if (value.endsWith('in')) return num * inchMM
  if (value.endsWith('pt')) return num * ptMM
  if (value.endsWith('pc')) return num * pcMM
  // Assume pixels/user units otherwise
  return num / pmm
}

// --- Transform Parsing ---

const TRANSFORM_REGEX = /(\w+)\s*\(([^)]+)\)/g

export function parseTransform(transformStr: string | undefined): jscad.maths.mat4.Mat4 | undefined {
  if (transformStr === undefined) return undefined

  const matrix: jscad.maths.mat4.Mat4 = mat4.create()
  let match: RegExpExecArray | null

  while ((match = TRANSFORM_REGEX.exec(transformStr))) {
    const [, name, argsStr] = match
    const args = argsStr
      .trim()
      .split(/[\s,]+/)
      .map(parseFloat)

    switch (name.toLowerCase()) {
      case 'translate': {
        const tx = args[0] || 0
        const ty = args.length > 1 ? args[1] : 0
        mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [tx, ty, 0]))
        break
      }
      case 'scale': {
        const sx = args[0] || 1
        const sy = args.length > 1 ? args[1] : sx
        mat4.multiply(matrix, matrix, mat4.fromScaling(mat4.create(), [sx, sy, 1]))
        break
      }
      case 'rotate': {
        const angle = (args[0] * Math.PI) / 180
        if (args.length > 1) {
          const [cx, cy] = args.slice(1)
          mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [cx, cy, 0]))
          mat4.multiply(matrix, matrix, mat4.fromZRotation(mat4.create(), angle))
          mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [-cx, -cy, 0]))
        } else {
          mat4.multiply(matrix, matrix, mat4.fromZRotation(mat4.create(), angle))
        }
        break
      }
      case 'matrix':
        if (args.length === 6) {
          const [a, b, c, d, e, f] = args
          const m: jscad.maths.mat4.Mat4 = [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1]
          mat4.multiply(matrix, matrix, m)
        }
        break
      default:
        logger.warn(`SVG: unsupported transform function "${name}"`)
        break
    }
  }
  return matrix
}
