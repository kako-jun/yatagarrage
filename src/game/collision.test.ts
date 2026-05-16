import { describe, expect, it } from 'vitest'
import { clamp, overlapsCircle } from './collision'

describe('clamp', () => {
  it('returns value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to min when below the range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to max when above the range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('handles equal min and max as fixed value', () => {
    expect(clamp(99, 5, 5)).toBe(5)
  })
})

describe('overlapsCircle', () => {
  it('detects overlap when distance is less than sum of radii', () => {
    const a = { x: 0, y: 0, radius: 5 }
    const b = { x: 5, y: 0, radius: 5 }
    expect(overlapsCircle(a, b)).toBe(true)
  })

  it('detects boundary touch (distance == sum of radii) as overlap', () => {
    const a = { x: 0, y: 0, radius: 5 }
    const b = { x: 10, y: 0, radius: 5 }
    expect(overlapsCircle(a, b)).toBe(true)
  })

  it('returns false when distance is greater than sum of radii', () => {
    const a = { x: 0, y: 0, radius: 5 }
    const b = { x: 11, y: 0, radius: 5 }
    expect(overlapsCircle(a, b)).toBe(false)
  })

  it('handles zero radius correctly (point inside other circle)', () => {
    const a = { x: 0, y: 0, radius: 0 }
    const b = { x: 3, y: 4, radius: 5 }
    expect(overlapsCircle(a, b)).toBe(true) // distance 5 == radius 5
  })

  it('returns false for distant circles', () => {
    const a = { x: 0, y: 0, radius: 10 }
    const b = { x: 100, y: 100, radius: 10 }
    expect(overlapsCircle(a, b)).toBe(false)
  })

  it('is symmetric', () => {
    const a = { x: 0, y: 0, radius: 5 }
    const b = { x: 8, y: 0, radius: 5 }
    expect(overlapsCircle(a, b)).toBe(overlapsCircle(b, a))
  })
})
