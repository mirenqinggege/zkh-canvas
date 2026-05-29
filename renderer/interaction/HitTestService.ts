import type {SceneNode} from '../scene/SceneNode';
import type {SceneGraph} from '../scene/SceneGraph';
import type {GroupNode} from '../scene/nodes/GroupNode';
import type {RectNode} from '../scene/nodes/RectNode';
import type {CircleNode} from '../scene/nodes/CircleNode';

/**
 * 命中检测服务
 * 纯几何运算，不依赖 Canvas API
 */
export class HitTestService {
  /**
   * 命中检测主入口
   */
  hitTest(graph: SceneGraph, x: number, y: number): SceneNode | null {
    const nodes = graph.getNodes();
    return this.hitTestNodes(nodes, x, y);
  }

  /**
   * 带排除列表的命中检测
   */
  hitTestWithExclude(
    graph: SceneGraph,
    x: number,
    y: number,
    excludeNodeIds: string[]
  ): SceneNode | null {
    const nodes = graph.getNodes().filter(n => !excludeNodeIds.includes(n.id));
    return this.hitTestNodes(nodes, x, y);
  }

  /**
   * 对节点列表执行命中检测（从后往前，z-order 上层优先）
   */
  private hitTestNodes(nodes: SceneNode[], x: number, y: number): SceneNode | null {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!node.visible) continue;

      const hit = this.hitTestNode(node, x, y);
      if (hit) return hit;
    }
    return null;
  }

  /**
   * 检测单个节点
   */
  private hitTestNode(node: SceneNode, px: number, py: number): SceneNode | null {
    // 逆变换：画布坐标 → 节点局部坐标
    const local = this.canvasToLocal(node, px, py);

    // Group 特殊处理：先检测包围盒，再递归子节点
    if (node.type === 'group') {
      const group = node as GroupNode;
      if (!this.pointInRect(local.x, local.y, 0, 0, group.width, group.height)) {
        return null;
      }
      // 子节点坐标相对于 Group，用 Group 局部坐标检测
      const childHit = this.hitTestNodes(group.children, local.x, local.y);
      if (childHit) return childHit;
      // 点击在 Group 边界内但没命中具体子节点 → 返回 Group 自身
      return group;
    }

    // 各形状检测
    if (this.pointInShape(node, local.x, local.y)) {
      return node;
    }

    return null;
  }

  /**
   * 画布坐标 → 节点局部坐标
   * 逆变换顺序：平移 → 旋转 → 缩放
   */
  private canvasToLocal(node: SceneNode, px: number, py: number): { x: number; y: number } {
    // 逆平移
    let lx = px - node.x;
    let ly = py - node.y;

    // 逆旋转
    const cosA = Math.cos(-node.rotation);
    const sinA = Math.sin(-node.rotation);
    const rlx = cosA * lx - sinA * ly;
    const rly = sinA * lx + cosA * ly;

    // 逆缩放
    lx = rlx / (node.scaleX || 0.001);
    ly = rly / (node.scaleY || 0.001);

    return {x: lx, y: ly};
  }

  /**
   * 判断点是否在形状内
   */
  private pointInShape(node: SceneNode, lx: number, ly: number): boolean {
    switch (node.type) {
      case 'rect':
        return this.pointInRect(lx, ly, 0, 0, node.width, node.height)
          && this.pointInRoundRectCorner(lx, ly, node as RectNode);
      case 'circle':
        return this.pointInCircle(lx, ly, node as CircleNode);
      case 'text':
      case 'textbox':
      case 'image':
        return this.pointInRect(lx, ly, 0, 0, node.width, node.height);
      default:
        return false;
    }
  }

  /**
   * 点在矩形内
   */
  private pointInRect(
    px: number, py: number,
    rx: number, ry: number,
    rw: number, rh: number
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  /**
   * 圆角矩形：检查点是否在四角的圆角区域内
   * 如果点落在矩形内部非圆角区则直接通过；
   * 如果落在圆角区，用椭圆公式检查是否在圆角内。
   */
  private pointInRoundRectCorner(px: number, py: number, node: RectNode): boolean {
    if (!node.rx && !node.ry) return true;

    const rx = node.rx || 0;
    const ry = node.ry || 0;
    const w = node.width;
    const h = node.height;

    // 点在矩形内部区域（非圆角区），肯定在形状内
    if (px >= rx && px <= w - rx && py >= ry && py <= h - ry) return true;

    // 检查四角
    const corners: [number, number][] = [
      [rx, ry],           // 左上
      [w - rx, ry],       // 右上
      [rx, h - ry],       // 左下
      [w - rx, h - ry],   // 右下
    ];

    for (const [cx, cy] of corners) {
      const dx = (px - cx) / (rx || 1);
      const dy = (py - cy) / (ry || 1);
      if (dx * dx + dy * dy <= 1) return true;
    }

    return false;
  }

  /**
   * 点在圆内
   * 圆心在 (width/2, height/2)，即 (radius, radius)
   */
  private pointInCircle(px: number, py: number, node: CircleNode): boolean {
    const cx = node.width / 2;
    const cy = node.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= node.radius * node.radius;
  }
}
