import type {TextNode} from '../../scene/nodes/TextNode';
import type {CanvasAdapter} from '../../adapters/CanvasAdapter';
import type {NodeRenderer} from '../NodeRenderer';

/**
 * 文本渲染器
 */
export class TextRenderer implements NodeRenderer<TextNode> {
  render(node: TextNode, adapter: CanvasAdapter): void {
    const {text, fontSize, fontFamily, fontWeight, textAlign, fill, stroke, strokeWidth} = node;

    // 设置字体
    adapter.setFont({
      fontSize,
      fontFamily,
      fontWeight,
      textAlign,
    });

    // 绘制填充文本
    if (fill) {
      adapter.setFillStyle(fill);
      adapter.fillText(text, 0, fontSize); // 文本基线在顶部，y 偏移 fontSize
    }

    // 绘制描边文本（较少使用）
    if (stroke) {
      adapter.setStrokeStyle(stroke);
      adapter.setLineWidth(strokeWidth);
      // Canvas 2D 没有 strokeText 方法在所有平台一致支持
      // 暂时不实现描边文本
    }
  }
}
