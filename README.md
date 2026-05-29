# zkh-canvas-renderer

基于 uni-app 的跨端 Canvas 渲染引擎，解析 Fabric.js 5.x 导出的 JSON 并在各平台绘制。

## 特性

- **Fabric.js 5.x 兼容** — 解析标准 Fabric.js JSON 结构，支持 rect/circle/text/textbox/image/group
- **跨端渲染** — 通过 Adapter 模式抽象平台差异，支持 H5/浏览器和微信小程序
- **交互系统** — 内置命中检测（HitTest）、选中、拖拽、缩放、旋转、选中框渲染
- **高清适配** — 自动检测 DPR 并应用到 Canvas，确保渲染清晰
- **图片预加载** — 渲染前统一加载图片资源，保证绘制完整
- **名片模板** — 支持简化的卡片模板 JSON 格式，快速渲染名片/海报
- **强类型** — 完整 TypeScript 类型定义

## 架构

```
Fabric JSON / Card JSON (输入)
    ↓
Parser (解析 + 坐标转换)
    ↓
SceneGraph (统一节点树)
    ↓
Renderer (绘制逻辑)
    ↓
CanvasAdapter (平台抽象层)
    ↓
各平台 Canvas API (H5 / 微信小程序)
```

### 目录结构

```
renderer/
├── parser/              # JSON 解析器
│   ├── FabricParser.ts  # Fabric.js JSON 解析
│   ├── CardParser.ts    # 名片模板 JSON 解析
│   └── TransformConverter.ts  # 坐标转换（center→top-left）
├── scene/               # 场景图
│   ├── nodes/           # 节点类型定义（Rect, Circle, Text, Image, Group）
│   └── SceneGraph.ts    # 场景图管理器
├── renderer/            # 渲染器
│   ├── renderers/       # 各类型渲染器
│   └── SceneRenderer.ts # 场景渲染入口
├── adapters/            # 平台适配器
│   ├── H5Adapter.ts     # H5/浏览器
│   ├── WechatAdapter.ts # 微信小程序
│   └── CanvasAdapter.ts # 适配器接口定义
├── interaction/         # 交互系统
│   ├── HitTestService.ts          # 几何命中检测
│   ├── EventManager.ts            # 事件分发管理
│   ├── SelectionOverlayRenderer.ts # 选中框/控制柄绘制
│   └── controllers/
│       ├── SelectionController.ts  # 选中控制器
│       ├── DragController.ts       # 拖拽控制器
│       ├── ResizeController.ts     # 缩放控制器（8 方向）
│       └── RotateController.ts     # 旋转控制器
├── engine/              # 引擎入口
├── types/               # 类型定义
└── utils/               # 工具函数
```

## 安装

```bash
npm install zkh-canvas-renderer
```

## 使用示例

### H5/浏览器 — 基础渲染

```typescript
import { CanvasEngine, H5Adapter } from 'zkh-canvas-renderer';

// 创建引擎
const adapter = H5Adapter.fromId('myCanvas');
const engine = new CanvasEngine(adapter);

// 初始化
await engine.initialize();

// 渲染 Fabric JSON
const result = await engine.render({
  version: '5.0.0',
  width: 800,
  height: 600,
  objects: [
    {
      type: 'rect',
      left: 100, top: 100,
      width: 200, height: 150,
      fill: '#ff5722',
      rx: 10, ry: 10,
    },
    {
      type: 'circle',
      left: 400, top: 300,
      radius: 80, fill: '#4caf50',
    },
    {
      type: 'text',
      left: 50, top: 50,
      text: 'Hello Canvas',
      fontSize: 32,
      fill: '#333333',
    },
  ],
});

console.log('渲染完成', result);
```

### H5/浏览器 — 启用交互

```typescript
import { CanvasEngine, H5Adapter } from 'zkh-canvas-renderer';

const adapter = H5Adapter.fromId('myCanvas');
const engine = new CanvasEngine(adapter);
await engine.initialize();

// 先渲染场景
await engine.render(fabricJSON);

// 然后启用交互（选中、拖拽、缩放、旋转）
engine.enableInteraction();

// 监听选中变化
const selCtrl = engine.getSelectionController();
selCtrl?.onChange((selectedIds) => {
  console.log('已选中:', selectedIds);
});

// 鼠标事件由 EventManager 自动处理
// 交互功能：
// - 单击选中 / Shift+单击多选
// - 拖拽移动选中节点
// - 拖拽控制柄调整大小
// - 拖拽旋转手柄旋转

// 禁用交互
engine.disableInteraction();
```

### 微信小程序

```vue
<template>
  <view class="canvas-container">
    <canvas
      type="2d"
      id="fabricCanvas"
      canvas-id="fabricCanvas"
      :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }"
    />
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

  const result = await engine.render({
    version: '5.0.0',
    objects: [
      {
        type: 'rect',
        left: 100, top: 100,
        width: 200, height: 150,
        fill: '#ff5722',
      },
    ],
  });
});
</script>
```

### 名片模板

```typescript
import { CanvasEngine, H5Adapter } from 'zkh-canvas-renderer';

const engine = new CanvasEngine(H5Adapter.fromId('myCanvas'));
await engine.initialize();

await engine.renderCard({
  size: { width: 500, height: 300 },
  background: { color: '#ffffff' },
  elements: [
    {
      type: 'avatar',
      src: 'https://example.com/avatar.jpg',
      x: 20, y: 40, width: 80, height: 80,
      borderRadius: 40,
    },
    {
      type: 'text',
      x: 120, y: 50, fontSize: 24, bold: true,
      text: '张三',
      color: '#333',
    },
  ],
});
```

## 支持的对象类型

| 类型 | 说明 | 特殊属性 |
|------|------|----------|
| `rect` | 矩形 | `rx` / `ry` 圆角 |
| `circle` | 圆形 | `radius` |
| `text` | 文本 | `fontSize`, `fontFamily`, `fontWeight` |
| `textbox` | 文本框 | 同 text |
| `image` | 图片 | `src` 图片 URL |
| `group` | 组 | `objects` 嵌套子对象 |

## API

### CanvasEngine

| 方法 | 说明 |
|------|------|
| `initialize()` | 初始化引擎，准备 Canvas |
| `render(json)` | 渲染 Fabric.js JSON |
| `renderCard(json)` | 渲染名片模板 JSON |
| `enableInteraction()` | 启用交互（在 render 之后调用） |
| `disableInteraction()` | 禁用交互 |
| `resize(width, height)` | 调整 Canvas 尺寸 |
| `destroy()` | 销毁引擎，释放资源 |

### 交互系统

| 组件 | 说明 |
|------|------|
| `SelectionController` | 点选、Shift 多选、状态管理 |
| `DragController` | 拖拽移动选中节点 |
| `ResizeController` | 8 方向控制柄缩放 |
| `RotateController` | 旋转手柄 |
| `EventManager` | 事件分发，按优先级路由到各控制器 |
| `HitTestService` | 几何命中检测（支持圆角矩形、圆形、变换逆运算） |
| `SelectionOverlayRenderer` | 选中框、控制柄、旋转手柄绘制 |

### CanvasAdapter

平台适配器需要实现 `CanvasAdapter` 接口：

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

| 适配器 | 说明 |
|--------|------|
| `H5Adapter` | H5/浏览器，支持 `H5Adapter.fromId(id)` 便捷创建 |
| `WechatAdapter` | 微信小程序 2D Canvas |

### 工具函数

| 函数 | 说明 |
|------|------|
| `degToRad(deg)` | 角度转弧度 |
| `radToDeg(rad)` | 弧度转角度 |
| `clamp(value, min, max)` | 数值限幅 |
| `normalizeColor(color)` | 颜色标准化 |
| `isValidColor(color)` | 颜色值校验 |

## 扩展新平台

实现 `CanvasAdapter` 接口即可：

```typescript
import type { CanvasAdapter, ImageHandle, FontOptions } from 'zkh-canvas-renderer';

class CustomAdapter implements CanvasAdapter {
  async initialize() { /* ... */ }
  save() { /* ... */ }
  restore() { /* ... */ }
  translate(x, y) { /* ... */ }
  // ... 实现所有接口方法
}
```

## 开发

```bash
# 安装依赖
npm install

# 类型检查
npm run typecheck

# 构建
npm run build

# 开发模式（watch）
npm run dev
```

### H5 测试

```bash
cd test/h5
npm install
npm run dev
```

## 后续规划

- [x] WechatAdapter 实现
- [x] H5Adapter 实现
- [x] 交互系统（hitTest / 选中 / 拖拽 / 缩放 / 旋转）
- [ ] AppAdapter 实现（uni-app nvue）
- [ ] 框选（多节点区域选择）
- [ ] clipPath / path 绘制支持
- [ ] 动画系统
- [ ] 撤销/重做（Undo/Redo）

## License

MIT
