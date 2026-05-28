import type { FabricObjectBase } from '../types/FabricTypes';
import { degToRad } from '../utils/MathUtils';
import { logger } from '../utils/Logger';

/**
 * 坐标转换结果
 */
export interface TransformResult {
  /** 左上角 X 坐标 */
  x: number;
  /** 左上角 Y 坐标 */
  y: number;
  /** 旋转弧度 */
  rotation: number;
  /** X 缩放 */
  scaleX: number;
  /** Y 缩放 */
  scaleY: number;
}

/**
 * Fabric.js 坐标转换器
 * 将 Fabric 的中心点坐标转换为左上角坐标
 */
export class TransformConverter {
  /**
   * 转换 Fabric 对象的坐标和 Transform
   */
  static convert(obj: FabricObjectBase): TransformResult {
    const { left, top, width, height, scaleX = 1, scaleY = 1, angle = 0 } = obj;

    // Fabric 默认使用中心点坐标 (originX='center', originY='center')
    // 转换为左上角坐标
    let x = left;
    let y = top;

    // 处理 originX
    if (obj.originX === 'center' || !obj.originX) {
      // 默认 center，偏移半个宽度
      x = left - (width * scaleX) / 2;
    } else if (obj.originX === 'right') {
      // originX='right'，偏移整个宽度
      x = left - width * scaleX;
    }
    // originX='left' 时不需要偏移

    // 处理 originY
    if (obj.originY === 'center' || !obj.originY) {
      // 默认 center，偏移半个高度
      y = top - (height * scaleY) / 2;
    } else if (obj.originY === 'bottom') {
      // originY='bottom'，偏移整个高度
      y = top - height * scaleY;
    }
    // originY='top' 时不需要偏移

    // 角度转弧度
    const rotation = degToRad(angle);

    logger.debug('坐标转换', {
      original: { left, top, width, height },
      converted: { x, y },
      transform: { rotation, scaleX, scaleY },
    });

    return { x, y, rotation, scaleX, scaleY };
  }

  /**
   * 转换 Group 内部子节点的坐标
   * Group 的子节点坐标是相对于 Group 的，需要保持相对关系
   */
  static convertGroupChild(obj: FabricObjectBase): TransformResult {
    // Group 内子节点的 left/top 已经是相对于 Group 的坐标
    // 但仍然需要处理 originX/originY 的偏移
    return this.convert(obj);
  }
}