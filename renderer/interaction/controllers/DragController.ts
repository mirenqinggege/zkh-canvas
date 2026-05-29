import type {SceneNode} from '../../scene/SceneNode';
import type {SceneGraph} from '../../scene/SceneGraph';
import type {HitTestService} from '../HitTestService';
import type {InteractionController, ModifyCallback} from '../InteractionController';
import type {SelectionController} from './SelectionController';

/**
 * 拖拽控制器
 * 支持 click-and-drag 手势：点击任意节点即可拖拽，无需预先选中。
 *
 * 行为：
 * - onPointerDown: 记录潜在拖拽目标（任意节点），不消费事件，
 *   让 SelectionController 处理选中/取消选中
 * - onPointerMove: 移动超过阈值(3px)后激活拖拽，
 *   确保拖拽目标被选中，然后更新所有选中节点的位置
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

  /** 拖拽激活阈值（像素） */
  private dragThreshold = 3;

  /** 潜在拖拽跟踪（用于 click-and-drag 手势） */
  private pendingDrag: {
    nodeId: string;
    pointerStartX: number;
    pointerStartY: number;
  } | null = null;

  /** 活跃拖拽 */
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
   * 记录潜在拖拽目标，但不消费事件（让 SelectionController 处理选择）
   */
  onPointerDown(x: number, y: number, _nativeEvent: any): boolean {
    const hit = this.hitTestService.hitTest(this.sceneGraph, x, y);
    if (hit) {
      this.pendingDrag = {
        nodeId: hit.id,
        pointerStartX: x,
        pointerStartY: y,
      };
    }
    return false; // 不消费，让 SelectionController 处理
  }

  /**
   * 处理 pointermove
   * - 有 pendingDrag：检查是否超过阈值，激活拖拽
   * - 活跃拖拽中：更新所有选中节点位置
   */
  onPointerMove(x: number, y: number, _nativeEvent: any): void {
    if (this.dragStart) {
      // 活跃拖拽：更新节点位置
      const dx = x - this.dragStart.startPointerX;
      const dy = y - this.dragStart.startPointerY;
      for (const nodeInfo of this.dragStart.nodes) {
        const node = this.sceneGraph.getNodeById(nodeInfo.id);
        if (!node) continue;
        node.x = nodeInfo.startX + dx;
        node.y = nodeInfo.startY + dy;
        this.notifyModify(nodeInfo.id, {});
      }
    } else if (this.pendingDrag) {
      // 检查是否超过拖拽阈值 → 激活拖拽
      const dx = Math.abs(x - this.pendingDrag.pointerStartX);
      const dy = Math.abs(y - this.pendingDrag.pointerStartY);
      if (dx > this.dragThreshold || dy > this.dragThreshold) {
        this.activateDrag();
      }
    }
  }

  /**
   * 激活拖拽
   */
  private activateDrag(): void {
    if (!this.pendingDrag) return;
    this.active = true;

    // 确保拖拽目标被选中（单选模式）
    if (!this.selectionController.isSelected(this.pendingDrag.nodeId)) {
      this.selectionController.selectSingle(this.pendingDrag.nodeId);
    }

    this.dragStart = {
      nodes: this.selectionController.getSelectedNodes().map(n => ({
        id: n.id,
        startX: n.x,
        startY: n.y,
      })),
      startPointerX: this.pendingDrag.pointerStartX,
      startPointerY: this.pendingDrag.pointerStartY,
    };
    this.pendingDrag = null;
  }

  /**
   * 处理 pointerup
   * 结束拖拽，清理所有状态
   */
  onPointerUp(_x: number, _y: number, _nativeEvent: any): void {
    this.active = false;
    this.dragStart = null;
    this.pendingDrag = null;
  }

  /**
   * 取消当前拖拽
   */
  cancel(): void {
    this.active = false;
    this.dragStart = null;
    this.pendingDrag = null;
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
