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
    lap: number
  }
}
