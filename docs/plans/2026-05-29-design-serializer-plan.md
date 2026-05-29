# DesignSerializer 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 实现 SceneGraph ↔ JSON 双向序列化，让 Canvas 引擎能够保存和恢复编辑后的设计稿。

**架构:** 纯数据转换层，不依赖 Canvas API。`DesignSerializer` 类提供 `serialize(graph) → JSON` 和 `parse(json) → graph` 双向方法。Engine 层增加 `getSceneGraph()` 和 `renderGraph()` 支撑方法。

**Tech Stack:** TypeScript, vitest (新增测试依赖)

**前置条件:** 基于当前 main 分支的最新提交（49e41f3），已在 `docs/superpowers/specs/2026-05-29-canvas-design-serializer-design.md` 中定义了完整设计。

---

### Task 1: 测试基础设施搭建

**Files:**
- Modify: `package.json` (新增 vitest 依赖)
- Create: `vitest.config.ts`
- Create: `test/unit/tsconfig.json`
- Create: `test/unit/serializer/DesignSerializer.test.ts` (骨架)

**Step 1: 安装 vitest**

```bash
npm install -D vitest
```

**Step 2: 创建 vitest 配置**

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    exclude: ['node_modules'],
  },
});
```

**Step 3: 创建测试目录 tsconfig**

`test/unit/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "include": ["./**/*.test.ts"]
}
```

**Step 4: 创建测试骨架并验证运行**

`test/unit/serializer/DesignSerializer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('DesignSerializer', () => {
  it('placeholder', () => {
    expect(true).toBe(true);
  });
});
```

**Step 5: 验证测试通过**

```bash
npx vitest run
```

Expected: 1 test passed

**Step 6: 提交**

```bash
git add package.json vitest.config.ts test/unit/tsconfig.json test/unit/serializer/DesignSerializer.test.ts
git commit -m "test: add vitest infrastructure"
```

---

### Task 2: DesignJSON 类型定义

**Files:**
- Create: `renderer/types/DesignTypes.ts`
- Modify: `renderer/types/index.ts` (导出新类型)

**Step 1: 先编写测试**

`test/unit/serializer/DesignSerializer.test.ts` — 替换 placeholder:
```typescript
import { describe, it, expect } from 'vitest';
import type { DesignJSON, DesignNode, DesignRect } from '../../../renderer/types/DesignTypes';

describe('DesignTypes', () => {
  it('DesignJSON 结构正确', () => {
    const json: DesignJSON = {
      version: '1.0',
      width: 800,
      height: 600,
      nodes: [],
    };
    expect(json.version).toBe('1.0');
  });

  it('DesignRect 包含完整字段', () => {
    const node: DesignRect = {
      id: 'r1', type: 'rect',
      x: 10, y: 20, width: 100, height: 50,
      rotation: 0, scaleX: 1, scaleY: 1,
      fill: '#ff0000', stroke: null, strokeWidth: 1,
      opacity: 1, visible: true,
      rx: 8, ry: 8,
    };
    expect(node.type).toBe('rect');
    expect(node.rx).toBe(8);
  });
});
```

Expected: 2 tests passed (after next step)

**Step 2: 实现 DesignTypes**

`renderer/types/DesignTypes.ts`:
```typescript
export interface DesignJSON {
  version: string;
  width: number;
  height: number;
  nodes: DesignNode[];
}

export type DesignNode = DesignRect | DesignCircle | DesignText | DesignImage | DesignGroup;

export interface DesignNodeBase {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
}

export interface DesignRect extends DesignNodeBase {
  type: 'rect';
  rx?: number;
  ry?: number;
}

export interface DesignCircle extends DesignNodeBase {
  type: 'circle';
}

export interface DesignText extends DesignNodeBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: 'normal' | 'italic' | 'oblique';
  textAlign: 'left' | 'center' | 'right';
}

export interface DesignImage extends DesignNodeBase {
  type: 'image';
  src: string;
  fillMode?: 'fill' | 'cover' | 'contain';
  clip?: { type: 'circle'; radius: number } | { type: 'rect'; rx?: number; ry?: number };
}

export interface DesignGroup extends DesignNodeBase {
  type: 'group';
  children: DesignNode[];
}
```

**Step 3: 更新 types/index.ts**

新增导出：
```typescript
export type { DesignJSON, DesignNode, DesignNodeBase, DesignRect, DesignCircle, DesignText, DesignImage, DesignGroup } from './DesignTypes';
```

**Step 4: 验证**

```bash
npx vitest run
```

Expected: 2 tests passed

**Step 5: 提交**

```bash
git add renderer/types/DesignTypes.ts renderer/types/index.ts test/unit/serializer/DesignSerializer.test.ts
git commit -m "feat: add DesignJSON type definitions"
```

---

### Task 3: DesignSerializer 骨架 + 公共属性处理

**Files:**
- Create: `renderer/serializer/DesignSerializer.ts`
- Create: `renderer/serializer/index.ts`

**Step 1: 编写测试**

`test/unit/serializer/DesignSerializer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { DesignSerializer } from '../../../renderer/serializer/DesignSerializer';
import { createRectNode } from '../../../renderer/scene/nodes/RectNode';

describe('DesignSerializer', () => {
  const serializer = new DesignSerializer();

  describe('extractBaseProps', () => {
    it('提取公共属性值', () => {
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
      // 手动改为 text 类型验证映射
      const textNode = { ...node, type: 'textbox' as const };
      const props = (serializer as any).extractBaseProps(textNode);
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
    });

    it('缺失属性使用默认值', () => {
      const base = { id: 'r1', type: 'rect', x: 0, y: 0, width: 0, height: 0 };
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
});
```

**Step 2: 实现 DesignSerializer 骨架 + 公共属性方法**

`renderer/serializer/DesignSerializer.ts`:
```typescript
import type { SceneNode } from '../scene/SceneNode';
import type { SceneGraph } from '../scene/SceneGraph';
import type { RectNode } from '../scene/nodes/RectNode';
import type { CircleNode } from '../scene/nodes/CircleNode';
import type { TextNode } from '../scene/nodes/TextNode';
import type { ImageNode } from '../scene/nodes/ImageNode';
import type { GroupNode } from '../scene/nodes/GroupNode';
import type { DesignJSON, DesignNode, DesignNodeBase } from '../types/DesignTypes';

export class DesignSerializer {
  /**
   * SceneGraph → DesignJSON（导出）
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
   * DesignJSON → SceneGraph（导入）
   */
  parse(json: DesignJSON): { graph: SceneGraph; width: number; height: number } {
    const { SceneGraph } = require('../scene/SceneGraph');
    const nodes = json.nodes.map(node => this.parseNode(node)).filter(Boolean) as SceneNode[];
    const graph = new SceneGraph(nodes);
    return { graph, width: json.width, height: json.height };
  }

  // ========== 序列化 ==========

  private serializeNode(node: SceneNode): DesignNode {
    switch (node.type) {
      case 'rect':     return this.serializeRect(node as RectNode);
      case 'circle':   return this.serializeCircle(node as CircleNode);
      case 'text':
      case 'textbox':  return this.serializeText(node as TextNode);
      case 'image':    return this.serializeImage(node as ImageNode);
      case 'group':    return this.serializeGroup(node as GroupNode);
    }
  }

  private extractBaseProps(node: SceneNode): DesignNodeBase {
    return {
      id: node.id,
      type: node.type === 'textbox' ? 'text' : node.type,
      x: node.x, y: node.y,
      width: node.width, height: node.height,
      rotation: node.rotation,
      scaleX: node.scaleX, scaleY: node.scaleY,
      fill: node.fill, stroke: node.stroke,
      strokeWidth: node.strokeWidth,
      opacity: node.opacity,
      visible: node.visible,
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
    };
  }

  // 各类型序列化/解析方法暂为桩
  private serializeRect(node: RectNode): any { return { ...this.extractBaseProps(node), rx: node.rx, ry: node.ry }; }
  private serializeCircle(node: CircleNode): any { return this.extractBaseProps(node); }
  private serializeText(node: TextNode): any { return { ...this.extractBaseProps(node), text: node.text, fontSize: node.fontSize, fontFamily: node.fontFamily, fontWeight: node.fontWeight, fontStyle: node.fontStyle, textAlign: node.textAlign }; }
  private serializeImage(node: ImageNode): any { return { ...this.extractBaseProps(node), src: node.src, fillMode: node.fillMode, clip: node.clip }; }
  private serializeGroup(node: GroupNode): any { return { ...this.extractBaseProps(node), children: node.children.map(c => this.serializeNode(c)) }; }

  private parseNode(node: any): SceneNode | null {
    if (!node || !node.type) return null;
    switch (node.type) {
      case 'rect': return this.parseRect(node);
      case 'circle': return this.parseCircle(node);
      case 'text': return this.parseText(node);
      case 'image': return this.parseImage(node);
      case 'group': return this.parseGroup(node);
      default: return null;
    }
  }
  private parseRect(node: any): any { /* stub */ }
  private parseCircle(node: any): any { /* stub */ }
  private parseText(node: any): any { /* stub */ }
  private parseImage(node: any): any { /* stub */ }
  private parseGroup(node: any): any { /* stub */ }
}
```

**Step 3: 创建 serializer/index.ts**

`renderer/serializer/index.ts`:
```typescript
export { DesignSerializer } from './DesignSerializer';
```

**Step 4: 验证**

```bash
npx vitest run
```

Expected: 4 tests passed

**Step 5: 提交**

```bash
git add renderer/serializer/ test/unit/serializer/DesignSerializer.test.ts
git commit -m "feat: add DesignSerializer skeleton with base props handling"
```

---

### Task 4: Rect + Circle 序列化/解析

**Files:**
- Modify: `renderer/serializer/DesignSerializer.ts` (实现 rect/circle 方法)

**Step 1: 编写测试**

在 `test/unit/serializer/DesignSerializer.test.ts` 添加：
```typescript
import { createRectNode } from '../../../renderer/scene/nodes/RectNode';
import { createCircleNode } from '../../../renderer/scene/nodes/CircleNode';
import type { DesignRect, DesignCircle } from '../../../renderer/types/DesignTypes';

describe('Rect round-trip', () => {
  it('矩形 serialize → parse 往返一致', () => {
    const original = createRectNode('r1', 10, 20, 200, 100, {
      rx: 8, ry: 8, fill: '#3498db', stroke: '#2980b9',
      strokeWidth: 2, opacity: 0.9, rotation: 0.5, scaleX: 1.5, scaleY: 1,
    });
    const json = (serializer as any).serializeRect(original) as DesignRect;
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
  it('圆形 serialize → parse 往返一致', () => {
    const original = createCircleNode('c1', 50, 50, 40, {
      fill: '#e74c3c', stroke: '#c0392b', strokeWidth: 2,
    });
    const json = (serializer as any).serializeCircle(original) as DesignCircle;
    expect(json.type).toBe('circle');

    const restored = (serializer as any).parseCircle(json);
    expect(restored.id).toBe('c1');
    expect(restored.radius).toBe(40);
    expect(restored.width).toBe(80);
    expect(restored.height).toBe(80);
  });
});
```

**Step 2: 实现 rect/circle parse 方法**

替换 `DesignSerializer.ts` 中的桩方法：

```typescript
import { createRectNode } from '../scene/nodes/RectNode';
import { createCircleNode } from '../scene/nodes/CircleNode';
import { createTextNode } from '../scene/nodes/TextNode';
import { createImageNode } from '../scene/nodes/ImageNode';
import { createGroupNode } from '../scene/nodes/GroupNode';
```

parseRect:
```typescript
private parseRect(node: DesignRect): RectNode {
  const base = this.applyBaseProps(node);
  return createRectNode(base.id, base.x, base.y, base.width, base.height, {
    ...base, rx: node.rx, ry: node.ry,
  });
}
```

parseCircle:
```typescript
private parseCircle(node: DesignCircle): CircleNode {
  const base = this.applyBaseProps(node);
  const radius = base.width / 2;
  return createCircleNode(base.id, base.x, base.y, radius, {
    fill: base.fill, stroke: base.stroke, strokeWidth: base.strokeWidth,
    opacity: base.opacity, visible: base.visible,
    rotation: base.rotation, scaleX: base.scaleX, scaleY: base.scaleY,
  });
}
```

**Step 3: 验证**

```bash
npx vitest run
```

Expected: 6 tests passed

**Step 4: 提交**

```bash
git add renderer/serializer/DesignSerializer.ts test/unit/serializer/DesignSerializer.test.ts
git commit -m "feat: implement rect and circle serialization"
```

---

### Task 5: Text + Image 序列化/解析

**Files:**
- Modify: `renderer/serializer/DesignSerializer.ts`

**Step 1: 编写测试**

```typescript
import { createTextNode } from '../../../renderer/scene/nodes/TextNode';
import { createImageNode } from '../../../renderer/scene/nodes/ImageNode';

describe('Text round-trip', () => {
  it('文本 serialize → parse 往返一致', () => {
    const original = createTextNode('t1', 10, 10, 'Hello', 200, 40, {
      fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold',
      fontStyle: 'italic', textAlign: 'center',
    });
    const json = (serializer as any).serializeText(original);
    expect(json.text).toBe('Hello');
    expect(json.fontSize).toBe(24);
    expect(json.fontFamily).toBe('Arial');
    expect(json.fontStyle).toBe('italic');

    const restored = (serializer as any).parseText(json);
    expect(restored.type).toBe('text');
    expect(restored.text).toBe('Hello');
    expect(restored.fontSize).toBe(24);
    expect(restored.fontWeight).toBe('bold');
    expect(restored.textAlign).toBe('center');
  });

  it('textbox 类型序列化为 text', () => {
    const original = createTextNode('tb1', 0, 0, 'textbox', 200, 50);
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
```

**Step 2: 实现 text/image parse 方法**

```typescript
private parseText(node: DesignText): TextNode {
  const base = this.applyBaseProps(node);
  return createTextNode(base.id, base.x, base.y, node.text, base.width, base.height, {
    ...base,
    fontSize: node.fontSize ?? 16,
    fontFamily: node.fontFamily ?? 'sans-serif',
    fontWeight: node.fontWeight ?? 'normal',
    fontStyle: node.fontStyle ?? 'normal',
    textAlign: node.textAlign ?? 'left',
  });
}

private parseImage(node: DesignImage): ImageNode {
  const base = this.applyBaseProps(node);
  return createImageNode(base.id, base.x, base.y, base.width, base.height, node.src, {
    ...base,
    fillMode: node.fillMode,
    clip: node.clip,
  });
}
```

**Step 3: 验证**

```bash
npx vitest run
```

Expected: 9 tests passed

**Step 4: 提交**

```bash
git add renderer/serializer/DesignSerializer.ts test/unit/serializer/DesignSerializer.test.ts
git commit -m "feat: implement text and image serialization"
```

---

### Task 6: Group 序列化/解析

**Files:**
- Modify: `renderer/serializer/DesignSerializer.ts`

**Step 1: 编写测试**

```typescript
import { createGroupNode } from '../../../renderer/scene/nodes/GroupNode';

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
    expect((restored.children[0] as GroupNode).children.length).toBe(2);
    expect((restored.children[0] as GroupNode).children[0].type).toBe('rect');
    expect(((restored.children[0] as GroupNode).children[0] as RectNode).fill).toBe('#ff0000');
  });

  it('serializeNode 分发到 group 方法', () => {
    const group = createGroupNode('g1', 0, 0, 100, 100, []);
    const json = (serializer as any).serializeNode(group);
    expect(json.type).toBe('group');
  });
});
```

**Step 2: 实现 group parse 方法**

```typescript
private parseGroup(node: DesignGroup): GroupNode {
  const base = this.applyBaseProps(node);
  const children = (node.children || [])
    .map(child => this.parseNode(child))
    .filter(Boolean) as SceneNode[];
  return createGroupNode(base.id, base.x, base.y, base.width, base.height, children, {
    opacity: base.opacity, visible: base.visible,
    rotation: base.rotation, scaleX: base.scaleX, scaleY: base.scaleY,
  });
}
```

**Step 3: 验证**

```bash
npx vitest run
```

Expected: 12 tests passed

**Step 4: 提交**

```bash
git add renderer/serializer/DesignSerializer.ts test/unit/serializer/DesignSerializer.test.ts
git commit -m "feat: implement group serialization with recursive children"
```

---

### Task 7: CanvasEngine 更新 + 导出集成

**Files:**
- Modify: `renderer/engine/CanvasEngine.ts` (新增 getSceneGraph / renderGraph)
- Modify: `renderer/index.ts` (导出 DesignSerializer 和 DesignTypes)

**Step 1: 检查 CanvasEngine 是否已有 currentGraph**

查看 `renderer/engine/CanvasEngine.ts` 确认 Engine 已经持有 `currentGraph`（如果已有 getSceneGraph，跳过此步）。
查看确认已有的属性和方法。

**Step 2: 如果未实现，添加 getSceneGraph() 和 renderGraph()**

`renderer/engine/CanvasEngine.ts`:
```typescript
// 如果还没有 getSceneGraph
getSceneGraph(): SceneGraph | null {
  return this.currentGraph;
}

// 如果还没有 renderGraph
async renderGraph(graph: SceneGraph): Promise<void> {
  this.currentGraph = graph;
  const loadResult = await this.preloader.preload(graph);
  this.renderer.render(graph, this.adapter);
}
```

**Step 3: 更新 renderer/index.ts 导出**

```typescript
// serializer
export { DesignSerializer } from './serializer/DesignSerializer';

// types 中已有 DesignTypes 导出
```

**Step 4: 验证编译**

```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 5: 提交**

```bash
git add renderer/engine/CanvasEngine.ts renderer/index.ts
git commit -m "feat: add getSceneGraph/renderGraph to CanvasEngine, export DesignSerializer"
```

---

### Task 8: 完整集成测试 + 边界情况

**Files:**
- Modify: `test/unit/serializer/DesignSerializer.test.ts`

**Step 1: 编写完整场景测试**

```typescript
import { SceneGraph } from '../../../renderer/scene/SceneGraph';

describe('Serialization integration', () => {
  it('完整场景 serialize → parse 往返一致', () => {
    const rect = createRectNode('r1', 10, 20, 200, 100, { fill: '#3498db', rx: 8 });
    const circle = createCircleNode('c1', 300, 50, 40, { fill: '#e74c3c' });
    const text = createTextNode('t1', 10, 200, 'Hello', 200, 30, { fontSize: 24 });
    const groupChild = createRectNode('rc1', 0, 0, 50, 50, { fill: '#2ecc71' });
    const group = createGroupNode('g1', 100, 300, 200, 100, [groupChild]);

    const graph = new SceneGraph([rect, circle, text, group]);
    const json = serializer.serialize(graph, 800, 600);

    expect(json.version).toBe('1.0');
    expect(json.width).toBe(800);
    expect(json.height).toBe(600);
    expect(json.nodes.length).toBe(4);

    const result = serializer.parse(json);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);

    const restoredGraph = result.graph;
    const nodes = restoredGraph.getNodes();
    expect(nodes.length).toBe(4);

    const restoredRect = nodes.find(n => n.id === 'r1')!;
    expect(restoredRect).toBeDefined();
    expect(restoredRect.type).toBe('rect');
    expect((restoredRect as RectNode).rx).toBe(8);

    const restoredCircle = nodes.find(n => n.id === 'c1')!;
    expect(restoredCircle).toBeDefined();
    expect((restoredCircle as CircleNode).radius).toBe(40);

    const restoredGroup = nodes.find(n => n.id === 'g1') as GroupNode;
    expect(restoredGroup.children.length).toBe(1);
    expect(restoredGroup.children[0].id).toBe('rc1');
  });

  it('空场景 nodes: []', () => {
    const graph = new SceneGraph([]);
    const json = serializer.serialize(graph, 0, 0);
    expect(json.nodes).toEqual([]);

    const result = serializer.parse(json);
    expect(result.graph.getNodes()).toEqual([]);
  });

  it('缺失属性使用默认值', () => {
    const incompleteJSON = {
      version: '1.0',
      width: 100,
      height: 100,
      nodes: [
        { id: 'r1', type: 'rect', x: 0, y: 0, width: 50, height: 50 },
      ],
    };
    const result = serializer.parse(incompleteJSON);
    const node = result.graph.getNodes()[0];
    expect(node.rotation).toBe(0);
    expect(node.scaleX).toBe(1);
    expect(node.scaleY).toBe(1);
    expect(node.opacity).toBe(1);
    expect(node.visible).toBe(true);
  });

  it('未知属性被忽略', () => {
    const jsonWithExtra = {
      version: '1.0',
      width: 100,
      height: 100,
      nodes: [
        { id: 'r1', type: 'rect', x: 10, y: 20, width: 100, height: 50,
          unknownField: 'shouldBeIgnored' },
      ],
    };
    const result = serializer.parse(jsonWithExtra);
    expect(result.graph.getNodes().length).toBe(1);
  });

  it('未知 type 跳过', () => {
    const jsonWithUnknown = {
      version: '1.0',
      width: 100,
      height: 100,
      nodes: [
        { id: 'r1', type: 'rect', x: 0, y: 0, width: 50, height: 50 },
        { id: 'x1', type: 'unknown', x: 0, y: 0, width: 10, height: 10 },
      ],
    };
    const result = serializer.parse(jsonWithUnknown);
    expect(result.graph.getNodes().length).toBe(1);
    expect(result.graph.getNodes()[0].id).toBe('r1');
  });
});
```

**Step 2: 验证测试**

```bash
npx vitest run
```

Expected: 17+ tests all passed

**Step 3: 提交**

```bash
git add test/unit/serializer/DesignSerializer.test.ts
git commit -m "test: add integration tests for full serialization round-trip"
```

---

### 可选：Task 9 — 使用示例文档更新

**Files:**
- Modify: `README.md`

可以添加 DesignSerializer 的使用示例到 README.md 的 API 部分。

```markdown
### DesignSerializer

```typescript
import { DesignSerializer } from 'zkh-canvas-renderer';

const serializer = new DesignSerializer();

// 保存：SceneGraph → JSON
const graph = engine.getSceneGraph()!;
const json = serializer.serialize(graph, 800, 600);
const str = JSON.stringify(json, null, 2);

// 加载：JSON → SceneGraph
const { graph: restored, width, height } = serializer.parse(JSON.parse(str));
engine.getAdapter().resize(width, height);
await engine.renderGraph(restored);
```
```
