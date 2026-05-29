import type { SceneNode } from '../scene/SceneNode';
import { SceneGraph } from '../scene/SceneGraph';
import { createRectNode, type RectNode } from '../scene/nodes/RectNode';
import { createCircleNode, type CircleNode } from '../scene/nodes/CircleNode';
import { createTextNode, type TextNode } from '../scene/nodes/TextNode';
import { createImageNode, type ImageNode } from '../scene/nodes/ImageNode';
import { createGroupNode, type GroupNode } from '../scene/nodes/GroupNode';
import type {
  DesignJSON,
  DesignNode,
  DesignNodeBase,
  DesignRect,
  DesignCircle,
  DesignText,
  DesignImage,
  DesignGroup,
} from '../types/DesignTypes';

export class DesignSerializer {
  /**
   * SceneGraph -> DesignJSON（导出）
   */
  serialize(graph: SceneGraph, canvasWidth: number, canvasHeight: number): DesignJSON {
    return {
      version: '1.0',
      width: canvasWidth,
      height: canvasHeight,
      nodes: graph.getNodes().map(node => this.serializeNode(node)),
    };
  }

  /**
   * DesignJSON -> SceneGraph（导入）
   */
  parse(json: DesignJSON): { graph: SceneGraph; width: number; height: number } {
    const nodes = json.nodes
      .map(node => this.parseNode(node))
      .filter(Boolean) as SceneNode[];
    const graph = new SceneGraph(nodes);
    return { graph, width: json.width, height: json.height };
  }

  // ========== 序列化 ==========

  private serializeNode(node: SceneNode): DesignNode {
    switch (node.type) {
      case 'rect':
        return this.serializeRect(node as RectNode);
      case 'circle':
        return this.serializeCircle(node as CircleNode);
      case 'text':
      case 'textbox':
        return this.serializeText(node as TextNode);
      case 'image':
        return this.serializeImage(node as ImageNode);
      case 'group':
        return this.serializeGroup(node as GroupNode);
    }
  }

  private extractBaseProps(node: SceneNode): DesignNodeBase {
    return {
      id: node.id,
      type: node.type === 'textbox' ? 'text' : node.type,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rotation: node.rotation,
      scaleX: node.scaleX,
      scaleY: node.scaleY,
      fill: node.fill,
      stroke: node.stroke,
      strokeWidth: node.strokeWidth,
      opacity: node.opacity,
      visible: node.visible,
      locked: node.locked,
      clip: node.clip,
    };
  }

  private applyBaseProps(base: Partial<DesignNodeBase>): Omit<SceneNode, 'type'> {
    return {
      id: base.id ?? '',
      x: base.x ?? 0,
      y: base.y ?? 0,
      width: base.width ?? 0,
      height: base.height ?? 0,
      rotation: base.rotation ?? 0,
      scaleX: base.scaleX ?? 1,
      scaleY: base.scaleY ?? 1,
      fill: base.fill ?? null,
      stroke: base.stroke ?? null,
      strokeWidth: base.strokeWidth ?? 0,
      opacity: base.opacity ?? 1,
      visible: base.visible ?? true,
      locked: base.locked,
      clip: base.clip,
    };
  }

  private serializeRect(node: RectNode): DesignRect {
    return { ...this.extractBaseProps(node), rx: node.rx, ry: node.ry } as DesignRect;
  }

  private serializeCircle(node: CircleNode): DesignCircle {
    return this.extractBaseProps(node) as DesignCircle;
  }

  private serializeText(node: TextNode): DesignText {
    return {
      ...this.extractBaseProps(node),
      text: node.text,
      fontSize: node.fontSize,
      fontFamily: node.fontFamily,
      fontWeight: node.fontWeight,
      fontStyle: node.fontStyle,
      textAlign: node.textAlign,
      textBaseline: node.textBaseline,
    } as DesignText;
  }

  private serializeImage(node: ImageNode): DesignImage {
    return {
      ...this.extractBaseProps(node),
      src: node.src,
      fillMode: node.fillMode,
    } as DesignImage;
  }

  private serializeGroup(node: GroupNode): DesignGroup {
    return {
      ...this.extractBaseProps(node),
      children: node.children.map(c => this.serializeNode(c)),
    } as DesignGroup;
  }

  // ========== 解析 ==========

  private parseNode(node: DesignNode): SceneNode | null {
    if (!node || !node.type) return null;
    switch (node.type) {
      case 'rect':
        return this.parseRect(node as DesignRect);
      case 'circle':
        return this.parseCircle(node as DesignCircle);
      case 'text':
        return this.parseText(node as DesignText);
      case 'image':
        return this.parseImage(node as DesignImage);
      case 'group':
        return this.parseGroup(node as DesignGroup);
      default:
        return null;
    }
  }

  private parseRect(node: DesignRect): RectNode {
    const base = this.applyBaseProps(node);
    return createRectNode(base.id, base.x, base.y, base.width, base.height, {
      rx: node.rx,
      ry: node.ry,
      fill: base.fill,
      stroke: base.stroke,
      strokeWidth: base.strokeWidth,
      opacity: base.opacity,
      visible: base.visible,
      locked: base.locked,
      rotation: base.rotation,
      scaleX: base.scaleX,
      scaleY: base.scaleY,
      clip: base.clip,
    });
  }

  private parseCircle(node: DesignCircle): CircleNode {
    const base = this.applyBaseProps(node);
    const radius = base.width / 2;
    return createCircleNode(base.id, base.x, base.y, radius, {
      fill: base.fill,
      stroke: base.stroke,
      strokeWidth: base.strokeWidth,
      opacity: base.opacity,
      visible: base.visible,
      locked: base.locked,
      rotation: base.rotation,
      scaleX: base.scaleX,
      scaleY: base.scaleY,
      clip: base.clip,
    });
  }

  private parseText(node: DesignText): TextNode {
    const base = this.applyBaseProps(node);
    return createTextNode(base.id, base.x, base.y, node.text, base.width, base.height, {
      fontSize: node.fontSize ?? 16,
      fontFamily: node.fontFamily ?? 'sans-serif',
      fontWeight: node.fontWeight ?? 'normal',
      fontStyle: node.fontStyle ?? 'normal',
      textAlign: node.textAlign ?? 'left',
      textBaseline: node.textBaseline ?? 'top',
      fill: base.fill,
      stroke: base.stroke,
      strokeWidth: base.strokeWidth,
      opacity: base.opacity,
      visible: base.visible,
      locked: base.locked,
      rotation: base.rotation,
      scaleX: base.scaleX,
      scaleY: base.scaleY,
      clip: base.clip,
    });
  }

  private parseImage(node: DesignImage): ImageNode {
    const base = this.applyBaseProps(node);
    return createImageNode(base.id, base.x, base.y, base.width, base.height, node.src, {
      fillMode: node.fillMode,
      clip: base.clip,
      opacity: base.opacity,
      visible: base.visible,
      locked: base.locked,
      rotation: base.rotation,
      scaleX: base.scaleX,
      scaleY: base.scaleY,
    });
  }

  private parseGroup(node: DesignGroup): GroupNode {
    const base = this.applyBaseProps(node);
    const children = (node.children || [])
      .map(child => this.parseNode(child))
      .filter(Boolean) as SceneNode[];
    return createGroupNode(base.id, base.x, base.y, base.width, base.height, children, {
      opacity: base.opacity,
      visible: base.visible,
      locked: base.locked,
      rotation: base.rotation,
      scaleX: base.scaleX,
      scaleY: base.scaleY,
      clip: base.clip,
    });
  }
}
