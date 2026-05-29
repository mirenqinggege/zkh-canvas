import type {SceneNode} from '../../scene/SceneNode';
import type {SceneGraph} from '../../scene/SceneGraph';
import type {InteractionController, ModifyCallback} from '../InteractionController';
import type {SelectionController} from './SelectionController';

export type ResizeHandle = 'tl' | 'tc' | 'tr' | 'lc' | 'rc' | 'bl' | 'bc' | 'br';

/**
 * 缩放控制器
 * 提供 8 个控制柄（4 角 + 4 边中点），拖拽调整节点宽高
 *
 * 行为：
 * - onPointerDown: 只在选中单个节点且点击到控制柄时激活
 * - onPointerMove: 根据控制柄类型计算新的宽高和位置
 * - onPointerUp: 结束缩放
 * - cancel: 重置状态
 */
export class ResizeController implements InteractionController {
  name = 'resize';
  active = false;

  private handleSize = 8; // 控制柄尺寸（显示坐标）
  private minSize = 10;

  private sceneGraph: SceneGraph;
  private selectionController: SelectionController;
  private callbacks: ModifyCallback[] = [];

  activeHandle: ResizeHandle | null = null;
  private startData: {
    nodeId: string;
    handle: ResizeHandle;
    startX: number; startY: number;
    startWidth: number; startHeight: number;
    pointerStartX: number; pointerStartY: number;
  } | null = null;

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
    const handles = this.getHandles(node);
    const half = this.handleSize / 2;

    for (const handle of handles) {
      const canvasPos = this.localToCanvas(node, handle.x, handle.y);
      if (
        x >= canvasPos.x - half && x <= canvasPos.x + half &&
        y >= canvasPos.y - half && y <= canvasPos.y + half
      ) {
        this.active = true;
        this.activeHandle = handle.type;
        this.startData = {
          nodeId: node.id,
          handle: handle.type,
          startX: node.x,
          startY: node.y,
          startWidth: node.width,
          startHeight: node.height,
          pointerStartX: x,
          pointerStartY: y,
        };
        return true;
      }
    }
    return false;
  }

  onPointerMove(x: number, y: number, _nativeEvent: any): void {
    if (!this.active || !this.startData) return;
    const node = this.sceneGraph.getNodeById(this.startData.nodeId);
    if (!node) return;

    const dx = (x - this.startData.pointerStartX) / node.scaleX;
    const dy = (y - this.startData.pointerStartY) / node.scaleY;
    const result = this.calcResize(this.startData.handle, dx, dy);

    node.x = result.x;
    node.y = result.y;
    node.width = result.width;
    node.height = result.height;

    for (const cb of this.callbacks) cb(node.id, {});
  }

  onPointerUp(_x: number, _y: number, _nativeEvent: any): void {
    this.active = false;
    this.activeHandle = null;
    this.startData = null;
  }

  cancel(): void {
    this.active = false;
    this.activeHandle = null;
    this.startData = null;
  }

  /** 获取节点的 8 个控制柄位置（节点局部坐标） */
  getHandles(node: SceneNode): { type: ResizeHandle; x: number; y: number }[] {
    const {width, height} = node;
    return [
      {type: 'tl', x: 0, y: 0},
      {type: 'tc', x: width / 2, y: 0},
      {type: 'tr', x: width, y: 0},
      {type: 'lc', x: 0, y: height / 2},
      {type: 'rc', x: width, y: height / 2},
      {type: 'bl', x: 0, y: height},
      {type: 'bc', x: width / 2, y: height},
      {type: 'br', x: width, y: height},
    ];
  }

  /** 计算局部坐标 → 画布坐标 */
  private localToCanvas(node: SceneNode, lx: number, ly: number): { x: number; y: number } {
    // 先缩放
    let px = lx * node.scaleX;
    let py = ly * node.scaleY;
    // 再旋转
    const cosA = Math.cos(node.rotation);
    const sinA = Math.sin(node.rotation);
    const rpx = cosA * px - sinA * py;
    const rpy = sinA * px + cosA * py;
    // 再平移
    return {x: rpx + node.x, y: rpy + node.y};
  }

  /** 根据控制柄类型和位移计算新的宽高位置 */
  private calcResize(
    handle: ResizeHandle,
    dx: number, dy: number
  ): { x: number; y: number; width: number; height: number } {
    if (!this.startData) return {x: 0, y: 0, width: 0, height: 0};
    let {startX, startY, startWidth, startHeight} = this.startData;
    let x = startX, y = startY, w = startWidth, h = startHeight;

    switch (handle) {
      case 'br': w = Math.max(this.minSize, startWidth + dx); h = Math.max(this.minSize, startHeight + dy); break;
      case 'bl': w = Math.max(this.minSize, startWidth - dx); h = Math.max(this.minSize, startHeight + dy); x = startX + (startWidth - w); break;
      case 'tr': w = Math.max(this.minSize, startWidth + dx); h = Math.max(this.minSize, startHeight - dy); y = startY + (startHeight - h); break;
      case 'tl': w = Math.max(this.minSize, startWidth - dx); h = Math.max(this.minSize, startHeight - dy); x = startX + (startWidth - w); y = startY + (startHeight - h); break;
      case 'tc': h = Math.max(this.minSize, startHeight - dy); y = startY + (startHeight - h); break;
      case 'bc': h = Math.max(this.minSize, startHeight + dy); break;
      case 'lc': w = Math.max(this.minSize, startWidth - dx); x = startX + (startWidth - w); break;
      case 'rc': w = Math.max(this.minSize, startWidth + dx); break;
    }

    return {x, y, width: w, height: h};
  }

  onModify(cb: ModifyCallback): () => void {
    this.callbacks.push(cb);
    return () => {
      const idx = this.callbacks.indexOf(cb);
      if (idx !== -1) this.callbacks.splice(idx, 1);
    };
  }
}
