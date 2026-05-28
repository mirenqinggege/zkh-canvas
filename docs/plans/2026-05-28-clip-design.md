# 图片裁剪功能设计

日期：2026-05-28

## 需求概述

为 zkh-canvas-renderer 组件添加图片裁剪功能，支持：
- 圆形裁剪（如头像）
- 圆角矩形裁剪

## 需求细节

1. **裁剪信息来源**：使用 Fabric.js 标准的 `clipPath` 属性
2. **圆形半径计算**：有 `radius` 属性时使用该值，否则自动计算 `min(width, height) / 2`
3. **实现方案**：在渲染时使用 Canvas `clip()` 路径裁剪

## 整体架构

```
Fabric JSON (带 clipPath)
    ↓
Parser 解析 clipPath → ClipInfo
    ↓
ImageNode 添加 clip 属性
    ↓
ImageRenderer 渲染时：
  1. save() 保存状态
  2. 创建裁剪路径并 clip()
  3. drawImage() 绘制图片
  4. restore() 恢复状态
```

## 类型定义

### FabricTypes.ts

```typescript
// FabricObjectBase 新增 clipPath
export interface FabricObjectBase {
  // ... 现有属性
  clipPath?: FabricClipPath;
}

// 新增：裁剪路径对象
export interface FabricClipPath {
  type: 'circle' | 'rect';
  radius?: number;
  rx?: number;
  ry?: number;
  width?: number;
  height?: number;
}
```

### ClipInfo 类型

```typescript
interface ClipInfo {
  type: 'circle' | 'rect';
  radius?: number;
  rx?: number;
  ry?: number;
}
```

### ImageNode.ts

```typescript
interface ImageNode extends SceneNode {
  type: 'image';
  src: string;
  imageHandle?: ImageHandle;
  clip?: ClipInfo;  // 新增
}

function createImageNode(..., options?: { clip?: ClipInfo; ... })
```

## 解析器修改

### ImageParser.ts

```typescript
static parse(obj: FabricImage): ImageNode | null {
  const transform = TransformConverter.convert(obj);
  const clip = this.parseClipPath(obj.clipPath, obj.width, obj.height);

  return createImageNode(id, x, y, width, height, src, {
    opacity: obj.opacity ?? 1,
    visible: obj.visible ?? true,
    rotation: transform.rotation,
    scaleX: transform.scaleX,
    scaleY: transform.scaleY,
    clip,
  });
}

private static parseClipPath(
  clipPath: FabricClipPath | undefined,
  nodeWidth: number,
  nodeHeight: number
): ClipInfo | undefined {
  if (!clipPath) return undefined;

  if (clipPath.type === 'circle') {
    const radius = clipPath.radius ?? Math.min(nodeWidth, nodeHeight) / 2;
    return { type: 'circle', radius };
  }

  if (clipPath.type === 'rect') {
    return { type: 'rect', rx: clipPath.rx ?? 0, ry: clipPath.ry ?? 0 };
  }

  return undefined;
}
```

## 渲染器修改

### ImageRenderer.ts

```typescript
render(node: ImageNode, adapter: CanvasAdapter): void {
  if (!node.imageHandle) return;

  if (node.clip) {
    adapter.save();
    this.applyClip(node, node.clip, adapter);
    adapter.drawImage(node.imageHandle, 0, 0, node.width, node.height);
    adapter.restore();
  } else {
    adapter.drawImage(node.imageHandle, 0, 0, node.width, node.height);
  }
}

private applyClip(node: ImageNode, clip: ClipInfo, adapter: CanvasAdapter): void {
  if (clip.type === 'circle') {
    const cx = node.width / 2;
    const cy = node.height / 2;
    adapter.clipCircle(cx, cy, clip.radius!);
  } else if (clip.type === 'rect') {
    adapter.clipRoundRect(0, 0, node.width, node.height, clip.rx ?? 0, clip.ry ?? 0);
  }
}
```

## 适配器接口修改

### CanvasAdapter.ts

```typescript
export interface CanvasAdapter {
  // ... 现有方法

  clipCircle(cx: number, cy: number, radius: number): void;
  clipRoundRect(x: number, y: number, w: number, h: number, rx: number, ry: number): void;
}
```

### WechatAdapter.ts / H5Adapter.ts 实现

```typescript
clipCircle(cx: number, cy: number, radius: number): void {
  this.ensureContext();
  this.ctx!.beginPath();
  this.ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
  this.ctx!.clip();
}

clipRoundRect(x: number, y: number, w: number, h: number, rx: number, ry: number): void {
  this.ensureContext();
  this.drawRoundRectPath(x, y, w, h, rx, ry);
  this.ctx!.clip();
}
```

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| FabricTypes.ts | 添加 FabricClipPath 类型，FabricObjectBase 添加 clipPath |
| ImageNode.ts | 添加 ClipInfo 类型，ImageNode 添加 clip 属性 |
| ImageParser.ts | 添加 parseClipPath 方法 |
| ImageRenderer.ts | 添加裁剪渲染逻辑 |
| CanvasAdapter.ts | 添加 clipCircle、clipRoundRect 接口方法 |
| WechatAdapter.ts | 实现 clipCircle、clipRoundRect |
| H5Adapter.ts | 实现 clipCircle、clipRoundRect |

## 测试用例

### 圆形裁剪测试 JSON

```json
{
  "type": "image",
  "src": "https://example.com/avatar.png",
  "left": 100,
  "top": 100,
  "width": 200,
  "height": 200,
  "clipPath": {
    "type": "circle"
  }
}
```

### 圆角矩形裁剪测试 JSON

```json
{
  "type": "image",
  "src": "https://example.com/photo.png",
  "left": 100,
  "top": 100,
  "width": 300,
  "height": 200,
  "clipPath": {
    "type": "rect",
    "rx": 20,
    "ry": 20
  }
}
```

### 指定半径的圆形裁剪

```json
{
  "type": "image",
  "src": "https://example.com/avatar.png",
  "left": 100,
  "top": 100,
  "width": 200,
  "height": 300,
  "clipPath": {
    "type": "circle",
    "radius": 80
  }
}
```