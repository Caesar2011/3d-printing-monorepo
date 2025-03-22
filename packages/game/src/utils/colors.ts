// Define an RGB tuple type for normalized values [0, 1]

type RGB = [number, number, number]

/**
 * Converts an HSL color value to RGB.
 * h is in degrees [0, 360), s and l are in the range [0, 1].
 * Returns [r, g, b] each in [0, 1].
 */
const hslToRgb = (h: number, s: number, l: number): RGB => {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map((v) => Math.round(255 * v) / 255) as RGB
}

/**
 * Generates a gradient of 5 shades for a given color.
 * The lightness will range linearly from startLightness (darkest)
 * to endLightness (brightest).
 */
function createColorShades(hue: number, saturation: number, startLightness: number, endLightness: number): RGB[] {
  const steps = 5
  const shades: RGB[] = []
  for (let i = 0; i < steps; i++) {
    const l = startLightness + (endLightness - startLightness) * (i / (steps - 1))
    shades.push(hslToRgb(hue, saturation, l))
  }
  return shades
}

// Define our color settings in one place. Each color has its hue, saturation,
// start lightness, and end lightness.
const colorSettings = {
  RED: [0, 0.8, 0.4, 0.9],
  GREEN: [120, 0.8, 0.4, 0.9],
  BLUE: [220, 0.8, 0.4, 0.9],
  ORANGE: [30, 0.8, 0.4, 0.9],
  PURPLE: [280, 0.8, 0.4, 0.9],
  TEAL: [180, 0.8, 0.4, 0.9],
  OLIVE: [80, 0.8, 0.4, 0.9],
  BROWN: [20, 0.7, 0.4, 0.9],
  GRAY: [0, 0, 0.3, 0.7],
  PINK: [340, 0.8, 0.4, 0.9],
} as const

// Derive the allowed color names from our constant object.
type ColorName = keyof typeof colorSettings
type ShadeNumber = 1 | 2 | 3 | 4 | 5

// Define the type for our final colors object.
// Keys will be like "RED_1", "RED_2", …, "RED_5" for each color.
type Colors = {
  [K in ColorName as `${K}_${ShadeNumber}`]: RGB
}

// Build the colors object by iterating over colorSettings.
function buildColors(settings: typeof colorSettings): Colors {
  const result = {} as Colors
  for (const color in settings) {
    const [h, s, startLightness, endLightness] = settings[color as ColorName]
    const shades = createColorShades(h, s, startLightness, endLightness)
    for (let i = 0; i < 5; i++) {
      result[`${color}_${i + 1}` as `${ColorName}_${ShadeNumber}`] = shades[i]
    }
  }
  return result
}

export const Colors = buildColors(colorSettings)
