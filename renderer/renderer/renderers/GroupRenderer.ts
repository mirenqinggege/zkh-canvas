import type {GroupNode} from '../../scene/nodes/GroupNode';
import type {SceneNode} from '../../scene/SceneNode';
import type {CanvasAdapter} from '../../adapters/CanvasAdapter';
import type {NodeRenderer} from '../NodeRenderer';
import {logger} from '../../utils/Logger';

/**
 * 组节点渲染器
 * 递归渲染子节点
 */
export class GroupRenderer implements NodeRenderer<GroupNode> {
  private renderers: Map<string, NodeRenderer>;

  constructor(renderers: Map<string, NodeRenderer>) {
    this.renderers = renderers;
  }

  render(node: GroupNode, adapter: CanvasAdapter): void {
    const {children, opacity} = node;

    // 渲染所有子节点
    for (const child of children) {
      this.renderChild(child, adapter, opacity);
    }
  }

  /**
   * 渲染单个子节点
   */
  private renderChild(child: SceneNode, adapter: CanvasAdapter, parentOpacity: number): void {
    // 不可见则跳过
    if (!child.visible) return;

    // 保存状态
    adapter.save();

    // 应用子节点透明度（累乘）
    adapter.setGlobalAlpha(parentOpacity * child.opacity);

    // 应用子节点 Transform
    // 子节点坐标相对于 Group
    adapter.translate(child.x, child.y);
    adapter.rotate(child.rotation);
    adapter.scale(child.scaleX, child.scaleY);

    // 获取对应的渲染器
    const renderer = this.renderers.get(child.type);
    if (renderer) {
      renderer.render(child, adapter);
    } else {
      logger.warn(`无对应渲染器: ${child.type}`);
    }

    // 恢复状态
    adapter.restore();
  }
}
