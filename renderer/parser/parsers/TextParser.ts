import type { FabricText } from '../../types/FabricTypes';
import type { TextNode, TextAlign } from '../../scene/nodes/TextNode';
import { createTextNode } from '../../scene/nodes/TextNode';
import { TransformConverter } from '../TransformConverter';
import { normalizeColor } from '../../utils/ColorParser';
import { logger } from '../../utils/Logger';

/**
 * Fabric Text/Textbox 对象解析器
 */
export class TextParser {
  /**
   * 解析 Fabric Text 对象为 SceneNode
   */
  static parse(obj: FabricText): TextNode | null {
    try {
      // 坐标转换
      const transform = TransformConverter.convert(obj);

      // 文本对齐方式映射
      const textAlignMap: Record<string, TextAlign> = {
        left: 'left',
        center: 'center',
        right: 'right',
        justify: 'left', // justify 暂时映射为 left
      };

      const textAlign = textAlignMap[obj.textAlign || 'left'];

      // 创建节点
      const node = createTextNode(
        obj.id || `text-${Date.now()}`,
        transform.x,
        transform.y,
        obj.text,
        obj.width,
        obj.height,
        {
          fontSize: obj.fontSize || 16,
          fontFamily: obj.fontFamily || 'sans-serif',
          fontWeight: obj.fontWeight || 'normal',
          textAlign,
          fill: normalizeColor(obj.fill) || '#000000',
          stroke: normalizeColor(obj.stroke),
          strokeWidth: obj.strokeWidth || 1,
          opacity: obj.opacity ?? 1,
          visible: obj.visible ?? true,
          rotation: transform.rotation,
          scaleX: transform.scaleX,
          scaleY: transform.scaleY,
        }
      );

      logger.debug('Text 解析成功', { id: node.id, text: node.text.substring(0, 20) + '...' });

      return node;
    } catch (error) {
      logger.warn('Text 解析失败', { object: obj, error });
      return null;
    }
  }
}