/**
 * 颜色解析工具
 * 统一处理各种颜色格式
 */

/**
 * 标准化颜色字符串
 * 支持 #rgb, #rrggbb, rgba(), rgb() 格式
 */
export function normalizeColor(color: string | null | undefined): string | null {
  if (!color) return null;

  // 移除空白字符
  const trimmed = color.trim();

  // 空字符串返回 null
  if (trimmed === '' || trimmed === 'transparent') {
    return null;
  }

  // 已经是标准格式，直接返回
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('rgb') ||
    trimmed.startsWith('hsl')
  ) {
    return trimmed;
  }

  // 其他情况尝试作为颜色名处理
  // 简单的颜色名映射
  const colorNameMap: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    gray: '#808080',
    grey: '#808080',
    orange: '#ffa500',
    pink: '#ffc0cb',
    purple: '#800080',
    brown: '#a52a2a',
  };

  const lowercased = trimmed.toLowerCase();
  if (colorNameMap[lowercased]) {
    return colorNameMap[lowercased];
  }

  // 无法解析的颜色，返回 null 并警告
  return null;
}

/**
 * 检查颜色是否有效
 */
export function isValidColor(color: string | null | undefined): boolean {
  return normalizeColor(color) !== null;
}

/**
 * 解析 RGBA 颜色字符串为组件值
 */
export function parseRGBA(color: string): { r: number; g: number; b: number; a: number } | null {
  const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?\)/i);
  if (!rgbaMatch) return null;

  return {
    r: parseInt(rgbaMatch[1], 10),
    g: parseInt(rgbaMatch[2], 10),
    b: parseInt(rgbaMatch[3], 10),
    a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
  };
}

/**
 * 将颜色转换为 RGBA 格式
 */
export function colorToRGBA(color: string): string {
  const normalized = normalizeColor(color);
  if (!normalized) return 'rgba(0, 0, 0, 0)';

  // 已经是 rgba 格式
  if (normalized.startsWith('rgba')) return normalized;

  // rgb 格式转换为 rgba
  if (normalized.startsWith('rgb')) {
    const parsed = parseRGBA(normalized);
    if (parsed) {
      return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${parsed.a})`;
    }
  }

  // # 格式转换为 rgba
  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1);
    let r: number, g: number, b: number;

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return 'rgba(0, 0, 0, 0)';
    }

    return `rgba(${r}, ${g}, ${b}, 1)`;
  }

  return normalized;
}