import type {FabricImage, FabricClipPath} from '../../types/FabricTypes';
import type {ImageNode, ClipInfo} from '../../scene/nodes/ImageNode';
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
      const src = this.extractImageSrc(obj);

      if (!src) {
        logger.warn('Image 缺少 src', {object: obj});
        return null;
      }

      // 解析裁剪信息
      const clip = this.parseClipPath(obj.clipPath, obj.width, obj.height);

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
          clip,
        }
      );

      logger.debug('Image 解析成功', {id: node.id, src: node.src, clip: node.clip});

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

  /**
   * 解析裁剪路径
   */
  private static parseClipPath(
    clipPath: FabricClipPath | undefined,
    nodeWidth: number,
    nodeHeight: number
  ): ClipInfo | undefined {
    if (!clipPath) return undefined;

    if (clipPath.type === 'circle') {
      // 有 radius 用 radius，没有则自动计算
      const radius = clipPath.radius ?? Math.min(nodeWidth, nodeHeight) / 2;
      return {type: 'circle', radius};
    }

    if (clipPath.type === 'rect') {
      return {
        type: 'rect',
        rx: clipPath.rx ?? 0,
        ry: clipPath.ry ?? 0,
      };
    }

    return undefined;
  }
}
