import type { SceneNode } from './SceneNode';

/**
 * 场景图管理器
 * 管理所有节点的渲染顺序
 */
export class SceneGraph {
  private nodes: SceneNode[];
  private nodeMap: Map<string, SceneNode>;

  constructor(nodes: SceneNode[] = []) {
    this.nodes = nodes;
    this.nodeMap = new Map();

    // 构建节点映射
    this.buildNodeMap(nodes);
  }

  /**
   * 获取所有节点（渲染顺序）
   */
  getNodes(): SceneNode[] {
    return this.nodes;
  }

  /**
   * 根据 ID 获取节点
   */
  getNodeById(id: string): SceneNode | undefined {
    return this.nodeMap.get(id);
  }

  /**
   * 添加节点
   */
  addNode(node: SceneNode): void {
    this.nodes.push(node);
    this.nodeMap.set(node.id, node);
    this.addToNodeMap(node);
  }

  /**
   * 移除节点
   */
  removeNode(id: string): boolean {
    const node = this.nodeMap.get(id);
    if (!node) return false;

    const index = this.nodes.indexOf(node);
    if (index > -1) {
      this.nodes.splice(index, 1);
    }

    this.nodeMap.delete(id);
    this.removeFromNodeMap(node);

    return true;
  }

  /**
   * 清空所有节点
   */
  clear(): void {
    this.nodes = [];
    this.nodeMap.clear();
  }

  /**
   * 获取节点数量
   */
  getNodeCount(): number {
    return this.nodes.length;
  }

  /**
   * 构建节点映射（包含 Group 内的子节点）
   */
  private buildNodeMap(nodes: SceneNode[]): void {
    for (const node of nodes) {
      this.addToNodeMap(node);
    }
  }

  /**
   * 将节点添加到映射（递归处理 Group）
   */
  private addToNodeMap(node: SceneNode): void {
    this.nodeMap.set(node.id, node);

    if (node.type === 'group') {
      const groupNode = node as import('./nodes/GroupNode').GroupNode;
      for (const child of groupNode.children) {
        this.addToNodeMap(child);
      }
    }
  }

  /**
   * 从映射移除节点（递归处理 Group）
   */
  private removeFromNodeMap(node: SceneNode): void {
    this.nodeMap.delete(node.id);

    if (node.type === 'group') {
      const groupNode = node as import('./nodes/GroupNode').GroupNode;
      for (const child of groupNode.children) {
        this.removeFromNodeMap(child);
      }
    }
  }
}