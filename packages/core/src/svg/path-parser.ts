import jscad from '@jscad/modeling'

import type { Vec2 } from './types.js'

const { geometries } = jscad

/**
 * Parses an SVG path `d` attribute into an array of outlines (point arrays).
 * Handles all command types and their relative/absolute variations.
 */
export function parsePath(d: string, segments: number): Vec2[][] {
  const parser = new PathParser(d, segments)
  return parser.parse()
}

class PathParser {
  private x = 0
  private y = 0
  private startX = 0
  private startY = 0
  private bez1X = 0
  private bez1Y = 0
  private bez2X = 0
  private bez2Y = 0
  private currentOutline: Vec2[] = []
  private outlines: Vec2[][] = []
  private readonly tokens: (string | number)[]
  private i = 0

  constructor(
    private readonly d: string,
    private readonly segments: number,
  ) {
    this.tokens = this.tokenize(d)
  }

  private tokenize(d: string): (string | number)[] {
    const tokens: (string | number)[] = []
    const regex = /([MmZzLlHhVvCcSsQqTtAa])|(-?[\d.]+)/g
    let match
    while ((match = regex.exec(d)) !== null) {
      if (match[1]) {
        tokens.push(match[1]) // Command
      } else {
        tokens.push(parseFloat(match[0])) // Number
      }
    }
    return tokens
  }

  private nextIsNumber(): boolean {
    return this.i < this.tokens.length && typeof this.tokens[this.i] === 'number'
  }

  private next(): number {
    if (this.nextIsNumber()) {
      return this.tokens[this.i++] as number
    }
    return 0
  }

  private closePath() {
    if (this.currentOutline.length > 0) {
      this.outlines.push(this.currentOutline)
      this.currentOutline = []
    }
  }

  parse(): Vec2[][] {
    let command = ''
    while (this.i < this.tokens.length) {
      const token = this.tokens[this.i]
      if (typeof token === 'string') {
        command = token
        this.i++
      }

      switch (command) {
        case 'M':
          this.closePath()
          this.x = this.next()
          this.y = this.next()
          this.startX = this.x
          this.startY = this.y
          this.currentOutline.push([this.x, this.y])
          command = 'L' // Implicit subsequent L commands
          break
        case 'm':
          this.closePath()
          this.x += this.next()
          this.y += this.next()
          this.startX = this.x
          this.startY = this.y
          this.currentOutline.push([this.x, this.y])
          command = 'l' // Implicit subsequent l commands
          break
        case 'L':
          while (this.nextIsNumber()) this.lineTo(this.next(), this.next())
          break
        case 'l':
          while (this.nextIsNumber()) this.lineTo(this.x + this.next(), this.y + this.next())
          break
        case 'H':
          while (this.nextIsNumber()) this.lineTo(this.next(), this.y)
          break
        case 'h':
          while (this.nextIsNumber()) this.lineTo(this.x + this.next(), this.y)
          break
        case 'V':
          while (this.nextIsNumber()) this.lineTo(this.x, this.next())
          break
        case 'v':
          while (this.nextIsNumber()) this.lineTo(this.x, this.y + this.next())
          break
        case 'C':
          while (this.nextIsNumber()) this.cubicBezier(this.next(), this.next(), this.next(), this.next(), this.next(), this.next())
          break
        case 'c':
          while (this.nextIsNumber())
            this.cubicBezier(this.x + this.next(), this.y + this.next(), this.x + this.next(), this.y + this.next(), this.x + this.next(), this.y + this.next())
          break
        case 'S':
          while (this.nextIsNumber()) this.smoothCubicBezier(this.next(), this.next(), this.next(), this.next())
          break
        case 's':
          while (this.nextIsNumber()) this.smoothCubicBezier(this.x + this.next(), this.y + this.next(), this.x + this.next(), this.y + this.next())
          break
        case 'Q':
          while (this.nextIsNumber()) this.quadraticBezier(this.next(), this.next(), this.next(), this.next())
          break
        case 'q':
          while (this.nextIsNumber()) this.quadraticBezier(this.x + this.next(), this.y + this.next(), this.x + this.next(), this.y + this.next())
          break
        case 'T':
          while (this.nextIsNumber()) this.smoothQuadraticBezier(this.next(), this.next())
          break
        case 't':
          while (this.nextIsNumber()) this.smoothQuadraticBezier(this.x + this.next(), this.y + this.next())
          break
        case 'A':
          while (this.nextIsNumber()) this.arc(this.next(), this.next(), this.next(), this.next(), this.next(), this.next(), this.next())
          break
        case 'a':
          while (this.nextIsNumber()) this.arc(this.next(), this.next(), this.next(), this.next(), this.next(), this.x + this.next(), this.y + this.next())
          break
        case 'Z':
        case 'z':
          this.lineTo(this.startX, this.startY)
          this.closePath()
          break
        default:
          this.i++ // Skip unknown command
          break
      }
    }
    this.closePath()
    return this.outlines
  }

  private lineTo(x: number, y: number) {
    this.x = x
    this.y = y
    this.currentOutline.push([x, y])
  }

  private cubicBezier(c1x: number, c1y: number, c2x: number, c2y: number, ex: number, ey: number) {
    const path = geometries.path2.appendBezier({
      controlPoints: [[c1x, c1y], [c2x, c2y], [ex, ey]],
      segments: this.segments,
    }, geometries.path2.fromPoints({}, [[this.x, this.y]]))

    this.currentOutline.push(...geometries.path2.toPoints(path).slice(1))
    this.x = ex
    this.y = ey
    this.bez1X = c2x
    this.bez1Y = c2y
  }

  private smoothCubicBezier(c2x: number, c2y: number, ex: number, ey: number) {
    const c1x = 2 * this.x - this.bez1X
    const c1y = 2 * this.y - this.bez1Y
    this.cubicBezier(c1x, c1y, c2x, c2y, ex, ey)
  }

  private quadraticBezier(c1x: number, c1y: number, ex: number, ey: number) {
    this.cubicBezier(
      this.x + (2 / 3) * (c1x - this.x), this.y + (2 / 3) * (c1y - this.y),
      ex + (2 / 3) * (c1x - ex), ey + (2 / 3) * (c1y - ey),
      ex, ey,
    )
    this.bez2X = c1x
    this.bez2Y = c1y
  }

  private smoothQuadraticBezier(ex: number, ey: number) {
    const c1x = 2 * this.x - this.bez2X
    const c1y = 2 * this.y - this.bez2Y
    this.quadraticBezier(c1x, c1y, ex, ey)
  }

  private arc(rx: number, ry: number, xAxisRotation: number, largeArcFlag: number, sweepFlag: number, ex: number, ey: number) {
    const path = geometries.path2.appendArc({
      endpoint: [ex, ey],
      radius: [rx, ry],
      xaxisrotation: (xAxisRotation * Math.PI) / 180,
      clockwise: sweepFlag === 1,
      large: largeArcFlag === 1,
      segments: this.segments,
    }, geometries.path2.fromPoints({}, [[this.x, this.y]]))

    this.currentOutline.push(...geometries.path2.toPoints(path).slice(1))
    this.x = ex
    this.y = ey
  }
}