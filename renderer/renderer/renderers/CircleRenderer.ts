import type { CircleNode } from '../../scene/nodes/CircleNode';
import type { CanvasAdapter } from '../../adapters/CanvasAdapter';
import type { NodeRenderer } from '../NodeRenderer';

/**
 * 圆形渲染器
 */
export class CircleRenderer implements NodeRenderer<CircleNode> {
  render(node: CircleNode, adapter: CanvasAdapter): void {
    const { radius, fill, stroke, strokeWidth } = node;

    // 圆心位于节点中心 (radius, radius)
    const cx = radius;
    const cy = radius;

    // 绘制填充
    if (fill) {
      adapter.setFillStyle(fill);
      adapter.fillCircle(cx, cy, radius);
    }

    // 绘制描边
    if (stroke) {
      adapter.setStrokeStyle(stroke);
      adapter.setLineWidth(strokeWidth);
      adapter.strokeCircle(cx, cy, radius);
    }
  }
}