/**
 * Shared scaling utilities to ensure consistent field positioning
 * across design page, data preview, and export
 */

export interface ScalingInfo {
  scale: number;
  scaledWidth: number;
  scaledHeight: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Calculate scaling to fit content within container while maintaining aspect ratio
 * This matches the logic used in CanvasEditor
 */
export function calculateScaling(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
): ScalingInfo {
  const scaleX = targetWidth / originalWidth;
  const scaleY = targetHeight / originalHeight;
  const scale = Math.min(scaleX, scaleY); // Allow scaling up beyond 100%

  return {
    scale,
    scaledWidth: originalWidth * scale,
    scaledHeight: originalHeight * scale,
    originalWidth,
    originalHeight,
  };
}

/**
 * Convert original coordinates to scaled coordinates
 * Used in design page for field positioning
 */
export function scaleCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
) {
  return {
    x: x * scale,
    y: y * scale,
    width: width * scale,
    height: height * scale,
  };
}

/**
 * Convert scaled coordinates back to original coordinates
 * Used when saving field positions
 */
export function unscaleCoordinates(
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
) {
  return {
    x: x / scale,
    y: y / scale,
    width: width / scale,
    height: height / scale,
  };
}

/**
 * Get consistent scaling for export based on design page logic
 * This ensures export matches exactly what was designed
 */
export function getExportScaling(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number = 800,
  targetHeight: number = 600
): ScalingInfo {
  return calculateScaling(
    originalWidth,
    originalHeight,
    targetWidth,
    targetHeight
  );
}
