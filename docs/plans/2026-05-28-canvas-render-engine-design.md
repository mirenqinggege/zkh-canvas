# uni-app 跨端 Canvas 渲染引擎设计文档

## 概述

开发一个基于 uni-app 的跨端 Canvas 渲染引擎，用于解析 Fabric.js 5.x 导出的 JSON，并在微信小程序、H5、App 等平台上使用 Canvas 进行绘制。

**核心设计原则：**

- 不直接运行 Fabric.js
- 不依赖 DOM
- 不依赖浏览器 API
- 通过自定义 Renderer + CanvasAdapter 实现跨端渲染
- 所有平台差异通过 Adapter 层解决

---

## 整体架构

采用单向数据流架构：

```
Fabric JSON (输入)
    ↓
Parser (解析 + 坐标转换 + 属性标准化)
    ↓
SceneGraph (统一节点树结构)
    ↓
Renderer (绘制逻辑，不依赖平台)
    ↓
CanvasAdapter (平台 API 抽象)
    ↓
微信小程序 Canvas 2D API
```

**职责划分：**

- **Parser** - 只负责 Fabric JSON 解析、坐标系转换、属性标准化，输出标准 SceneNode
- **SceneGraph** - 纯数据结构，不包含任何渲染逻辑，仅描述场景
- **Renderer** - 无平台依赖，所有平台差异通过 Adapter 接口隔离
- **CanvasAdapter** - 唯一平台入口，微信、H5、App 等平台各自实现

---

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 平台范围 | 先聚焦微信小程序 | Adapter 抽象层保留，方便后续扩展 |
| Fabric 版本 | 锁定 Fabric.js 5.x | 简化解析逻辑，避免版本兼容问题 |
| 图片加载 | 预加载模式 | 渲染前统一加载，逻辑更稳定 |
| 错误处理 | 警告模式 | 跳过问题部分但输出详细日志，不中断渲染 |
| DPR 处理 | 自动检测 | 根据平台自动获取并应用，无需配置 |
| 坐标系统 | 统一左上角坐标系 | Parser 层转换，简化后续 Renderer 逻辑 |

---

## SceneGraph 设计

### 基础节点接口

```typescript
interface SceneNode {
  id: string;           // 唯一标识
  type: NodeType;       // rect | circle | text | image | group
  
  // 位置和尺寸（左上角坐标系）
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Transform（已转换为左上角坐标系）
  rotation: number;     // 弧度，0 表示无旋转
  scaleX: number;       // 默认 1
  scaleY: number;       // 默认 1
  
  // 样式
  fill: string | null;       // 颜色或 null（无填充）
  stroke: string | null;     // 颜色或 null（无边框）
  strokeWidth: number;       // 边框宽度
  opacity: number;           // 透明度 0-1
  visible: boolean;          // 是否可见
}
```

### 特殊节点属性

- **RectNode** - 支持 `rx`/`ry` 圆角
- **CircleNode** - `radius`（从 width/height 推算）
- **TextNode** - `text`、`fontSize`、`fontFamily`、`fontWeight`、`textAlign`
- **ImageNode** - `src`（URL 或本地路径）、`imageHandle`（加载后缓存）
- **GroupNode** - `children: SceneNode[]`

---

## CanvasAdapter 接口

```typescript
interface CanvasAdapter {
  // 生命周期
  initialize(): Promise<void>;
  destroy(): void;
  
  // Context 状态管理
  save(): void;
  restore(): void;
  
  // Transform 操作
  translate(x: number, y: number): void;
  rotate(rad: number): void;
  scale(x: number, y: number): void;
  
  // 样式设置
  setFillStyle(color: string): void;
  setStrokeStyle(color: string): void;
  setLineWidth(width: number): void;
  setGlobalAlpha(alpha: number): void;
  
  // 绘制基础图形
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillCircle(cx: number, cy: number, radius: number): void;
  strokeCircle(cx: number, cy: number, radius: number): void;
  
  // 文本绘制
  setFont(font: FontOptions): void;
  fillText(text: string, x: number, y: number): void;
  
  // 图片绘制（异步）
  loadImage(src: string): Promise<ImageHandle>;
  drawImage(image: ImageHandle, x: number, y: number, w: number, h: number): void;
  
  // DPR 支持
  applyDPR(): void;
  getDPR(): number;
  
  // Canvas 尺寸
  resize(width: number, height: number): void;
  clear(): void;
}
```

---

## WechatAdapter 实现要点

- 使用微信小程序新版 Canvas 2D API（`type="2d"`）
- 图片加载使用 `canvas.createImage()`，挂载在 canvas 对象上
- DPR 自动检测：`uni.getSystemInfoSync().pixelRatio`
- 物理尺寸 = 显示尺寸 × DPR，context.scale(dpr, dpr) 缩放

---

## Parser 坐标转换

Fabric.js 默认使用中心点坐标，转换为左上角：

```typescript
// originX/originY 默认为 'center'
let x = left;
let y = top;

if (obj.originX === 'center') {
  x = left - (width * scaleX) / 2;
}
if (obj.originY === 'center') {
  y = top - (height * scaleY) / 2;
}

// 角度转弧度
const rotation = (angle * Math.PI) / 180;
```

---

## Renderer 设计

采用策略模式，每种节点类型有对应渲染器：

```typescript
interface NodeRenderer {
  render(node: SceneNode, adapter: CanvasAdapter): void;
}
```

**渲染管线流程：**

1. adapter.clear() 清空画布
2. 遍历所有节点
3. 对每个节点：save → applyTransform → render → restore
4. Group 递归渲染 children，子节点坐标相对于 Group

**Transform 应用顺序：**

```
translate(x, y) → rotate(rotation) → scale(scaleX, scaleY)
```

---

## 图片预加载流程

```typescript
class ImagePreloader {
  async preload(graph: SceneGraph): Promise<LoadResult> {
    // 1. 收集所有 ImageNode（包括 Group 内的）
    // 2. 并行加载所有图片
    // 3. 缓存 imageHandle 到节点
    // 4. 返回加载结果（成功/失败列表）
  }
}
```

---

## 引擎入口

```typescript
class CanvasEngine {
  async render(json: FabricExportJSON): Promise<RenderResult> {
    const graph = this.parser.parse(json);
    await this.preloader.preload(graph);
    this.renderer.render(graph, this.adapter);
    return result;
  }
}
```

---

## 目录结构

```
renderer/
├── parser/
│   ├── FabricParser.ts
│   ├── parsers/
│   │   ├── RectParser.ts
│   │   ├── CircleParser.ts
│   │   ├── TextParser.ts
│   │   ├── ImageParser.ts
│   │   └── GroupParser.ts
│   └── TransformConverter.ts
│
├── scene/
│   ├── SceneNode.ts
│   ├── nodes/
│   │   ├── RectNode.ts
│   │   ├── CircleNode.ts
│   │   ├── TextNode.ts
│   │   ├── ImageNode.ts
│   │   ├── GroupNode.ts
│   ├── SceneGraph.ts
│   └── NodeType.ts
│
├── renderer/
│   ├── SceneRenderer.ts
│   ├── renderers/
│   │   ├── RectRenderer.ts
│   │   ├── CircleRenderer.ts
│   │   ├── TextRenderer.ts
│   │   ├── ImageRenderer.ts
│   │   └── GroupRenderer.ts
│   └── NodeRenderer.ts
│
├── adapters/
│   ├── CanvasAdapter.ts
│   ├── WechatAdapter.ts
│   └── types/
│   │   ├── ImageHandle.ts
│   │   ├── FontOptions.ts
│
├── utils/
│   ├── DPRDetector.ts
│   ├── ColorParser.ts
│   ├── Logger.ts
│   └── MathUtils.ts
│
├── engine/
│   ├── CanvasEngine.ts
│   └── ImagePreloader.ts
│
├── types/
│   ├── FabricTypes.ts
│   └── RenderResult.ts
│
└── index.ts
```

---

## uni-app 集成示例

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
import { CanvasEngine, WechatAdapter } from '@/renderer';

onMounted(async () => {
  const adapter = new WechatAdapter('fabricCanvas');
  await adapter.initialize();
  
  const engine = new CanvasEngine(adapter);
  const result = await engine.render(fabricJSON);
});
</script>
```

---

## 第二阶段预留能力

- hitTest（命中检测）
- selection（选择）
- drag（拖拽）
- resize（调整大小）
- rotate handler（旋转控制）
- clipPath（裁剪路径）
- path（路径绘制）
- 富文本
- 离屏 canvas
- 缓存层
- 事件系统
- 动画系统

---

## 创建日期

2026-05-28