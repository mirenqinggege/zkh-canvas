import type {FabricExportJSON, FabricObject} from '../types/FabricTypes';
import type {SceneNode} from '../scene/SceneNode';
import {SceneGraph} from '../scene/SceneGraph';
import {isSupportedNodeType} from '../types/NodeType';
import {RectParser} from './parsers/RectParser';
import {CircleParser} from './parsers/CircleParser';
import {TextParser} from './parsers/TextParser';
import {ImageParser} from './parsers/ImageParser';
import {GroupParser} from './parsers/GroupParser';
import {logger} from '../utils/Logger';

/**
 * Fabric.js JSON 解析器
 */
export class FabricParser {
  /**
   * 解析单个 Fabric 对象（静态方法，供 GroupParser 等调用）
   */
  static parseObject(obj: FabricObject): SceneNode | null {
    // 检查是否为支持的类型
    if (!isSupportedNodeType(obj.type)) {
      logger.warn(`不支持的对象类型: ${obj.type}`);
      return null;
    }

    // 根据类型分发解析
    switch (obj.type) {
      case 'rect':
        return RectParser.parse(obj);

      case 'circle':
        return CircleParser.parse(obj);

      case 'text':
      case 'textbox':
        return TextParser.parse(obj);

      case 'image':
        return ImageParser.parse(obj);

      case 'group':
        return GroupParser.parse(obj);

      default:
        // TypeScript 编译器会确保所有支持的类型都已处理
        logger.warn(`未知对象类型: ${(obj as { type: string }).type}`);
        return null;
    }
  }

  /**
   * 解析 Fabric.js 导出的 JSON
   */
  parse(json: FabricExportJSON): SceneGraph {
    logger.info('开始解析 Fabric JSON', {objectsCount: json.objects.length});

    const nodes: SceneNode[] = [];

    for (const obj of json.objects) {
      const node = FabricParser.parseObject(obj);
      if (node) {
        nodes.push(node);
      } else {
        logger.warn(`不支持的对象类型或解析失败: ${obj.type}`, {object: obj});
      }
    }

    logger.info('Fabric JSON 解析完成', {nodesCount: nodes.length});

    return new SceneGraph(nodes);
  }
}
