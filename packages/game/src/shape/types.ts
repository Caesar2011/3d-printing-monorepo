export type ShapeSpecs = {
  wall: number
  floor: number
  tolerance: {
    magnet: {
      diameter: {
        horizontal: number
        vertical: number
      }
      height: number
    }
    sliding: number
    pressFit: number
  }
}
