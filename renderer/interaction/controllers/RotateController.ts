import type {SceneNode} from '../../scene/SceneNode';
import type {SceneGraph} from '../../scene/SceneGraph';
import type {InteractionController, ModifyCallback} from '../InteractionController';
import type {SelectionController} from './SelectionController';

/**
 * 旋转控制器
 * 提供旋转手柄在选中框正上方，拖拽时计算角度
 *
 * 行为：
 * - onPointerDown: 只在选中单个节点且点击到旋转手柄时激活
 * - onPointerMove: 计算从节点中心到指针的角度变化并更新节点旋转
 * - onPointerUp: 结束旋转
 * - cancel: 重置状态
 */
export class RotateController implements InteractionController {
  name = 'rotate';
  active = false;

  private rotateHandleDistance = 40;
  private handleRadius = 6;

  private sceneGraph: SceneGraph;
  private selectionController: SelectionController;
  private callbacks: ModifyCallback[] = [];

  private rotatingNodeId: string | null = null;
  private startAngle: number | null = null;
  private startRotation: number | null = null;

  constructor(
    sceneGraph: SceneGraph,
    selectionController: SelectionController
  ) {
    this.sceneGraph = sceneGraph;
    this.selectionController = selectionController;
  }

  onPointerDown(x: number, y: number, _nativeEvent: any): boolean {
    const selected = this.selectionController.getSelectedNodes();
    if (selected.length !== 1) return false;

    const node = selected[0];
    // 旋转手柄在节点局部坐标系中的位置
    const handleLocal = {x: node.width / 2, y: -this.rotateHandleDistance};
    // 转换到画布坐标
    const handleCanvas = this.localToCanvas(node, handleLocal.x, handleLocal.y);

    const dx = x - handleCanvas.x;
    const dy = y - handleCanvas.y;
    if (dx * dx + dy * dy <= this.handleRadius * this.handleRadius) {
      this.active = true;
      this.rotatingNodeId = node.id;

      // 计算从节点中心到指针的角度
      const center = this.getNodeCenter(node);
      this.startAngle = Math.atan2(y - center.cy, x - center.cx);
      this.startRotation = node.rotation;

      return true;
    }
    return false;
  }

  onPointerMove(x: number, y: number, _nativeEvent: any): void {
    if (!this.active || !this.rotatingNodeId) return;
    const node = this.sceneGraph.getNodeById(this.rotatingNodeId);
    if (!node) return;

    const center = this.getNodeCenter(node);
    const currentAngle = Math.atan2(y - center.cy, x - center.cx);
    const deltaAngle = currentAngle - this.startAngle!;
    node.rotation = this.startRotation! + deltaAngle;

    for (const cb of this.callbacks) cb(node.id, {rotation: node.rotation});
  }

  onPointerUp(_x: number, _y: number, _nativeEvent: any): void {
    this.active = false;
    this.rotatingNodeId = null;
    this.startAngle = null;
    this.startRotation = null;
  }

  cancel(): void {
    this.active = false;
    this.rotatingNodeId = null;
    this.startAngle = null;
    this.startRotation = null;
  }

  private getNodeCenter(node: SceneNode): { cx: number; cy: number } {
    return {
      cx: node.x + node.width / 2,
      cy: node.y + node.height / 2,
    };
  }

  private localToCanvas(node: SceneNode, lx: number, ly: number): { x: number; y: number } {
    // 局部坐标 → 中心为轴心的画布坐标
    let px = lx * node.scaleX - node.width / 2;
    let py = ly * node.scaleY - node.height / 2;
    const cosA = Math.cos(node.rotation);
    const sinA = Math.sin(node.rotation);
    const rpx = cosA * px - sinA * py;
    const rpy = sinA * px + cosA * py;
    return {x: rpx + node.x + node.width / 2, y: rpy + node.y + node.height / 2};
  }

  onModify(cb: ModifyCallback): () => void {
    this.callbacks.push(cb);
    return () => {
      const idx = this.callbacks.indexOf(cb);
      if (idx !== -1) this.callbacks.splice(idx, 1);
    };
  }
}
