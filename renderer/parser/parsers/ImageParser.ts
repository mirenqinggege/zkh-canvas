import type {FabricImage} from '../../types/FabricTypes';
import type {ImageNode} from '../../scene/nodes/ImageNode';
import {createImageNode} from '../../scene/nodes/ImageNode';
import {TransformConverter} from '../TransformConverter';
import {logger} from '../../utils/Logger';

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
      // Fabric Image 的 src 可能在不同位置
      const src = this.extractImageSrc(obj);

      if (!src) {
        logger.warn('Image 缺少 src', {object: obj});
        return null;
      }

      // 创建节点
      const node = createImageNode(
        obj.id || `image-${Date.now()}`,
        transform.x,
        transform.y,
        obj.width,
        obj.height,
        src,
        {
          opacity: obj.opacity ?? 1,
          visible: obj.visible ?? true,
          rotation: transform.rotation,
          scaleX: transform.scaleX,
          scaleY: transform.scaleY,
        }
      );

      logger.debug('Image 解析成功', {id: node.id, src: node.src});

      return node;
    } catch (error) {
      logger.warn('Image 解析失败', {object: obj, error});
      return null;
    }
  }

  /**
   * 提取图片源地址
   * Fabric Image 的 src 来源可能多样
   */
  private static extractImageSrc(obj: FabricImage): string | null {
    // 直接 src 属性
    if (obj.src) return obj.src;

    // 其他可能的属性（需要根据实际情况扩展）
    // Fabric.js 的 _src、srcFromAttribute 等

    return null;
  }
}
