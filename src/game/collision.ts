export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export const overlapsCircle = (
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number }
): boolean => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const r = a.radius + b.radius
  return dx * dx + dy * dy <= r * r
}
