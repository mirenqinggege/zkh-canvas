import type { FabricGroup } from '../../types/FabricTypes';
import type { GroupNode } from '../../scene/nodes/GroupNode';
import type { SceneNode } from '../../scene/SceneNode';
import { createGroupNode } from '../../scene/nodes/GroupNode';
import { TransformConverter } from '../TransformConverter';
import { FabricParser } from '../FabricParser';
import { logger } from '../../utils/Logger';

/**
 * Fabric Group 对象解析器
 */
export class GroupParser {
  /**
   * 解析 Fabric Group 对象为 SceneNode
   */
  static parse(obj: FabricGroup): GroupNode | null {
    try {
      // 坐标转换
      const transform = TransformConverter.convert(obj);

      // 解析子节点
      const children: SceneNode[] = [];

      for (const childObj of obj.objects) {
        const childNode = FabricParser.parseObject(childObj);
        if (childNode) {
          // 子节点坐标相对于 Group，需要调整
          // 这里 TransformConverter.convertGroupChild 已经处理了相对坐标
          children.push(childNode);
        } else {
          logger.warn('Group 子节点解析失败，跳过', { type: childObj.type });
        }
      }

      if (children.length === 0) {
        logger.warn('Group 没有有效的子节点', { id: obj.id });
      }

      // 创建节点
      const node = createGroupNode(
        obj.id || `group-${Date.now()}`,
        transform.x,
        transform.y,
        obj.width,
        obj.height,
        children,
        {
          opacity: obj.opacity ?? 1,
          visible: obj.visible ?? true,
          rotation: transform.rotation,
          scaleX: transform.scaleX,
          scaleY: transform.scaleY,
        }
      );

      logger.debug('Group 解析成功', { id: node.id, childrenCount: children.length });

      return node;
    } catch (error) {
      logger.warn('Group 解析失败', { object: obj, error });
      return null;
    }
  }
}