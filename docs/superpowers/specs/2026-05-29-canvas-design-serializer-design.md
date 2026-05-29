# Canvas 引擎通用设计稿序列化设计文档

## 概述

为跨端 Canvas 渲染引擎增加**通用设计稿格式**的解析与导出功能（SceneGraph ↔ JSON 双向转换）。这是组件原生存储格式，用于设计稿保存和跨平台还原。

**核心设计原则：**

- 嵌套结构直接映射 SceneGraph 内存模型，避免 ID 引用解析
- 只保存 SceneNode 公共属性，特定业务属性（如 text-field 的 fieldType）由 CardParser 等专用 Parser 处理
- 宽容解析（未知属性忽略，缺失属性默认值填充），保证格式向前兼容
- 纯数据转换，独立于 CanvasEngine，与现有 Parser 模式一致

---

## 与现有 Parser 的关系

| 方向 | FabricParser | CardParser | DesignSerializer |
|------|-------------|-----------|-----------------|
| 输入格式 | Fabric.js 5.x JSON | 名片模板 JSON | 通用设计稿 JSON |
| 输入 → SceneGraph | ✓ | ✓ | ✓ |
| SceneGraph → 输出 | — | — | ✓（唯一支持导出的） |

DesignSerializer 是唯一的**双向转换器**，负责引擎原生格式的进出。

---

## 数据流

```
保存: SceneGraph → DesignSerializer.serialize() → DesignJSON → JSON.stringify → 存储
加载: 存储 → JSON.parse → DesignJSON → DesignSerializer.parse() → SceneGraph
```

---

## DesignJSON 格式定义

### 顶层结构

```typescript
interface DesignJSON {
  version: string;          // 格式版本号，如 "1.0"
  width: number;            // Canvas 显示宽度
  height: number;           // Canvas 显示高度
  nodes: DesignNode[];      // 根节点列表（嵌套结构）
}
```

### 节点联合类型

```typescript
type DesignNode =
  | DesignRect
  | DesignCircle
  | DesignText
  | DesignImage
  | DesignGroup;
```

### 公共属性

```typescript
interface DesignNodeBase {
  id: string;
  type: 'rect' | 'circle' | 'text' | 'image' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;    // 弧度
  scaleX: number;
  scaleY: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
}
```

### 各节点特有属性

```typescript
interface DesignRect extends DesignNodeBase {
  type: 'rect';
  rx?: number;
  ry?: number;
}

interface DesignCircle extends DesignNodeBase {
  type: 'circle';
  // radius 由 width/2 推算，不需单独存储
}

interface DesignText extends DesignNodeBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: 'normal' | 'italic' | 'oblique';
  textAlign: 'left' | 'center' | 'right';
}

interface DesignImage extends DesignNodeBase {
  type: 'image';
  src: string;
  fillMode?: 'fill' | 'cover' | 'contain';
  clip?: { type: 'circle'; radius: number } | { type: 'rect'; rx?: number; ry?: number };
}

interface DesignGroup extends DesignNodeBase {
  type: 'group';
  children: DesignNode[];  // 嵌套子节点
}
```

> **运行时字段不序列化：** `imageHandle`、`imageWidth`、`imageHeight` 是运行时缓存，加载时由 ImagePreloader 重新计算。
>
> **textbox 类型：** SceneNode 中 'textbox' 与 'text' 共用 TextRenderer，序列化时统一存为 `type: 'text'`。

---

## 版本兼容策略

### 宽容解析规则

- **未知属性** → 忽略，不影响解析
- **缺失必选属性** → 使用默认值填充（如 rotation 默认 0，scaleX 默认 1）
- **缺失 type** → 跳过该节点
- **缺失 id** → 自动生成 UUID
- **未知 type 值** → 跳过该节点

### 版本号约定

- 格式版本号放在 JSON 顶层 `version` 字段
- 子版本递增（如添加新属性时 `"1.0"` → `"1.1"`），保持宽容解析
- 主版本递增时（如删除/重命名字段）需要迁移逻辑，但保留宽容兼容的底线

---

## DesignSerializer

### 接口定义

```typescript
class DesignSerializer {
  /**
   * SceneGraph → DesignJSON（导出/保存）
   */
  serialize(graph: SceneGraph, canvasWidth: number, canvasHeight: number): DesignJSON;

  /**
   * DesignJSON → SceneGraph（导入/加载）
   * 宽容解析：未知属性忽略，缺失属性用默认值填充
   */
  parse(json: DesignJSON): { graph: SceneGraph; width: number; height: number };

  // ========== 内部方法 ==========

  /** 分发到各类型序列化方法 */
  private serializeNode(node: SceneNode): DesignNode;

  /** 分发到各类型解析方法 */
  private parseNode(node: DesignNode): SceneNode;

  /** 提取公共属性（序列化） */
  private extractBaseProps(node: SceneNode): DesignNodeBase;

  /** 应用公共属性（解析，含默认值回填） */
  private applyBaseProps(node: DesignNode): Omit<SceneNode, 'type'>;

  /** 序列化各类型 */
  private serializeRect(node: RectNode): DesignRect;
  private serializeCircle(node: CircleNode): DesignCircle;
  private serializeText(node: TextNode): DesignText;
  private serializeImage(node: ImageNode): DesignImage;
  private serializeGroup(node: GroupNode): DesignGroup;

  /** 解析各类型 */
  private parseRect(node: DesignRect): RectNode;
  private parseCircle(node: DesignCircle): CircleNode;
  private parseText(node: DesignText): TextNode;
  private parseImage(node: DesignImage): ImageNode;
  private parseGroup(node: DesignGroup): GroupNode;
}
```

### 序列化/解析分发

```typescript
// serialize 分发
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

// parse 分发
private parseNode(node: DesignNode): SceneNode {
  switch (node.type) {
    case 'rect':   return this.parseRect(node as DesignRect);
    case 'circle': return this.parseCircle(node as DesignCircle);
    case 'text':   return this.parseText(node as DesignText);
    case 'image':  return this.parseImage(node as DesignImage);
    case 'group':  return this.parseGroup(node as DesignGroup);
  }
}
```

### 公共属性提取（serialize）

公共属性直接从 SceneNode 读取，不需要转换：

```typescript
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
```

### 公共属性应用（parse，含默认值回填）

```typescript
private applyBaseProps(base: DesignNodeBase): Omit<SceneNode, 'type'> {
  return {
    id: base.id,
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
```

> **`?? 0` vs `?? 1` 的选取原则：** 加性属性（位置、尺寸、间距）默认为 0，乘性属性（缩放、透明度）默认为 1，布尔属性默认为 true。

---

## 使用示例

```typescript
import { DesignSerializer } from './serializer';

const serializer = new DesignSerializer();

// ===== 保存 =====
const graph = engine.getSceneGraph();
const designJSON = serializer.serialize(graph, canvasWidth, canvasHeight);
const jsonString = JSON.stringify(designJSON, null, 2);
// 存储到数据库/文件

// ===== 加载 =====
const json = JSON.parse(jsonString);
const { graph, width, height } = serializer.parse(json);
engine.getAdapter().resize(width, height);
await engine.renderGraph(graph);
```

---

## 目录结构

```
renderer/
├── serializer/                     ← 新增
│   ├── DesignSerializer.ts         # 双向转换逻辑
│   └── index.ts                    # 导出
├── types/
│   ├── DesignTypes.ts              ← 新增：DesignJSON 类型定义
│   └── ...
├── engine/
│   ├── CanvasEngine.ts             # 更新：新增 getSceneGraph() / renderGraph()
│   └── ...
└── ...
```

### CanvasEngine 需要的变更

Engine 需要持有一个 SceneGraph 引用，供序列化和后续事件系统使用：

```typescript
class CanvasEngine {
  private currentGraph: SceneGraph | null = null;

  /**
   * 获取当前场景图
   */
  getSceneGraph(): SceneGraph | null {
    return this.currentGraph;
  }

  /**
   * 直接渲染已构建的 SceneGraph
   * 适用于 DesignSerializer.parse() 恢复的场景
   */
  async renderGraph(graph: SceneGraph): Promise<void> {
    this.currentGraph = graph;
    const loadResult = await this.preloader.preload(graph);
    this.renderer.render(graph, this.adapter);
  }

  // render() / renderCard() 内部更新：
  // this.currentGraph = graph;
}
```

---

## 测试策略

纯数据转换，Node 环境直接测试：

- 矩形节点 serialize/parse 往返（含圆角）
- 圆形节点往返
- 文本节点往返（含 textbox → text 类型映射）
- 图片节点往返（含 fillMode、clip）
- 嵌套 Group 节点往返（多层嵌套）
- 空场景（nodes = []）
- 缺失属性默认值回填
- 未知属性被忽略
- 完整名片场景往返（覆盖所有节点类型）

---

## 创建日期

2026-05-29
