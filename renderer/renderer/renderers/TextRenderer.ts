import type {TextNode} from '../../scene/nodes/TextNode';
import type {CanvasAdapter} from '../../adapters/CanvasAdapter';
import type {NodeRenderer} from '../NodeRenderer';

/**
 * 文本渲染器
 * 支持自动换行：当文本宽度超出节点宽度时按字符换行
 */
export class TextRenderer implements NodeRenderer<TextNode> {
  render(node: TextNode, adapter: CanvasAdapter): void {
    const {text, fontSize, fontFamily, fontWeight, fontStyle, textAlign, textBaseline, fill} = node;

    if (!text) return;

    // 设置字体（先设置字体，measureText 依赖当前 font）
    // 始终用 top baseline，y 偏移由 renderer 统一计算
    adapter.setFont({
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textAlign,
      textBaseline: 'top',
    });

    // 计算换行
    const lineHeight = fontSize * 1.2;
    const maxWidth = Math.max(node.width, 1);
    const lines = this.wrapText(text, maxWidth, (t) => adapter.measureText(t).width);
    const totalHeight = lines.length * lineHeight;

    // 顶部留白，避免文字紧贴上边缘被裁剪
    const textPadding = Math.min(Math.max(2, fontSize * 0.15), 6);

    // 根据基线计算起始 y
    let startY = textPadding;
    if (textBaseline === 'center') startY = (node.height - totalHeight) / 2;
    else if (textBaseline === 'bottom') startY = node.height - totalHeight;

    // 裁剪超出组件范围的部分
    adapter.clipRoundRect(0, 0, node.width, node.height, 0, 0);

    // 逐行绘制
    if (fill) {
      adapter.setFillStyle(fill);
      for (let i = 0; i < lines.length; i++) {
        adapter.fillText(lines[i], 0, startY + i * lineHeight);
      }
    }
  }

  /**
   * 按字符拆行，保证每行不超过最大宽度
   */
  private wrapText(
    text: string,
    maxWidth: number,
    measure: (t: string) => number
  ): string[] {
    if (!text) return [''];
    if (maxWidth <= 0 || measure(text) <= maxWidth) return [text];

    const lines: string[] = [];
    let line = '';

    for (const char of text) {
      const next = line + char;
      if (measure(next) > maxWidth && line.length > 0) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    }

    if (line) lines.push(line);
    return lines;
  }
}
