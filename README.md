# zkh-canvas-renderer

基于 uni-app 的跨端 Canvas 渲染引擎，用于解析 Fabric.js 导出的 JSON 并在各平台进行 Canvas 绘制。

## 特性

- **跨端渲染** - 支持微信小程序、H5/浏览器等平台
- **Fabric.js 兼容** - 解析 Fabric.js 5.x 导出的 JSON 结构
- **平台隔离** - 所有平台差异通过 Adapter 层抽象
- **高清适配** - 自动检测 DPR 并应用，确保清晰渲染
- **图片预加载** - 渲染前统一加载图片，保证绘制完整
- **强类型** - 完整 TypeScript 类型定义

## 架构

```
Fabric JSON (输入)
    ↓
Parser (解析 + 坐标转换)
    ↓
SceneGraph (统一节点树)
    ↓
Renderer (绘制逻辑)
    ↓
CanvasAdapter (平台抽象)
    ↓
各平台 Canvas API
```

## 安装

```bash
npm install zkh-canvas-renderer
```

## 使用示例

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
  // 初始化适配器
  const adapter = new WechatAdapter('fabricCanvas');
  
  // 创建引擎
  const engine = new CanvasEngine(adapter);
  
  // 初始化
  await engine.initialize();
  
  // 加载 Fabric JSON
  const fabricJSON = {
    version: '5.0.0',
    objects: [
      {
        type: 'rect',
        left: 100,
        top: 100,
        width: 200,
        height: 150,
        fill: '#ff5722',
        stroke: '#333333',
        strokeWidth: 2
      },
      {
        type: 'circle',
        left: 200,
        top: 300,
        radius: 50,
        fill: '#2196f3'
      },
      {
        type: 'text',
        left: 50,
        top: 50,
        text: 'Hello Canvas',
        fontSize: 24,
        fill: '#000000'
      }
    ]
  };
  
  // 渲染
  const result = await engine.render(fabricJSON);
  
  if (!result.success) {
    console.warn('部分图片加载失败', result.failedImages);
  }
});
</script>
```

### H5/浏览器

```html
<canvas id="fabricCanvas" width="800" height="600"></canvas>

<script type="module">
import { CanvasEngine, H5Adapter } from 'zkh-canvas-renderer';

// 通过 Canvas ID 创建适配器
const adapter = H5Adapter.fromId('fabricCanvas');

// 或直接传入 Canvas 元素
// const canvas = document.getElementById('fabricCanvas');
// const adapter = new H5Adapter(canvas);

// 创建引擎
const engine = new CanvasEngine(adapter);

// 初始化
await engine.initialize();

// 加载 Fabric JSON
const fabricJSON = {
  version: '5.0.0',
  objects: [
    {
      type: 'rect',
      left: 100,
      top: 100,
      width: 200,
      height: 150,
      fill: '#ff5722',
      rx: 10,
      ry: 10
    },
    {
      type: 'circle',
      left: 400,
      top: 300,
      radius: 80,
      fill: '#4caf50'
    },
    {
      type: 'text',
      left: 50,
      top: 50,
      text: 'Hello H5 Canvas',
      fontSize: 32,
      fontFamily: 'Arial',
      fill: '#333333'
    }
  ]
};

// 渲染
const result = await engine.render(fabricJSON);
console.log('渲染完成', result);
</script>
```

## 支持的对象类型

| 类型 | 说明 |
|------|------|
| `rect` | 矩形（支持圆角 rx/ry） |
| `circle` | 圆形 |
| `text` | 文本 |
| `textbox` | 文本框 |
| `image` | 图片 |
| `group` | 组（嵌套子对象） |

## API

### CanvasEngine

```typescript
// 创建引擎
const engine = new CanvasEngine(adapter, { debug: true });

// 初始化
await engine.initialize();

// 渲染
const result = await engine.render(fabricJSON);

// 销毁
engine.destroy();

// 设置尺寸
engine.resize(width, height);
```

### WechatAdapter（微信小程序）

```typescript
// 通过 Canvas ID 创建
const adapter = new WechatAdapter('canvasId');
await adapter.initialize();
```

### H5Adapter（浏览器）

```typescript
// 通过 Canvas ID 创建
const adapter = H5Adapter.fromId('canvasId');

// 或直接传入 Canvas 元素
const canvas = document.getElementById('canvasId');
const adapter = new H5Adapter(canvas);

await adapter.initialize();
```

### SceneGraph

```typescript
// 手动创建节点
import { createRectNode, createCircleNode, SceneGraph } from 'zkh-canvas-renderer';

const rectNode = createRectNode('rect-1', 10, 10, 100, 80, {
  fill: '#ff0000'
});

const graph = new SceneGraph([rectNode]);
```

## 目录结构

```
renderer/
├── parser/          # Fabric JSON 解析器
│   ├── parsers/     # 各类型解析器
│   └── TransformConverter.ts  # 坐标转换
├── scene/           # 场景图节点结构
│   └── nodes/       # 各类型节点
├── renderer/        # 渲染器
│   └── renderers/   # 各类型渲染器
├── adapters/        # 平台适配器
│   ├── WechatAdapter.ts  # 微信小程序
│   ├── H5Adapter.ts      # H5/浏览器
│   └── types/       # 适配器类型定义
├── engine/          # 引擎入口
├── utils/           # 工具函数
├── types/           # 类型定义
└── index.ts         # 导出入口
```

## 设计原则

1. **Parser 职责单一** - 只负责解析和坐标转换
2. **SceneGraph 纯数据** - 不包含渲染逻辑
3. **Renderer 无平台依赖** - 所有差异通过 Adapter 隔离
4. **Adapter 统一接口** - 平台实现的唯一入口

## 扩展新平台

实现 `CanvasAdapter` 接口即可支持新平台：

```typescript
class CustomAdapter implements CanvasAdapter {
  async initialize() { /* ... */ }
  save() { /* ... */ }
  restore() { /* ... */ }
  translate(x, y) { /* ... */ }
  rotate(rad) { /* ... */ }
  scale(x, y) { /* ... */ }
  // ... 实现所有接口方法
}
```

## 后续规划

- [x] WechatAdapter 实现
- [x] H5Adapter 实现
- [ ] AppAdapter 实现（uni-app nvue）
- [ ] hitTest 命中检测
- [ ] selection/drag/resize 交互
- [ ] clipPath/path 绘制
- [ ] 动画系统

## 开发

```bash
# 安装依赖
npm install

# 类型检查
npm run typecheck

# 构建
npm run build
```

## License

MIT