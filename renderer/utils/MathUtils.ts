/**
 * 数学计算工具
 */

/**
 * 角度转弧度
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 弧度转角度
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 限制数值在指定范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 计算两点之间的距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * 计算矩形中心点
 */
export function getRectCenter(x: number, y: number, width: number, height: number): { cx: number; cy: number } {
  return {
    cx: x + width / 2,
    cy: y + height / 2,
  };
}

/**
 * 限制数值为正数
 */
export function ensurePositive(value: number, min: number = 0.001): number {
  return Math.max(min, value);
}

/**
 * 四舍五入到指定精度
 */
export function roundTo(value: number, precision: number): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}