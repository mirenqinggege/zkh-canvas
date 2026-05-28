import type {ImageNode, ClipInfo, FillMode} from '../../scene/nodes/ImageNode';
import type {CanvasAdapter} from '../../adapters/CanvasAdapter';
import type {NodeRenderer} from '../NodeRenderer';
import {logger} from '../../utils/Logger';

/**
 * 图片渲染器
 */
export class ImageRenderer implements NodeRenderer<ImageNode> {
  render(node: ImageNode, adapter: CanvasAdapter): void {
    const {imageHandle, src, clip} = node;

    // 检查图片是否已加载
    if (!imageHandle) {
      logger.warn(`图片未加载，无法渲染: ${src}`);
      return;
    }

    // 有裁剪时
    if (clip) {
      adapter.save();
      this.applyClip(node, clip, adapter);
      this.drawImageWithFillMode(node, adapter);
      adapter.restore();
    } else {
      // 无裁剪，直接绘制
      this.drawImageWithFillMode(node, adapter);
    }
  }

  /**
   * 根据填充模式绘制图片
   */
  private drawImageWithFillMode(node: ImageNode, adapter: CanvasAdapter): void {
    const {width, height, imageHandle, fillMode, imageWidth, imageHeight} = node;

    // 默认 fill 模式：直接拉伸
    if (!fillMode || fillMode === 'fill') {
      adapter.drawImage(imageHandle!, 0, 0, width, height);
      return;
    }

    // 需要图片原始尺寸
    if (!imageWidth || !imageHeight) {
      // 无法计算，使用默认 fill
      adapter.drawImage(imageHandle!, 0, 0, width, height);
      return;
    }

    // 计算 cover/contain 模式的绘制参数
    const drawParams = this.calculateFillModeParams(width, height, imageWidth, imageHeight, fillMode);
    adapter.drawImage(imageHandle!, drawParams.x, drawParams.y, drawParams.width, drawParams.height);
  }

  /**
   * 计算填充模式的绘制参数
   */
  private calculateFillModeParams(
    containerWidth: number,
    containerHeight: number,
    imageWidth: number,
    imageHeight: number,
    fillMode: FillMode
  ): { x: number; y: number; width: number; height: number } {
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;

    let scale: number;
    if (fillMode === 'cover') {
      // cover: 取较大比例，完全覆盖，可能裁剪
      scale = Math.max(scaleX, scaleY);
    } else {
      // contain: 取较小比例，完整显示，可能留白
      scale = Math.min(scaleX, scaleY);
    }

    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;

    // 居中偏移
    const x = (containerWidth - drawWidth) / 2;
    const y = (containerHeight - drawHeight) / 2;

    return { x, y, width: drawWidth, height: drawHeight };
  }

  /**
   * 应用裁剪路径
   */
  private applyClip(node: ImageNode, clip: ClipInfo, adapter: CanvasAdapter): void {
    if (clip.type === 'circle') {
      // 圆形裁剪：中心点为图片中心
      const cx = node.width / 2;
      const cy = node.height / 2;
      adapter.clipCircle(cx, cy, clip.radius!);
    } else if (clip.type === 'rect') {
      // 圆角矩形裁剪
      adapter.clipRoundRect(0, 0, node.width, node.height, clip.rx ?? 0, clip.ry ?? 0);
    }
  }
}
