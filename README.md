# zkh-canvas-renderer

基于 uni-app 的跨端 Canvas 渲染引擎，解析 Fabric.js 5.x 导出的 JSON 并在各平台绘制。

## 特性

- **Fabric.js 5.x 兼容** — 解析标准 Fabric.js JSON 结构，支持 rect/circle/text/textbox/image/group
- **跨端渲染** — 通过 Adapter 模式抽象平台差异，支持 H5/浏览器和微信小程序
- **交互系统** — 命中检测、选中、拖拽、缩放、旋转，支持控制器链式路由
- **序列化导入导出** — `DesignSerializer` 双向转换 SceneGraph ↔ JSON，支持编辑后保存和恢复
- **高清适配** — 自动检测 DPR 并应用到 Canvas，确保渲染清晰
- **图片预加载** — 渲染前统一加载图片资源，保证绘制完整
- **名片模板** — 支持简化的卡片模板 JSON 格式，快速渲染名片/海报
- **强类型** — 完整 TypeScript 类型定义

## 架构

```
                    ┌─────────────────────────┐
                    │     Fabric.js JSON      │
                    │    Card Template JSON   │
                    │    Design JSON (导入)    │
                    └─────┬─────────┬─────────┘
                          │         │
              ┌───────────┘    ┌────┴──────────────┐
              ▼                ▼                   │
     ┌──────────────┐  ┌──────────────┐            │
     │ FabricParser │  │  CardParser  │            │
     └──────┬───────┘  └──────┬───────┘            │
            │                 │                    │
            └────────┬────────┘                    │
                     ▼                             │
            ┌────────────────┐                     │
            │   SceneGraph   │◄──── DesignSerializer│
            │   (节点树)      │     parse()         │
            └───┬────┬───────┘                     │
                │    │                             │
                ▼    └─────────────────────────────┘
            ┌────────────────┐      保存
            │   Renderer    │  DesignSerializer
            │  (绘制逻辑)    │  serialize() → JSON
            └───────┬───────┘
                    ▼
            ┌────────────────┐
            │ CanvasAdapter  │ ← 平台抽象层
            └───────┬───────┘
                    ▼
         ┌──────────────────────┐
         │  H5 / 微信小程序     │
         │  Canvas API          │
         └──────────────────────┘

         交互子系统（运行时）:
         EventManager → 控制器链(Rotate→Resize→Drag→Selection)
                             ↓
                    HitTestService · SelectionOverlayRenderer
```

### 目录结构

```
renderer/
├── parser/              # JSON 解析器
│   ├── FabricParser.ts  # Fabric.js JSON → SceneGraph
│   ├── CardParser.ts    # 名片模板 JSON → SceneGraph
│   └── TransformConverter.ts  # center→top-left 坐标转换
├── scene/               # 场景图
│   ├── nodes/           # 节点类型 (Rect, Circle, Text, Image, Group)
│   │   ├── RectNode.ts
│   │   ├── CircleNode.ts
│   │   ├── TextNode.ts
│   │   ├── ImageNode.ts
│   │   └── GroupNode.ts
│   ├── SceneNode.ts     # 基础节点接口
│   └── SceneGraph.ts    # 场景图管理器
├── renderer/            # 渲染器
│   ├── renderers/       # 各类型绘制逻辑
│   └── SceneRenderer.ts # 渲染入口
├── adapters/            # 平台适配器
│   ├── CanvasAdapter.ts # 接口定义
│   ├── H5Adapter.ts     # H5/浏览器
│   └── WechatAdapter.ts # 微信小程序
├── interaction/         # 交互系统
│   ├── HitTestService.ts          # 几何命中检测
│   ├── EventManager.ts            # 事件分发（控制器链）
│   ├── SelectionOverlayRenderer.ts # 选中框/控制柄绘制
│   └── controllers/
│       ├── SelectionController.ts  # 点选/多选/状态管理
│       ├── DragController.ts       # 拖拽移动
│       ├── ResizeController.ts     # 8 方向缩放
│       └── RotateController.ts     # 旋转
├── serializer/          # 序列化（双向）
│   ├── DesignSerializer.ts # SceneGraph ↔ DesignJSON
│   └── index.ts
├── engine/              # 引擎入口
├── types/               # 类型定义
└── utils/               # 工具函数
```

## 安装

```bash
npm install zkh-canvas-renderer
```

## 快速开始

### H5/浏览器 — 基础渲染

```typescript
import { CanvasEngine, H5Adapter } from 'zkh-canvas-renderer';

const adapter = H5Adapter.fromId('myCanvas');
const engine = new CanvasEngine(adapter);
await engine.initialize();

const result = await engine.render({
  version: '5.0.0',
  width: 800,
  height: 600,
  objects: [
    { type: 'rect', left: 100, top: 100, width: 200, height: 150, fill: '#ff5722', rx: 10 },
    { type: 'circle', left: 400, top: 300, radius: 80, fill: '#4caf50' },
    { type: 'text', left: 50, top: 50, text: 'Hello Canvas', fontSize: 32, fill: '#333' },
  ],
});
```

### H5/浏览器 — 启用交互

```typescript
await engine.render(fabricJSON);
engine.enableInteraction(); // 选中、拖拽、缩放、旋转

// 监听选中变化
const selCtrl = engine.getSelectionController();
selCtrl?.onChange((ids) => console.log('选中:', ids));

// 禁用
engine.disableInteraction();
```

### H5/浏览器 — 导入导出

```typescript
import { DesignSerializer } from 'zkh-canvas-renderer';

const serializer = new DesignSerializer();

// 导出：SceneGraph → JSON
const graph = engine.getSceneGraph();
const json = serializer.serialize(graph, 800, 600);
const str = JSON.stringify(json, null, 2); // 保存到文件/数据库

// 导入：JSON → SceneGraph
const { graph: restored, width, height } = serializer.parse(JSON.parse(str));
adapter.resize(width, height);
await engine.renderGraph(restored);
engine.enableInteraction();
```

### 微信小程序

```vue
<template>
  <view class="canvas-container">
    <canvas type="2d" id="fabricCanvas" canvas-id="fabricCanvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { CanvasEngine, WechatAdapter } from 'zkh-canvas-renderer';

const canvasWidth = ref(375);
const canvasHeight = ref(600);

onMounted(async () => {
  const adapter = new WechatAdapter('fabricCanvas');
  const engine = new CanvasEngine(adapter);
  await engine.initialize();
  await engine.render({
    version: '5.0.0',
    objects: [{ type: 'rect', left: 100, top: 100, width: 200, height: 150, fill: '#ff5722' }],
  });
});
</script>
```

## 组件详解

### CanvasEngine

引擎核心，串联 Parser → Renderer → Adapter 的完整渲染流程。

```typescript
const engine = new CanvasEngine(adapter, { debug: true });
```

| 方法 | 说明 |
|------|------|
| `initialize()` | 初始化引擎，准备 Canvas |
| `render(json)` | 渲染 Fabric.js JSON → SceneGraph，自动设置画布尺寸 |
| `renderCard(json)` | 渲染名片模板 JSON |
| `renderGraph(graph)` | 直接渲染已构建的 SceneGraph（配合 DesignSerializer.parse 使用） |
| `enableInteraction()` | 启用交互系统（需先调用 render） |
| `disableInteraction()` | 禁用交互系统 |
| `resize(width, height)` | 调整 Canvas 尺寸 |
| `getSceneGraph()` | 获取当前场景图（用于序列化导出） |
| `getEventManager()` | 获取事件管理器 |
| `getSelectionController()` | 获取选中控制器 |
| `getAdapter()` | 获取适配器实例 |
| `getRenderer()` | 获取渲染器 |
| `destroy()` | 销毁引擎，释放资源 |

---

### SceneGraph

场景图管理器，维护节点列表和 ID 映射。

```typescript
import { SceneGraph } from 'zkh-canvas-renderer';

const graph = new SceneGraph([node1, node2]);
```

| 方法 | 说明 |
|------|------|
| `getNodes()` | 获取所有节点（渲染顺序） |
| `getNodeById(id)` | 根据 ID 查找节点 |
| `addNode(node)` | 添加节点（支持递归索引 Group 子节点） |
| `removeNode(id)` | 移除节点 |
| `findNodePath(id)` | 查找节点祖先链（从外层 Group 到自身），用于选中框变换计算 |
| `getNodeCount()` | 获取节点数量 |
| `clear()` | 清空所有节点 |

---

### SceneNode 类型

所有节点基于统一接口 `SceneNode`，使用**左上角坐标系**：

```typescript
interface SceneNode {
  id: string;           // 唯一标识
  type: NodeType;       // rect | circle | text | textbox | image | group
  x: number; y: number; // 左上角坐标
  width: number; height: number;
  rotation: number;     // 弧度
  scaleX: number; scaleY: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;      // 0-1
  visible: boolean;
}
```

#### 程序化创建

```typescript
import { createRectNode, createCircleNode, createTextNode, createImageNode, createGroupNode } from 'zkh-canvas-renderer';

// 矩形
const rect = createRectNode('rect-1', 10, 10, 200, 150, {
  rx: 8, ry: 8, fill: '#3498db', stroke: '#2980b9', strokeWidth: 2,
  opacity: 0.9, rotation: 0.5, scaleX: 1.5, scaleY: 1,
});

// 圆形（radius 自动推导 width=height=2*radius）
const circle = createCircleNode('circle-1', 100, 100, 50, {
  fill: '#e74c3c', stroke: '#c0392b',
});

// 文本
const text = createTextNode('text-1', 10, 200, 'Hello', 300, 40, {
  fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold',
  fontStyle: 'italic', textAlign: 'center',
});

// 图片
const image = createImageNode('img-1', 0, 0, 200, 200, 'https://example.com/photo.jpg', {
  fillMode: 'cover',
  clip: { type: 'circle', radius: 50 },
});

// 组（子节点坐标相对于 Group）
const childRect = createRectNode('child-1', 10, 10, 100, 80);
const group = createGroupNode('group-1', 0, 0, 300, 200, [childRect]);
```

#### 节点类型对照

| 类型 | 接口 | 工厂函数 | 特有属性 |
|------|------|----------|----------|
| `rect` | `RectNode` | `createRectNode()` | `rx`, `ry`(圆角) |
| `circle` | `CircleNode` | `createCircleNode()` | `radius` |
| `text` | `TextNode` | `createTextNode()` | `text`, `fontSize`, `fontFamily`, `fontWeight`, `fontStyle`, `textAlign` |
| `textbox` | `TextNode` | `createTextNode()` | 同 text，序列化时自动映射为 text |
| `image` | `ImageNode` | `createImageNode()` | `src`, `fillMode`, `clip` |
| `group` | `GroupNode` | `createGroupNode()` | `children: SceneNode[]` |

---

### 解析器

| 解析器 | 输入 | 输出 | 说明 |
|--------|------|------|------|
| `FabricParser` | Fabric.js 5.x JSON | SceneGraph | 标准 Fabric.js 格式，自动处理 center→top-left 坐标转换 |
| `CardParser` | 名片模板 JSON | SceneGraph | 简化的卡片格式，含 avatar/text-field 等业务类型 |
| `DesignSerializer` | DesignJSON | SceneGraph | 引擎原生格式，双向转换（唯一支持导出的） |

```typescript
import { FabricParser } from 'zkh-canvas-renderer';

const parser = new FabricParser();
const graph = parser.parse(fabricJSON);
```

---

### DesignSerializer — 序列化导入导出

引擎原生的**双向**序列化器，SceneGraph ↔ JSON 互转。

```typescript
import { DesignSerializer } from 'zkh-canvas-renderer';

const serializer = new DesignSerializer();
```

#### 导出

```typescript
const graph = engine.getSceneGraph()!;
const json = serializer.serialize(graph, 800, 600);
// → { version: '1.0', width: 800, height: 600, nodes: [...] }
localStorage.setItem('design', JSON.stringify(json));
```

#### 导入

```typescript
const raw = localStorage.getItem('design')!;
const json = JSON.parse(raw);
const { graph, width, height } = serializer.parse(json);
engine.getAdapter().resize(width, height);
await engine.renderGraph(graph);
engine.enableInteraction(); // 恢复交互
```

#### DesignJSON 格式

```typescript
interface DesignJSON {
  version: string;           // "1.0"
  width: number;
  height: number;
  nodes: DesignNode[];       // 嵌套结构（Group 递归 children）
}
```

**宽容解析规则：**
- 缺失属性 → 默认值填充（rotation=0, scaleX=1, opacity=1, visible=true）
- 未知属性 → 忽略，不影响解析
- 未知 type → 跳过该节点
- 缺失 id → 空字符串（建议业务层确保 id 唯一）

---

### 交互系统

交互系统基于**控制器链**模式，事件按优先级依次路由，高优先级控制器优先消费事件。

```
PointerDown → RotateController (旋转控制柄命中?)
                ↓ 未消费
            ResizeController (缩放控制柄命中?)
                ↓ 未消费
            DragController (点击选中节点?)
                ↓ 未消费
            SelectionController (点击空白取消/点选/Shift多选)
```

#### EventManager

事件分发核心，绑定适配器原生事件 → 路由到控制器链。

```typescript
// 通常在 CanvasEngine.enableInteraction() 内部使用
const eventManager = engine.getEventManager();
```

内部监听 `pointerdown` / `pointermove` / `pointerup`：
- `pointerdown` — 从最高优先级控制器开始依次尝试消费
- `pointermove` — 先发送给当前 active 控制器，未消费再走优先级链
- `pointerup` — 发送给当前 active 控制器

#### SelectionController

选中状态管理。

```typescript
const selCtrl = engine.getSelectionController()!;

// 监听选中变化
selCtrl.onChange((selectedIds: string[]) => {
  console.log('选中:', selectedIds);
});

// 手动操作
selCtrl.select(nodeId);          // 单选（清除之前）
selCtrl.toggleSelect(nodeId);    // Shift 切换
selCtrl.clearSelection();        // 取消选中
selCtrl.getSelectedNodes();      // 获取选中节点列表
selCtrl.isSelected(nodeId);      // 判断是否选中
```

| 交互 | 行为 |
|------|------|
| 单击节点 | 选中该节点，清除之前选中 |
| Shift + 单击节点 | 切换选中/取消该节点（多选） |
| 单击空白区域 | 取消全部选中 |
| 选中其他节点 | 单选模式下自动切换选中 |

#### DragController

拖拽移动选中节点。

- 单击选中节点 → 记录 pendingDrag
- 鼠标移动 > 3px 阈值 → 激活拖拽
- 拖拽时选中的多个节点同步移动
- Group 子元素随父 Group 移动

#### ResizeController

8 方向控制柄缩放。

```
   tl ──── tm ──── tr
    │               │
   ml      ·       mr
    │               │
   bl ──── bm ──── br
```

| 控制柄 | 行为 |
|--------|------|
| tl/tr/bl/br | 四角等比缩放 |
| tm/bm | 垂直缩放 |
| ml/mr | 水平缩放 |

#### RotateController

旋转手柄（节点顶部中心正上方）。

- 拖拽旋转手柄 → 实时更新节点 rotation（弧度）
- 旋转中心为节点原点

#### HitTestService

纯几何命中检测，不依赖 Canvas API。

```typescript
import { HitTestService } from 'zkh-canvas-renderer';

const hitTest = new HitTestService();
const node = hitTest.hitTest(graph, pointerX, pointerY);

// 带排除列表
const node = hitTest.hitTestWithExclude(graph, x, y, ['exclude-id']);
```

检测流程：画布坐标 → 逆变换到节点局部坐标 → 形状判定。
支持：矩形（含圆角）、圆形、文本、图片、Group（递归子节点）。

#### SelectionOverlayRenderer

在场景渲染完成后绘制交互层。

- 选中框：蓝色实线轮廓
- 控制柄：8 个白色方块（蓝色边框），单选时显示
- 旋转手柄：蓝色方块 + 连接线，单选时显示
- Group 内子节点的选中框：累加所有祖先变换后绘制

---

### 适配器

#### CanvasAdapter 接口

```typescript
interface CanvasAdapter {
  initialize(): Promise<void>;
  destroy(): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(rad: number): void;
  scale(x: number, y: number): void;
  setFillStyle(color: string): void;
  setStrokeStyle(color: string): void;
  setLineWidth(width: number): void;
  setFont(options: FontOptions): void;
  setGlobalAlpha(alpha: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  fill(): void;
  stroke(): void;
  clip(): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): TextMetrics;
  drawImage(image: ImageHandle, ...args: number[]): void;
  getDPR(): number;
  clear(): void;
}
```

#### 内置适配器

| 适配器 | 创建方式 | 说明 |
|--------|----------|------|
| `H5Adapter` | `new H5Adapter(canvasEl)` 或 `H5Adapter.fromId('canvasId')` | 浏览器标准 Canvas 2D API |
| `WechatAdapter` | `new WechatAdapter('canvasId')` | 微信小程序 2D Canvas |

---

### 工具函数

```typescript
import { degToRad, radToDeg, clamp, normalizeColor, isValidColor, logger } from 'zkh-canvas-renderer';

degToRad(180);         // → Math.PI
radToDeg(Math.PI);     // → 180
clamp(150, 0, 100);    // → 100
normalizeColor('#fff'); // → '#ffffff'
isValidColor('#abc');   // → true
logger.setLevel('debug');
```

---

### 类型定义

```typescript
import type {
  FabricExportJSON, FabricObject, FabricRect, FabricCircle,
  FabricText, FabricImage, FabricGroup,
} from 'zkh-canvas-renderer';

import type {
  CardTemplateJSON, CardSize, CardBackground, CardElement,
  AvatarElement, TextFieldElement, ImageElement, RectElement,
} from 'zkh-canvas-renderer';

import type {
  DesignJSON, DesignNode, DesignRect, DesignCircle,
  DesignText, DesignImage, DesignGroup,
} from 'zkh-canvas-renderer';

import type {
  RenderResult, ImageLoadError,
} from 'zkh-canvas-renderer';
```

## 扩展新平台

实现 `CanvasAdapter` 接口即可支持新平台（如 uni-app nvue、WebGL 等）：

```typescript
import type { CanvasAdapter, ImageHandle, FontOptions } from 'zkh-canvas-renderer';

class CustomAdapter implements CanvasAdapter {
  async initialize() { /* 获取 Canvas 实例、Context、检测 DPR */ }
  save() { /* ctx.save() */ }
  restore() { /* ctx.restore() */ }
  translate(x, y) { /* ctx.translate(x, y) */ }
  // ... 实现所有接口方法
}
```

## 开发

```bash
# 安装依赖
npm install

# 类型检查
npm run typecheck

# 构建 (ESM + CJS + .d.ts)
npm run build

# 开发模式（watch）
npm run dev

# 运行单元测试
npx vitest run
```

### H5 测试

```bash
cd test/h5
npm install
npm run dev
# 浏览器打开 http://localhost:5173/
# 测试页面：
#   /index.html          — 基础渲染测试
#   /interaction-demo.html — 交互系统演示
#   /serializer-demo.html  — 序列化导入导出演示
```

## 后续规划

- [x] WechatAdapter 实现
- [x] H5Adapter 实现
- [x] 交互系统（hitTest / 选中 / 拖拽 / 缩放 / 旋转）
- [x] DesignSerializer 序列化导入导出
- [ ] AppAdapter 实现（uni-app nvue）
- [ ] 框选（多节点区域选择）
- [ ] clipPath / path 绘制支持
- [ ] 动画系统
- [ ] 撤销/重做（Undo/Redo）

## License

MIT
