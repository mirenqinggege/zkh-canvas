import type {FabricCircle} from '../../types/FabricTypes';
import type {CircleNode} from '../../scene/nodes/CircleNode';
import {createCircleNode} from '../../scene/nodes/CircleNode';
import {parseClipPath} from './ClipPathParser';
import {TransformConverter} from '../TransformConverter';
import {normalizeColor} from '../../utils/ColorParser';
import {logger} from '../../utils/Logger';
import {generateNodeId} from './NodeIdGenerator';

/**
 * Fabric Circle 对象解析器
 */
export class CircleParser {
  /**
   * 解析 Fabric Circle 对象为 SceneNode
   */
  static parse(obj: FabricCircle): CircleNode | null {
    try {
      // 坐标转换
      const transform = TransformConverter.convert(obj);

      // Circle 的半径
      const radius = obj.radius;

      // 解析裁剪信息
      const clip = parseClipPath(obj.clipPath);

      // Circle 在 Fabric 中 left/top 是圆心坐标
      // 转换后 x/y 是圆的外接矩形左上角
      // 圆心位于 (x + radius, y + radius)
      const circleX = transform.x;
      const circleY = transform.y;

      // 创建节点
      const node = createCircleNode(
        generateNodeId('circle', obj.id),
        circleX,
        circleY,
        radius,
        {
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

      logger.debug('Circle 解析成功', {id: node.id, radius: node.radius});

      return node;
    } catch (error) {
      logger.warn('Circle 解析失败', {object: obj, error});
      return null;
    }
  }
}
