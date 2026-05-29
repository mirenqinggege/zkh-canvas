import type {FabricImage} from '../../types/FabricTypes';
import type {ImageNode} from '../../scene/nodes/ImageNode';
import {createImageNode} from '../../scene/nodes/ImageNode';
import {parseClipPath} from './ClipPathParser';
import {TransformConverter} from '../TransformConverter';
import {logger} from '../../utils/Logger';
import {generateNodeId} from './NodeIdGenerator';

/**
 * Fabric Image 对象解析器
 */
export class ImageParser {
  /**
   * 解析 Fabric Image 对象为 SceneNode
   */
  static parse(obj: FabricImage): ImageNode | null {
    try {
      // 坐标转换
      const transform = TransformConverter.convert(obj);

      // 图片源地址
      const src = this.extractImageSrc(obj);

      if (!src) {
        logger.warn('Image 缺少 src', {object: obj});
        return null;
      }

      // 解析裁剪信息
      const clip = parseClipPath(obj.clipPath);

      // 解析填充模式
      const fillMode: 'fill' | 'cover' | 'contain' = obj.fillMode || 'fill';

      // 创建节点
      const node = createImageNode(
        generateNodeId('image', obj.id),
        transform.x,
        transform.y,
        obj.width,
        obj.height,
        src,
        {
          opacity: obj.opacity ?? 1,
          visible: obj.visible ?? true,
          locked: obj.locked,
          rotation: transform.rotation,
          scaleX: transform.scaleX,
          scaleY: transform.scaleY,
          fillMode,
          clip,
        }
      );

      logger.debug('Image 解析成功', {id: node.id, src: node.src, fillMode: node.fillMode, clip: node.clip});

      return node;
    } catch (error) {
      logger.warn('Image 解析失败', {object: obj, error});
      return null;
    }
  }

  /**
   * 提取图片源地址
   */
  private static extractImageSrc(obj: FabricImage): string | null {
    if (obj.src) return obj.src;
    return null;
  }
}
