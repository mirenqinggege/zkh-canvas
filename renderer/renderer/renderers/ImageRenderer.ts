import type {ImageNode, ClipInfo} from '../../scene/nodes/ImageNode';
import type {CanvasAdapter} from '../../adapters/CanvasAdapter';
import type {NodeRenderer} from '../NodeRenderer';
import {logger} from '../../utils/Logger';

/**
 * 图片渲染器
 */
export class ImageRenderer implements NodeRenderer<ImageNode> {
  render(node: ImageNode, adapter: CanvasAdapter): void {
    const {width, height, imageHandle, src, clip} = node;

    // 检查图片是否已加载
    if (!imageHandle) {
      logger.warn(`图片未加载，无法渲染: ${src}`);
      return;
    }

    // 有裁剪时
    if (clip) {
      adapter.save();
      this.applyClip(node, clip, adapter);
      adapter.drawImage(imageHandle, 0, 0, width, height);
      adapter.restore();
    } else {
      // 无裁剪，直接绘制
      adapter.drawImage(imageHandle, 0, 0, width, height);
    }
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
