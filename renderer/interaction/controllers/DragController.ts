import type {SceneNode} from '../../scene/SceneNode';
import type {SceneGraph} from '../../scene/SceneGraph';
import type {HitTestService} from '../HitTestService';
import type {InteractionController, ModifyCallback} from '../InteractionController';
import type {SelectionController} from './SelectionController';

/**
 * 拖拽控制器
 * 处理已选中节点的拖拽移动
 *
 * 行为：
 * - onPointerDown: 只在点击到已选中的节点时激活，记录所有选中节点的起始位置
 * - onPointerMove: 计算位移并更新所有选中节点的 x/y
 * - onPointerUp: 结束拖拽
 * - cancel: 重置状态
 */
export class DragController implements InteractionController {
  name = 'drag';
  active = false;

  private hitTestService: HitTestService;
  private sceneGraph: SceneGraph;
  private selectionController: SelectionController;
  private callbacks: ModifyCallback[] = [];

  /** 拖拽起始信息 */
  private dragStart: {
    nodes: { id: string; startX: number; startY: number }[];
    startPointerX: number;
    startPointerY: number;
  } | null = null;

  constructor(
    hitTestService: HitTestService,
    sceneGraph: SceneGraph,
    selectionController: SelectionController
  ) {
    this.hitTestService = hitTestService;
    this.sceneGraph = sceneGraph;
    this.selectionController = selectionController;
  }

  /**
   * 处理 pointerdown
   * 检测是否点击在已选中的节点上，如果是则激活拖拽
   */
  onPointerDown(x: number, y: number, _nativeEvent: any): boolean {
    if (this.active) return false;

    const hit = this.hitTestService.hitTest(this.sceneGraph, x, y);
    if (!hit) return false;

    // 只在点击到已选中的节点时激活
    if (!this.selectionController.isSelected(hit.id)) return false;

    // 记录所有选中节点的起始位置
    const selectedNodes = this.selectionController.getSelectedNodes();
    const nodes = selectedNodes.map(n => ({
      id: n.id,
      startX: n.x,
      startY: n.y,
    }));

    this.dragStart = {
      nodes,
      startPointerX: x,
      startPointerY: y,
    };

    this.active = true;
    return true;
  }

  /**
   * 处理 pointermove
   * 拖拽过程中更新所有选中节点的位置
   */
  onPointerMove(x: number, y: number, _nativeEvent: any): void {
    if (!this.active || !this.dragStart) return;

    const dx = x - this.dragStart.startPointerX;
    const dy = y - this.dragStart.startPointerY;

    for (const nodeInfo of this.dragStart.nodes) {
      const node = this.sceneGraph.getNodeById(nodeInfo.id);
      if (!node) continue;

      const newX = nodeInfo.startX + dx;
      const newY = nodeInfo.startY + dy;

      node.x = newX;
      node.y = newY;

      this.notifyModify(nodeInfo.id, {x: newX, y: newY});
    }
  }

  /**
   * 处理 pointerup
   * 结束拖拽
   */
  onPointerUp(_x: number, _y: number, _nativeEvent: any): void {
    this.active = false;
    this.dragStart = null;
  }

  /**
   * 取消当前拖拽
   * 重置状态
   */
  cancel(): void {
    this.active = false;
    this.dragStart = null;
  }

  // ============ 回调管理 ============

  /**
   * 注册节点修改回调
   * 返回取消注册函数
   */
  onModify(callback: ModifyCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const idx = this.callbacks.indexOf(callback);
      if (idx !== -1) {
        this.callbacks.splice(idx, 1);
      }
    };
  }

  /**
   * 通知所有回调节点已修改
   */
  private notifyModify(nodeId: string, changes: Partial<SceneNode>): void {
    for (const cb of this.callbacks) {
      cb(nodeId, changes);
    }
  }
}
