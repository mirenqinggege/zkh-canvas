import type { TextAlign } from '../../scene/nodes/TextNode';

/**
 * 字体配置选项
 */
export interface FontOptions {
  /** 字体大小 */
  fontSize: number;

  /** 字体名称 */
  fontFamily: string;

  /** 字体粗细 */
  fontWeight: string | number;

  /** 文本对齐 */
  textAlign: TextAlign;
}

/**
 * 将 FontOptions 转换为 Canvas font 字符串
 */
export function fontOptionsToString(options: FontOptions): string {
  const weight = String(options.fontWeight);
  const size = `${options.fontSize}px`;
  const family = options.fontFamily;

  return `${weight} ${size} ${family}`;
}