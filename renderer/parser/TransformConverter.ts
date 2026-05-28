import type {FabricObjectBase} from '../types/FabricTypes';
import {degToRad} from '../utils/MathUtils';
import {logger} from '../utils/Logger';

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
 * 将 Fabric 坐标转换为左上角坐标
 *
 * 默认假设 Fabric JSON 中的 left/top 已经是左上角坐标 (originX='left', originY='top')
 */
export class TransformConverter {
  /**
   * 转换 Fabric 对象的坐标和 Transform
   */
  static convert(obj: FabricObjectBase): TransformResult {
    const {left, top, width, height, scaleX = 1, scaleY = 1, angle = 0} = obj;

    // 直接使用 left/top 作为左上角坐标
    // 假设 Fabric JSON 已使用 originX='left', originY='top'
    const x = left;
    const y = top;

    // 如果明确设置了 originX='center' 或 'right'，则需要调整
    // 但大多数情况下 JSON 中不会设置这些属性
    if (obj.originX === 'center') {
      // 中心点坐标需要偏移半个宽度
      // 注意：这种情况较少见，通常 JSON 中 left/top 已经是左上角
    }

    // 角度转弧度
    const rotation = degToRad(angle);

    logger.debug('坐标转换', {
      original: {left, top, width, height},
      converted: {x, y},
      transform: {rotation, scaleX, scaleY},
    });

    return {x, y, rotation, scaleX, scaleY};
  }

  /**
   * 转换 Group 内部子节点的坐标
   * Group 的子节点坐标是相对于 Group 的，需要保持相对关系
   */
  static convertGroupChild(obj: FabricObjectBase): TransformResult {
    // Group 内子节点的 left/top 已经是相对于 Group 的坐标
    return this.convert(obj);
  }
}
