import type { SceneNode } from '../scene/SceneNode';
import type { NodeType } from '../types/NodeType';
import type { CanvasAdapter } from '../adapters/CanvasAdapter';
import type { NodeRenderer } from './NodeRenderer';
import type { SceneGraph } from '../scene/SceneGraph';
import { RectRenderer } from './renderers/RectRenderer';
import { CircleRenderer } from './renderers/CircleRenderer';
import { TextRenderer } from './renderers/TextRenderer';
import { ImageRenderer } from './renderers/ImageRenderer';
import { GroupRenderer } from './renderers/GroupRenderer';
import { logger } from '../utils/Logger';

/**
 * 场景渲染器
 * 管理所有节点的渲染流程
 */
export class SceneRenderer {
  private renderers: Map<NodeType, NodeRenderer>;
  private groupRenderer: GroupRenderer;

  constructor() {
    // 初始化各类型渲染器
    const rectRenderer = new RectRenderer();
    const circleRenderer = new CircleRenderer();
    const textRenderer = new TextRenderer();
    const imageRenderer = new ImageRenderer();

    this.renderers = new Map<NodeType, NodeRenderer>([
      ['rect', rectRenderer],
      ['circle', circleRenderer],
      ['text', textRenderer],
      ['textbox', textRenderer],
      ['image', imageRenderer],
    ]);

    // Group 渲染器需要访问其他渲染器
    this.groupRenderer = new GroupRenderer(this.renderers);
    this.renderers.set('group', this.groupRenderer);
  }

  /**
   * 渲染场景图
   */
  render(graph: SceneGraph, adapter: CanvasAdapter): void {
    logger.info('开始渲染场景', { nodesCount: graph.getNodeCount() });

    // 清空画布
    adapter.clear();

    // 遍历渲染所有节点
    const nodes = graph.getNodes();
    for (const node of nodes) {
      this.renderNode(node, adapter);
    }

    logger.info('场景渲染完成');
  }

  /**
   * 渲染单个节点
   */
  renderNode(node: SceneNode, adapter: CanvasAdapter): void {
    // 不可见则跳过
    if (!node.visible) {
      logger.debug(`节点不可见，跳过: ${node.id}`);
      return;
    }

    logger.debug(`渲染节点: ${node.id} (${node.type})`);

    // 保存状态
    adapter.save();

    // 应用全局透明度
    adapter.setGlobalAlpha(node.opacity);

    // 应用 Transform
    // 顺序：translate → rotate → scale
    adapter.translate(node.x, node.y);
    adapter.rotate(node.rotation);
    adapter.scale(node.scaleX, node.scaleY);

    // 获取对应的渲染器并执行渲染
    const renderer = this.renderers.get(node.type);
    if (renderer) {
      renderer.render(node, adapter);
    } else {
      logger.warn(`无对应渲染器: ${node.type}`);
    }

    // 恢复状态
    adapter.restore();
  }

  /**
   * 获取渲染器映射
   */
  getRenderers(): Map<NodeType, NodeRenderer> {
    return this.renderers;
  }
}