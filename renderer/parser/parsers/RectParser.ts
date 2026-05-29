import type {FabricRect} from '../../types/FabricTypes';
import type {RectNode} from '../../scene/nodes/RectNode';
import {createRectNode} from '../../scene/nodes/RectNode';
import {parseClipPath} from './ClipPathParser';
import {TransformConverter} from '../TransformConverter';
import {normalizeColor} from '../../utils/ColorParser';
import {logger} from '../../utils/Logger';
import {generateNodeId} from './NodeIdGenerator';

/**
 * Fabric Rect 对象解析器
 */
export class RectParser {
  /**
   * 解析 Fabric Rect 对象为 SceneNode
   */
  static parse(obj: FabricRect): RectNode | null {
    try {
      // 坐标转换
      const transform = TransformConverter.convert(obj);

      // 解析裁剪信息
      const clip = parseClipPath(obj.clipPath, obj.width, obj.height);

      // 创建节点
      const node = createRectNode(
        generateNodeId('rect', obj.id),
        transform.x,
        transform.y,
        obj.width,
        obj.height,
        {
          rx: obj.rx || 0,
          ry: obj.ry || 0,
          fill: normalizeColor(obj.fill),
          stroke: normalizeColor(obj.stroke),
          strokeWidth: obj.strokeWidth || 1,
          opacity: obj.opacity ?? 1,
          visible: obj.visible ?? true,
          rotation: transform.rotation,
          scaleX: transform.scaleX,
          scaleY: transform.scaleY,
          clip,
        }
      );

      logger.debug('Rect 解析成功', {
        id: node.id,
        bounds: {x: node.x, y: node.y, width: node.width, height: node.height}
      });

      return node;
    } catch (error) {
      logger.warn('Rect 解析失败', {object: obj, error});
      return null;
    }
  }
}
