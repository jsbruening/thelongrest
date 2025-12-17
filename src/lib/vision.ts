/**
 * Vision calculation utilities for line of sight and field of view
 */

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Check if a line segment intersects with a wall
 */
function lineIntersectsWall(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  wall: Wall,
): boolean {
  const { x1: wx1, y1: wy1, x2: wx2, y2: wy2 } = wall;

  // Calculate direction vectors
  const d1x = x2 - x1;
  const d1y = y2 - y1;
  const d2x = wx2 - wx1;
  const d2y = wy2 - wy1;

  // Calculate denominator
  const denominator = d1x * d2y - d1y * d2x;

  // Lines are parallel
  if (Math.abs(denominator) < 0.0001) {
    return false;
  }

  // Calculate intersection point
  const t1 = ((wx1 - x1) * d2y - (wy1 - y1) * d2x) / denominator;
  const t2 = ((wx1 - x1) * d1y - (wy1 - y1) * d1x) / denominator;

  // Check if intersection is within both line segments
  return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
}

/**
 * Check if there's a clear line of sight between two points
 */
export function hasLineOfSight(
  from: Point,
  to: Point,
  walls: Wall[],
): boolean {
  for (const wall of walls) {
    if (lineIntersectsWall(from.x, from.y, to.x, to.y, wall)) {
      return false;
    }
  }
  return true;
}

/**
 * Calculate field of view using raycasting
 * Returns an array of visible points in a circle around the origin
 */
export function calculateFieldOfView(
  origin: Point,
  radius: number,
  walls: Wall[],
  gridSize: number = 1,
): Point[] {
  const visiblePoints: Point[] = [];
  const steps = Math.max(32, Math.floor(radius * 2)); // Number of rays to cast

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    let maxDistance = radius;

    // Cast ray and find closest wall intersection
    for (let distance = gridSize; distance <= radius; distance += gridSize) {
      const x = origin.x + Math.cos(angle) * distance;
      const y = origin.y + Math.sin(angle) * distance;

      // Check if this point hits a wall
      let hitWall = false;
      for (const wall of walls) {
        if (lineIntersectsWall(origin.x, origin.y, x, y, wall)) {
          hitWall = true;
          maxDistance = Math.min(maxDistance, distance);
          break;
        }
      }

      if (hitWall) {
        break;
      }
    }

    // Add visible point at max distance
    const visibleX = origin.x + Math.cos(angle) * maxDistance;
    const visibleY = origin.y + Math.sin(angle) * maxDistance;
    visiblePoints.push({ x: visibleX, y: visibleY });
  }

  return visiblePoints;
}

/**
 * Create a polygon from field of view points
 */
export function createVisionPolygon(
  origin: Point,
  fovPoints: Point[],
): Point[] {
  // Sort points by angle from origin
  const sortedPoints = [...fovPoints].sort((a, b) => {
    const angleA = Math.atan2(a.y - origin.y, a.x - origin.x);
    const angleB = Math.atan2(b.y - origin.y, b.x - origin.x);
    return angleA - angleB;
  });

  return [origin, ...sortedPoints];
}

/**
 * Calculate revealed area for a token based on vision
 */
export function calculateTokenVision(
  tokenPosition: Point,
  visionRadius: number,
  walls: Wall[],
  gridSize: number,
): Point[] {
  if (!visionRadius || visionRadius <= 0) {
    return [];
  }

  // Convert vision radius from feet to grid units (assuming 5 feet per grid square)
  const radiusInGrid = visionRadius / 5;

  const fovPoints = calculateFieldOfView(
    tokenPosition,
    radiusInGrid,
    walls,
    gridSize,
  );

  return createVisionPolygon(tokenPosition, fovPoints);
}

/**
 * Merge multiple vision polygons into a single revealed area
 */
export function mergeVisionPolygons(polygons: Point[][]): Point[] {
  if (polygons.length === 0) {
    return [];
  }

  if (polygons.length === 1) {
    return polygons[0] ?? [];
  }

  // Simple merge: combine all points and create convex hull
  // For a more accurate merge, use polygon union algorithms
  const allPoints: Point[] = [];
  for (const polygon of polygons) {
    allPoints.push(...polygon);
  }

  // Remove duplicates
  const uniquePoints = allPoints.filter(
    (point, index, self) =>
      index ===
      self.findIndex(
        (p) => Math.abs(p.x - point.x) < 0.1 && Math.abs(p.y - point.y) < 0.1,
      ),
  );

  return uniquePoints;
}

