import { describe, it, expect } from 'vitest';
import { DesignSerializer } from '../../../renderer/serializer/DesignSerializer';
import { createRectNode } from '../../../renderer/scene/nodes/RectNode';
import { SceneGraph } from '../../../renderer/scene/SceneGraph';

describe('DesignSerializer', () => {
  const serializer = new DesignSerializer();

  describe('extractBaseProps', () => {
    it('提取所有公共属性值', () => {
      const node = createRectNode('r1', 10, 20, 100, 50, {
        fill: '#ff0000', stroke: '#000', strokeWidth: 2,
        opacity: 0.8, rotation: 0.5, scaleX: 2, scaleY: 1.5, visible: false,
      });
      const props = (serializer as any).extractBaseProps(node);
      expect(props.id).toBe('r1');
      expect(props.x).toBe(10);
      expect(props.y).toBe(20);
      expect(props.width).toBe(100);
      expect(props.height).toBe(50);
      expect(props.rotation).toBe(0.5);
      expect(props.scaleX).toBe(2);
      expect(props.scaleY).toBe(1.5);
      expect(props.fill).toBe('#ff0000');
      expect(props.stroke).toBe('#000');
      expect(props.strokeWidth).toBe(2);
      expect(props.opacity).toBe(0.8);
      expect(props.visible).toBe(false);
    });

    it('textbox 类型映射为 text', () => {
      const node = createRectNode('t1', 0, 0, 100, 30);
      const textboxNode = { ...node, type: 'textbox' as const };
      const props = (serializer as any).extractBaseProps(textboxNode);
      expect(props.type).toBe('text');
    });
  });

  describe('applyBaseProps', () => {
    it('完整属性正确应用', () => {
      const base = {
        id: 'r1', type: 'rect' as const,
        x: 10, y: 20, width: 100, height: 50,
        rotation: 0.5, scaleX: 2, scaleY: 1.5,
        fill: '#ff0000', stroke: '#000', strokeWidth: 2,
        opacity: 0.8, visible: false,
      };
      const props = (serializer as any).applyBaseProps(base);
      expect(props.x).toBe(10);
      expect(props.rotation).toBe(0.5);
      expect(props.scaleX).toBe(2);
      expect(props.visible).toBe(false);
    });

    it('缺失属性使用默认值', () => {
      const base = { id: 'r1', type: 'rect' as const, x: 0, y: 0, width: 0, height: 0 };
      const props = (serializer as any).applyBaseProps(base);
      expect(props.rotation).toBe(0);
      expect(props.scaleX).toBe(1);
      expect(props.scaleY).toBe(1);
      expect(props.fill).toBeNull();
      expect(props.stroke).toBeNull();
      expect(props.strokeWidth).toBe(0);
      expect(props.opacity).toBe(1);
      expect(props.visible).toBe(true);
    });
  });

  describe('serialize/parse entry', () => {
    it('serialize 返回完整 DesignJSON 结构', () => {
      const rect = createRectNode('r1', 10, 20, 100, 50);
      const graph = new SceneGraph([rect]);
      const json = serializer.serialize(graph, 800, 600);
      expect(json.version).toBe('1.0');
      expect(json.width).toBe(800);
      expect(json.height).toBe(600);
      expect(json.nodes.length).toBe(1);
    });
  });
});
