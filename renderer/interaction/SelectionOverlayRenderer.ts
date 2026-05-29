import type {SceneNode} from '../scene/SceneNode';
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

  /** 选中框颜色 */
  private selectionColor = '#1890ff';
  /** 控制柄尺寸 */
  private handleSize = 8;

  constructor(
    adapter: CanvasAdapter,
    selectionController: SelectionController,
    resizeController?: ResizeController,
    rotateController?: RotateController
  ) {
    this.adapter = adapter;
    this.selectionController = selectionController;
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

  private renderSelectionBox(node: SceneNode): void {
    this.adapter.save();

    // 应用节点 transform
    this.adapter.translate(node.x, node.y);
    this.adapter.rotate(node.rotation);
    this.adapter.scale(node.scaleX, node.scaleY);

    // 选中框（实线轮廓，因 adapter 不支持虚线）
    this.adapter.setStrokeStyle(this.selectionColor);
    this.adapter.setLineWidth(1.5);
    this.adapter.strokeRect(0, 0, node.width, node.height);

    this.adapter.restore();
  }

  private renderResizeHandles(node: SceneNode): void {
    this.adapter.save();

    this.adapter.translate(node.x, node.y);
    this.adapter.rotate(node.rotation);
    this.adapter.scale(node.scaleX, node.scaleY);

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
      // 白色填充 + 蓝色边框
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

    this.adapter.translate(node.x, node.y);
    this.adapter.rotate(node.rotation);
    this.adapter.scale(node.scaleX, node.scaleY);

    const handleX = node.width / 2;
    const handleY = -40; // 旋转手柄在选中框上方 40px
    const radius = 6;

    // 连接线：从选中框顶部中心到旋转手柄
    // strokeRect(x, y, w, h) 绘制从 (x,y) 到 (x+w, y+h) 的矩形，
    // 这里利用它画一条竖线：从 handle 下方到选中框顶部 (y=0)
    this.adapter.setStrokeStyle(this.selectionColor);
    this.adapter.setLineWidth(1);
    this.adapter.strokeRect(
      handleX - 0.5,
      handleY + radius,
      1,
      Math.abs(handleY) - radius
    );

    // 旋转手柄方块（避免 scale 后 fillCircle 变成椭圆）
    this.adapter.setFillStyle(this.selectionColor);
    this.adapter.fillRect(handleX - radius, handleY - radius, radius * 2, radius * 2);

    this.adapter.restore();
  }
}
