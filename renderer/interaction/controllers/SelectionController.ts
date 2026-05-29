import type {SceneNode} from '../../scene/SceneNode';
import type {SceneGraph} from '../../scene/SceneGraph';
import type {HitTestService} from '../HitTestService';
import type {InteractionController, SelectionCallback} from '../InteractionController';

/**
 * 选择控制器
 * 管理节点的选中/未选中状态
 *
 * - 单击节点（未选中）→ 选中该节点，取消其他选中
 * - Shift + 单击节点 → 追加/切换该节点的选中状态
 * - 单击空白区域 → 取消所有选中
 * - 在已选中的节点上按下 → 不改变选中状态（返回 false，让 DragController 处理）
 */
export class SelectionController implements InteractionController {
  name = 'selection';
  active = false;
  selectedNodeIds: Set<string> = new Set();

  private hitTestService: HitTestService;
  private sceneGraph: SceneGraph;
  private callbacks: SelectionCallback[] = [];

  constructor(
    hitTestService: HitTestService,
    sceneGraph: SceneGraph
  ) {
    this.hitTestService = hitTestService;
    this.sceneGraph = sceneGraph;
  }

  /**
   * 处理 pointerdown 事件
   * 返回 true 表示消费了该事件（单击选中后不再传递）；
   * 返回 false 表示未消费（在已选中的节点上按下，让 DragController 处理）
   */
  onPointerDown(x: number, y: number, nativeEvent: any): boolean {
    const hit = this.hitTestService.hitTest(this.sceneGraph, x, y);

    if (hit) {
      const isShift = nativeEvent?.shiftKey ?? false;

      if (isShift) {
        // Shift + 单击：追加/切换选中状态
        this.toggleNode(hit.id);
      } else if (this.selectedNodeIds.has(hit.id)) {
        // 在已选中的节点上按下：不改变选中状态，让 DragController 处理
        return false;
      } else {
        // 单击未选中的节点：选中该节点，取消其他选中
        this.selectSingle(hit.id);
      }
    } else {
      // 单击空白区域：取消所有选中
      this.clearSelection();
    }

    return true;
  }

  /** pointermove：选择控制器不处理移动事件 */
  onPointerMove(_x: number, _y: number, _nativeEvent: any): void {
    // no-op
  }

  /** pointerup：选择控制器不处理弹起事件 */
  onPointerUp(_x: number, _y: number, _nativeEvent: any): void {
    // no-op
  }

  /** 取消当前交互：清除选中状态 */
  cancel(): void {
    this.clearSelection();
  }

  // ============ 选择操作 ============

  /**
   * 选中单个节点，取消其他所有选中
   */
  selectSingle(id: string): void {
    this.selectedNodeIds.clear();
    this.selectedNodeIds.add(id);
    this.notifyChange();
  }

  /**
   * 切换节点的选中状态
   */
  toggleNode(id: string): void {
    if (this.selectedNodeIds.has(id)) {
      this.selectedNodeIds.delete(id);
    } else {
      this.selectedNodeIds.add(id);
    }
    this.notifyChange();
  }

  /**
   * 清空所有选中
   */
  clearSelection(): void {
    if (this.selectedNodeIds.size === 0) return;
    this.selectedNodeIds.clear();
    this.notifyChange();
  }

  // ============ 查询 ============

  /**
   * 判断节点是否被选中
   */
  isSelected(id: string): boolean {
    return this.selectedNodeIds.has(id);
  }

  /**
   * 获取所有选中的节点
   */
  getSelectedNodes(): SceneNode[] {
    const result: SceneNode[] = [];
    for (const id of this.selectedNodeIds) {
      const node = this.sceneGraph.getNodeById(id);
      if (node) {
        result.push(node);
      }
    }
    return result;
  }

  // ============ 回调管理 ============

  /**
   * 注册选中变化回调
   * 返回取消注册函数
   */
  onChange(callback: SelectionCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const idx = this.callbacks.indexOf(callback);
      if (idx !== -1) {
        this.callbacks.splice(idx, 1);
      }
    };
  }

  /**
   * 通知所有回调选中状态已变化
   */
  private notifyChange(): void {
    const ids = Array.from(this.selectedNodeIds);
    for (const cb of this.callbacks) {
      cb(ids);
    }
  }
}
