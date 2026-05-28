import type { ImageNode } from '../../scene/nodes/ImageNode';
import type { CanvasAdapter } from '../../adapters/CanvasAdapter';
import type { NodeRenderer } from '../NodeRenderer';
import { logger } from '../../utils/Logger';

/**
 * 图片渲染器
 */
export class ImageRenderer implements NodeRenderer<ImageNode> {
  render(node: ImageNode, adapter: CanvasAdapter): void {
    const { width, height, imageHandle, src } = node;

    // 检查图片是否已加载
    if (!imageHandle) {
      logger.warn(`图片未加载，无法渲染: ${src}`);
      return;
    }

    // 绘制图片
    adapter.drawImage(imageHandle, 0, 0, width, height);
  }
}