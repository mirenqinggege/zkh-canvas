import type {
  CardTemplateJSON,
  CardElement,
  CardBackground,
  AvatarElement,
  TextFieldElement,
  ImageElement,
  RectElement
} from '../types/CardTypes';
import type {SceneNode} from '../scene/SceneNode';
import type {ClipInfo, FillMode} from '../scene/nodes/ImageNode';
import type {FontStyle} from '../adapters/types/FontOptions';
import {SceneGraph} from '../scene/SceneGraph';
import {createImageNode} from '../scene/nodes/ImageNode';
import {createTextNode} from '../scene/nodes/TextNode';
import {createRectNode} from '../scene/nodes/RectNode';
import {logger} from '../utils/Logger';

/**
 * 名片模板 JSON 解析器
 * 将 CardTemplateJSON 转换为 SceneGraph
 */
export class CardParser {
  /**
   * 解析名片模板 JSON
   */
  parse(json: CardTemplateJSON): SceneGraph {
    logger.info('开始解析名片模板 JSON', {elementsCount: json.elements.length});

    const nodes: SceneNode[] = [];

    // 1. 解析背景
    if (json.background) {
      const backgroundNode = this.parseBackground(json.background, json.size);
      if (backgroundNode) {
        nodes.push(backgroundNode);
      }
    }

    // 2. 解析元素
    for (const element of json.elements) {
      const node = this.parseElement(element);
      if (node) {
        nodes.push(node);
      }
    }

    logger.info('名片模板解析完成', {nodesCount: nodes.length});

    return new SceneGraph(nodes);
  }

  /**
   * 解析背景
   */
  private parseBackground(background: CardBackground, size: {width: number; height: number}): SceneNode | null {
    if (background.type === 'image' && background.image?.url) {
      // 背景图片
      const fillMode: FillMode = background.image.fillMode || 'fill';
      return createImageNode(
        'background',
        background.image.position?.x || 0,
        background.image.position?.y || 0,
        size.width,
        size.height,
        background.image.url,
        {fillMode, opacity: 1, visible: true}
      );
    }

    if (background.type === 'color' && background.color) {
      // 背景颜色
      return createRectNode(
        'background',
        0,
        0,
        size.width,
        size.height,
        {fill: background.color, opacity: 1, visible: true}
      );
    }

    return null;
  }

  /**
   * 解析单个元素
   */
  private parseElement(element: CardElement): SceneNode | null {
    switch (element.type) {
      case 'avatar':
        return this.parseAvatar(element as AvatarElement);
      case 'text-field':
        return this.parseTextField(element as TextFieldElement);
      case 'image':
        return this.parseImage(element as ImageElement);
      case 'rect':
        return this.parseRect(element as RectElement);
      default:
        const unknownElement = element as { type: string };
        logger.warn(`不支持的元素类型: ${unknownElement.type}`);
        return null;
    }
  }

  /**
   * 解析头像元素
   */
  private parseAvatar(element: AvatarElement): SceneNode | null {
    if (!element.imageUrl) {
      logger.debug('头像 URL 为空，跳过');
      return null;
    }

    const fillMode: FillMode = element.fillMode || 'cover';
    const clip: ClipInfo = {type: 'circle', radius: Math.min(element.width, element.height) / 2};

    return createImageNode(
      element.id,
      element.x,
      element.y,
      element.width,
      element.height,
      element.imageUrl,
      {
        fillMode,
        clip,
        opacity: element.opacity ?? 1,
        visible: true,
      }
    );
  }

  /**
   * 解析文本字段元素
   */
  private parseTextField(element: TextFieldElement): SceneNode | null {
    const {styles} = element;
    const fontStyle: FontStyle = styles.fontStyle === 'italic' ? 'italic' :
      styles.fontStyle === 'oblique' ? 'oblique' : 'normal';

    return createTextNode(
      element.id,
      element.x,
      element.y,
      element.label,
      element.width,
      element.height,
      {
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        fontWeight: styles.fontWeight,
        fontStyle,
        textAlign: 'left',
        fill: styles.color,
        opacity: element.opacity ?? 1,
        visible: true,
      }
    );
  }

  /**
   * 解析图片元素
   */
  private parseImage(element: ImageElement): SceneNode | null {
    if (!element.imageUrl) {
      logger.debug('图片 URL 为空，跳过');
      return null;
    }

    const fillMode: FillMode = element.fillMode || 'fill';

    return createImageNode(
      element.id,
      element.x,
      element.y,
      element.width,
      element.height,
      element.imageUrl,
      {
        fillMode,
        opacity: element.opacity ?? 1,
        visible: true,
      }
    );
  }

  /**
   * 解析矩形元素
   */
  private parseRect(element: RectElement): SceneNode | null {
    return createRectNode(
      element.id,
      element.x,
      element.y,
      element.width,
      element.height,
      {
        fill: element.fill,
        stroke: element.stroke,
        strokeWidth: element.strokeWidth ?? 1,
        rx: element.rx ?? 0,
        ry: element.ry ?? 0,
        opacity: element.opacity ?? 1,
        visible: true,
      }
    );
  }
}