/**
 * Palm Geometry Utilities
 * Pure geometric calculations for palm feature extraction
 * No palmistry interpretation - only measurements
 */

export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Line {
  start: Point2D
  end: Point2D
}

export interface Angle {
  degrees: number
  radians: number
}

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate angle between three points (p2 is the vertex)
 */
export function angleBetweenPoints(p1: Point2D, p2: Point2D, p3: Point2D): Angle {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }

  const dot = v1.x * v2.x + v1.y * v2.y
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

  const cosAngle = dot / (mag1 * mag2)
  const radians = Math.acos(Math.max(-1, Math.min(1, cosAngle))) // Clamp to avoid NaN
  const degrees = (radians * 180) / Math.PI

  return { degrees, radians }
}

/**
 * Calculate curvature of a line segment (approximation using three points)
 * Returns curvature value (higher = more curved)
 */
export function calculateCurvature(p1: Point2D, p2: Point2D, p3: Point2D): number {
  const angle = angleBetweenPoints(p1, p2, p3)
  const dist1 = distance(p1, p2)
  const dist2 = distance(p2, p3)

  if (dist1 === 0 || dist2 === 0) return 0

  // Curvature approximation: angle deviation from straight line
  const straightAngle = 180
  const deviation = Math.abs(angle.degrees - straightAngle)
  return deviation / (dist1 + dist2)
}

/**
 * Calculate aspect ratio (width/height)
 */
export function aspectRatio(width: number, height: number): number {
  if (height === 0) return 0
  return width / height
}

/**
 * Calculate area of a polygon using shoelace formula
 */
export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0

  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area) / 2
}

/**
 * Calculate centroid of a set of points
 */
export function centroid(points: Point2D[]): Point2D {
  if (points.length === 0) return { x: 0, y: 0 }

  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  )

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  }
}

/**
 * Calculate bounding box of a set of points
 */
export function boundingBox(points: Point2D[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Calculate length of a polyline (sum of distances between consecutive points)
 */
export function polylineLength(points: Point2D[]): number {
  if (points.length < 2) return 0

  let totalLength = 0
  for (let i = 0; i < points.length - 1; i++) {
    totalLength += distance(points[i], points[i + 1])
  }
  return totalLength
}

/**
 * Calculate average distance from points to a line
 * (measure of how well points fit a line)
 */
export function averageDistanceToLine(points: Point2D[], line: Line): number {
  if (points.length === 0) return 0

  const lineLength = distance(line.start, line.end)
  if (lineLength === 0) {
    // Line is a point, calculate distance to that point
    return (
      points.reduce((sum, p) => sum + distance(p, line.start), 0) / points.length
    )
  }

  // Distance from point to line segment
  const distances = points.map((p) => {
    const A = p.x - line.start.x
    const B = p.y - line.start.y
    const C = line.end.x - line.start.x
    const D = line.end.y - line.start.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    const param = lenSq !== 0 ? dot / lenSq : -1

    let xx: number, yy: number

    if (param < 0) {
      xx = line.start.x
      yy = line.start.y
    } else if (param > 1) {
      xx = line.end.x
      yy = line.end.y
    } else {
      xx = line.start.x + param * C
      yy = line.start.y + param * D
    }

    const dx = p.x - xx
    const dy = p.y - yy
    return Math.sqrt(dx * dx + dy * dy)
  })

  return distances.reduce((sum, d) => sum + d, 0) / distances.length
}

/**
 * Calculate orientation angle of a line or set of points (in degrees)
 * Returns angle from horizontal (0-360)
 */
export function orientation(points: Point2D[]): number {
  if (points.length < 2) return 0

  const bbox = boundingBox(points)
  const dx = bbox.maxX - bbox.minX
  const dy = bbox.maxY - bbox.minY

  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  return angle < 0 ? angle + 360 : angle
}

/**
 * Normalize points to 0-1 range (relative to bounding box)
 */
export function normalizePoints(points: Point2D[]): Point2D[] {
  if (points.length === 0) return []

  const bbox = boundingBox(points)
  if (bbox.width === 0 && bbox.height === 0) return points

  return points.map((p) => ({
    x: (p.x - bbox.minX) / bbox.width,
    y: (p.y - bbox.minY) / bbox.height,
  }))
}
