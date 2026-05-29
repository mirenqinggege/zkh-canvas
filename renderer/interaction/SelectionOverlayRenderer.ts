import type {SceneNode} from '../scene/SceneNode';
import type {SceneGraph} from '../scene/SceneGraph';
import type {CanvasAdapter} from '../adapters/CanvasAdapter';
import type {SelectionController} from './controllers/SelectionController';
import {ResizeController} from './controllers/ResizeController';
import {RotateController} from './controllers/RotateController';

/**
 * 选中框和控制柄渲染器
 * 在 SceneRenderer.render 完成后额外绘制交互层
 */
export class SelectionOverlayRenderer {
  private adapter: CanvasAdapter;
  private selectionController: SelectionController;
  private resizeController?: ResizeController;
  private rotateController?: RotateController;
  private sceneGraph: SceneGraph;

  /** 选中框颜色 */
  private selectionColor = '#1890ff';
  /** 控制柄尺寸 */
  private handleSize = 8;

  constructor(
    adapter: CanvasAdapter,
    selectionController: SelectionController,
    sceneGraph: SceneGraph,
    resizeController?: ResizeController,
    rotateController?: RotateController
  ) {
    this.adapter = adapter;
    this.selectionController = selectionController;
    this.sceneGraph = sceneGraph;
    this.resizeController = resizeController;
    this.rotateController = rotateController;
  }

  /**
   * 绘制选中框和控制柄
   * 在 sceneRenderer.render() 之后调用
   */
  render(): void {
    const nodes = this.selectionController.getSelectedNodes();
    if (nodes.length === 0) return;

    for (const node of nodes) {
      this.renderSelectionBox(node);
      if (nodes.length === 1) {
        // 单选才显示控制柄和旋转手柄
        if (this.resizeController) this.renderResizeHandles(node);
        if (this.rotateController) this.renderRotateHandle(node);
      }
    }
  }

  /**
   * 应用节点的完整变换链（含 Group 祖先）
   * 确保 Group 内子节点的选中框绘制在正确位置
   */
  private applyFullTransform(node: SceneNode): void {
    const path = this.sceneGraph.findNodePath(node.id);

    if (path.length <= 1) {
      // 顶层节点：直接应用自身变换
      this.adapter.translate(node.x, node.y);
      this.adapter.rotate(node.rotation);
      this.adapter.scale(node.scaleX, node.scaleY);
    } else {
      // 变换链：先外层 Group → 再到自身
      for (let i = 0; i < path.length; i++) {
        const n = path[i];
        this.adapter.translate(n.x, n.y);
        this.adapter.rotate(n.rotation);
        this.adapter.scale(n.scaleX, n.scaleY);
      }
    }
  }

  private renderSelectionBox(node: SceneNode): void {
    this.adapter.save();
    this.applyFullTransform(node);

    // 选中框（实线轮廓，因 adapter 不支持虚线）
    this.adapter.setStrokeStyle(this.selectionColor);
    this.adapter.setLineWidth(1.5);
    this.adapter.strokeRect(0, 0, node.width, node.height);

    this.adapter.restore();
  }

  private renderResizeHandles(node: SceneNode): void {
    this.adapter.save();
    this.applyFullTransform(node);

    const handles: { x: number; y: number }[] = [
      {x: 0, y: 0},
      {x: node.width / 2, y: 0},
      {x: node.width, y: 0},
      {x: 0, y: node.height / 2},
      {x: node.width, y: node.height / 2},
      {x: 0, y: node.height},
      {x: node.width / 2, y: node.height},
      {x: node.width, y: node.height},
    ];

    const half = this.handleSize / 2;

    for (const {x, y} of handles) {
      this.adapter.setFillStyle('#ffffff');
      this.adapter.setStrokeStyle(this.selectionColor);
      this.adapter.setLineWidth(1.5);
      this.adapter.fillRect(x - half, y - half, this.handleSize, this.handleSize);
      this.adapter.strokeRect(x - half, y - half, this.handleSize, this.handleSize);
    }

    this.adapter.restore();
  }

  private renderRotateHandle(node: SceneNode): void {
    this.adapter.save();
    this.applyFullTransform(node);

    const handleX = node.width / 2;
    const handleY = -40;
    const radius = 6;

    // 连接线
    this.adapter.setStrokeStyle(this.selectionColor);
    this.adapter.setLineWidth(1);
    this.adapter.strokeRect(
      handleX - 0.5,
      handleY + radius,
      1,
      Math.abs(handleY) - radius
    );

    // 旋转手柄方块
    this.adapter.setFillStyle(this.selectionColor);
    this.adapter.fillRect(handleX - radius, handleY - radius, radius * 2, radius * 2);

    this.adapter.restore();
  }
}
