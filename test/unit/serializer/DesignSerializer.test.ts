import { describe, it, expect } from 'vitest';
import { DesignSerializer } from '../../../renderer/serializer/DesignSerializer';
import { createRectNode } from '../../../renderer/scene/nodes/RectNode';
import { createCircleNode } from '../../../renderer/scene/nodes/CircleNode';
import { createTextNode } from '../../../renderer/scene/nodes/TextNode';
import { createImageNode } from '../../../renderer/scene/nodes/ImageNode';
import { createGroupNode } from '../../../renderer/scene/nodes/GroupNode';
import type { GroupNode } from '../../../renderer/scene/nodes/GroupNode';
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

  describe('Rect round-trip', () => {
    it('矩形 serialize -> parse 往返一致', () => {
      const original = createRectNode('r1', 10, 20, 200, 100, {
        rx: 8, ry: 8, fill: '#3498db', stroke: '#2980b9',
        strokeWidth: 2, opacity: 0.9, rotation: 0.5, scaleX: 1.5, scaleY: 1,
      });
      const json = (serializer as any).serializeRect(original);
      expect(json.type).toBe('rect');
      expect(json.rx).toBe(8);
      expect(json.ry).toBe(8);

      const restored = (serializer as any).parseRect(json);
      expect(restored.id).toBe('r1');
      expect(restored.x).toBe(10);
      expect(restored.y).toBe(20);
      expect(restored.width).toBe(200);
      expect(restored.height).toBe(100);
      expect(restored.rx).toBe(8);
      expect(restored.ry).toBe(8);
      expect(restored.fill).toBe('#3498db');
      expect(restored.opacity).toBe(0.9);
      expect(restored.rotation).toBe(0.5);
    });
  });

  describe('Circle round-trip', () => {
    it('圆形 serialize -> parse 往返一致', () => {
      const original = createCircleNode('c1', 50, 50, 40, {
        fill: '#e74c3c', stroke: '#c0392b', strokeWidth: 2,
      });
      const json = (serializer as any).serializeCircle(original);
      expect(json.type).toBe('circle');

      const restored = (serializer as any).parseCircle(json);
      expect(restored.id).toBe('c1');
      expect(restored.radius).toBe(40);
      expect(restored.width).toBe(80);
      expect(restored.height).toBe(80);
      expect(restored.fill).toBe('#e74c3c');
      expect(restored.stroke).toBe('#c0392b');
    });

    it('圆形 round-trip 测试：serializeNode -> parseNode', () => {
      const original = createCircleNode('c2', 100, 100, 50, {
        fill: '#f39c12', rotation: 0.3, scaleX: 1.2,
      });
      const json = serializer['serializeNode'](original);
      expect(json.type).toBe('circle');

      const restored = serializer['parseNode'](json);
      expect(restored!.id).toBe('c2');
      expect((restored as any).radius).toBe(50);
      expect(restored!.rotation).toBe(0.3);
      expect(restored!.scaleX).toBe(1.2);
    });
  });

  describe('Text round-trip', () => {
    it('文本 serialize → parse 往返一致', () => {
      const original = createTextNode('t1', 10, 10, 'Hello World', 200, 40, {
        fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold',
        fontStyle: 'italic', textAlign: 'center',
      });
      const json = (serializer as any).serializeText(original);
      expect(json.text).toBe('Hello World');
      expect(json.fontSize).toBe(24);
      expect(json.fontFamily).toBe('Arial');
      expect(json.fontStyle).toBe('italic');

      const restored = (serializer as any).parseText(json);
      expect(restored.type).toBe('text');
      expect(restored.text).toBe('Hello World');
      expect(restored.fontSize).toBe(24);
      expect(restored.fontWeight).toBe('bold');
      expect(restored.textAlign).toBe('center');
    });

    it('textbox 类型序列化为 text', () => {
      const original = createTextNode('tb1', 0, 0, 'textbox demo', 200, 50);
      const textboxNode = { ...original, type: 'textbox' as const };
      const json = (serializer as any).serializeNode(textboxNode);
      expect(json.type).toBe('text');
    });
  });

  describe('Image round-trip', () => {
    it('图片 serialize → parse 往返一致', () => {
      const original = createImageNode('i1', 0, 0, 200, 150, 'https://example.com/img.png', {
        fillMode: 'cover',
        clip: { type: 'circle', radius: 50 },
      });
      const json = (serializer as any).serializeImage(original);
      expect(json.src).toBe('https://example.com/img.png');
      expect(json.fillMode).toBe('cover');
      expect(json.clip).toEqual({ type: 'circle', radius: 50 });

      const restored = (serializer as any).parseImage(json);
      expect(restored.src).toBe('https://example.com/img.png');
      expect(restored.fillMode).toBe('cover');
      expect(restored.clip).toEqual({ type: 'circle', radius: 50 });
    });
  });

  describe('Group round-trip', () => {
    it('空 Group serialize → parse 往返一致', () => {
      const original = createGroupNode('g1', 0, 0, 300, 200, []);
      const json = (serializer as any).serializeGroup(original);
      expect(json.children).toEqual([]);

      const restored = (serializer as any).parseGroup(json);
      expect(restored.children).toEqual([]);
    });

    it('嵌套 Group serialize → parse 往返一致', () => {
      const childRect = createRectNode('r1', 10, 10, 100, 80, { fill: '#ff0000' });
      const childCircle = createCircleNode('c1', 0, 0, 30, { fill: '#00ff00' });
      const group = createGroupNode('g1', 0, 0, 300, 200, [childRect, childCircle]);
      const parentRect = createRectNode('r2', 50, 50, 50, 50);
      const parentGroup = createGroupNode('g2', 0, 0, 400, 300, [group, parentRect]);

      const json = (serializer as any).serializeGroup(parentGroup);
      expect(json.children.length).toBe(2);
      expect(json.children[0].type).toBe('group');
      expect((json.children[0] as any).children.length).toBe(2);
      expect((json.children[0] as any).children[0].type).toBe('rect');

      const restored = (serializer as any).parseGroup(json);
      expect(restored.children.length).toBe(2);
      const restoredGroup = restored.children[0] as GroupNode;
      expect(restoredGroup.children.length).toBe(2);
      expect(restoredGroup.children[0].type).toBe('rect');
      expect((restoredGroup.children[0] as any).fill).toBe('#ff0000');
    });

    it('serializeNode 分发到 group 方法', () => {
      const group = createGroupNode('g1', 0, 0, 100, 100, []);
      const json = (serializer as any).serializeNode(group);
      expect(json.type).toBe('group');
    });
  });
});
