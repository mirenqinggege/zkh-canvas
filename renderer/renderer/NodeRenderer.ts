import type {SceneNode} from '../scene/SceneNode';
import type {CanvasAdapter} from '../adapters/CanvasAdapter';

/**
 * 节点渲染器接口
 * 每种节点类型有对应的渲染器实现
 */
export interface NodeRenderer<T extends SceneNode = SceneNode> {
  /**
   * 渲染节点
   * @param node 要渲染的节点
   * @param adapter Canvas 适配器
   */
  render(node: T, adapter: CanvasAdapter): void;
}
