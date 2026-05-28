import type { RectNode } from '../../scene/nodes/RectNode';
import type { CanvasAdapter } from '../../adapters/CanvasAdapter';
import type { NodeRenderer } from '../NodeRenderer';

/**
 * 矩形渲染器
 */
export class RectRenderer implements NodeRenderer<RectNode> {
  render(node: RectNode, adapter: CanvasAdapter): void {
    const { width, height, fill, stroke, strokeWidth, rx, ry } = node;

    // 有圆角时使用圆角矩形绘制
    if (rx > 0 || ry > 0) {
      if (fill) {
        adapter.setFillStyle(fill);
        adapter.fillRoundRect(0, 0, width, height, rx, ry);
      }
      if (stroke) {
        adapter.setStrokeStyle(stroke);
        adapter.setLineWidth(strokeWidth);
        adapter.strokeRoundRect(0, 0, width, height, rx, ry);
      }
    } else {
      // 无圆角使用普通矩形绘制
      if (fill) {
        adapter.setFillStyle(fill);
        adapter.fillRect(0, 0, width, height);
      }
      if (stroke) {
        adapter.setStrokeStyle(stroke);
        adapter.setLineWidth(strokeWidth);
        adapter.strokeRect(0, 0, width, height);
      }
    }
  }
}