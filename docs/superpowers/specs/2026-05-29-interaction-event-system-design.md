# Canvas 渲染引擎事件系统设计文档

## 概述

为跨端 Canvas 渲染引擎增加交互能力，包括命中检测、事件管理、选择、拖拽、调整大小和旋转控制。这是设计文档第二阶段（第一阶段为基础渲染管线）的实现。

**核心设计原则：**

- HitTestService 使用纯几何运算，不依赖 Canvas API
- 所有交互控制器遵循统一接口，可独立测试
- 事件管理器封装平台差异（touch vs mouse）
- 控制器按优先级链式处理事件

---

## HitTestService（命中检测）

### 坐标空间约定

**HitTestService 所有运算在显示坐标空间（CSS 像素）中进行**，与 SceneNode 的属性（x, y, width, height）保持一致。

渲染管线中，Canvas 物理像素 = 显示尺寸 × DPR。Adapter 通过 `ctx.scale(dpr, dpr)` 缩放后在显示坐标空间绘制。因此 EventManager 从原生事件提取坐标时，必须将物理像素坐标转换为显示坐标：

```
显示坐标 = 物理像素坐标 / DPR
```

若 Adapter 不提供 DPR（如某些平台不支持），默认 DPR = 1。

### 逆变换算法

渲染管线对每个节点执行 `translate(x,y) → rotate(θ) → scale(sx,sy)`。命中检测需要逆过程将画布坐标转为节点局部坐标：

```
画布坐标 P(px, py)  ← 已在显示坐标空间
    ↓ 逆平移
tmpX = px - node.x
tmpY = py - node.y
    ↓ 逆旋转 (θ = -node.rotation)
cosθ = cos(θ), sinθ = sin(θ)
localX = cosθ * tmpX - sinθ * tmpY
localY = sinθ * tmpX + cosθ * tmpY
    ↓ 逆缩放
localX /= node.scaleX
localY /= node.scaleY
```

### Group 节点的二级逆变换

Group 节点自身有 transform 属性（x, y, rotation, scaleX, scaleY），子节点坐标相对于 Group 的局部空间。命中检测时，变换链需要两级展开：

```
画布坐标 P(px, py)
    ↓ 第一级：逆 Group 自身 transform
tmpX = px - group.x
tmpY = py - group.y
tmpX = cos(-group.rotation) * tmpX - sin(-group.rotation) * tmpY
tmpY = sin(-group.rotation) * tmpX + cos(-group.rotation) * tmpY
tmpX /= group.scaleX
tmpY /= group.scaleY
    ↓ 得到 Group 局部坐标
    ↓ 第二级：对每个子节点执行标准逆变换
子节点局部坐标 = 逆变换(tmpX, tmpY, child)
```

在代码实现中，可以复用同一个逆变换函数，只需在递归进入 Group 子节点之前，将画布坐标先转换为 Group 局部坐标。

### 各形状检测

| 节点类型 | 检测方法 |
|---------|---------|
| rect | 点在 [0, width] × [0, height] 内；圆角时额外检查四角距离 |
| circle | 点到圆心 (width/2, height/2) 距离 < radius |
| text | 点在 [0, width] × [0, height] 内（包围盒检测，已知局限见下方） |
| image | 点在 [0, width] × [0, height] 内 |
| group | 先通过自身包围盒过滤，命中后递归检测子节点（子节点坐标相对于 Group，需经过二级逆变换） |

> **text 包围盒检测的已知局限：** 文本实际渲染宽度可能远小于 SceneNode.width（如短文本 "OK" 的 width=200）。用户点击文本右侧空白区域也会命中该文本节点。这是用包围盒近似文本实际渲染区域的权衡——优点是计算简单无需 Canvas API，缺点是精度有损。后续可在 TextNode 上增加 `actualWidth`/`actualHeight` 字段（预计算）来改善精度。

### 遍历规则

- 节点按渲染顺序**从后往前遍历**（后渲染的在上面）
- Group 内的子节点按相同规则从后往前
- 第一个命中的节点作为 hitTest 结果返回
- `visible === false` 的节点跳过

### 接口定义

```typescript
interface HitTestService {
  /**
   * 在场景中查找指定坐标点命中的最上层节点
   * @param graph 场景图
   * @param x 画布显示坐标 X
   * @param y 画布显示坐标 Y
   * @returns 命中的节点，未命中返回 null
   */
  hitTest(graph: SceneGraph, x: number, y: number): SceneNode | null;

  /**
   * 带排除列表的命中检测
   * @param excludeNodeIds 排除的节点 ID 列表
   */
  hitTestWithExclude(
    graph: SceneGraph,
    x: number, y: number,
    excludeNodeIds: string[]
  ): SceneNode | null;
}
```

### 测试策略

纯数学运算，在 Node 环境下即可测试，无需 Canvas 环境：
- 矩形命中（含圆角）
- 圆形命中（含非等比缩放后的椭圆）
- 带旋转/缩放的命中
- 嵌套 Group 的命中
- 不可见节点跳过
- 多个重叠节点的命中顺序

---

## EventManager（事件管理器）

### 职责

1. 统一 touch/mouse 事件为 `pointer` 事件
2. 坐标映射：原生事件坐标 → Canvas 显示坐标
3. 事件生命周期管理
4. 按控制器优先级链式分发事件

### 事件映射

| 平台 | 原生事件 | 统一事件 |
|------|---------|---------|
| 微信小程序 | touchstart | pointerdown |
| 微信小程序 | touchmove | pointermove |
| 微信小程序 | touchend | pointerup |
| 微信小程序 | touchcancel | pointercancel |
| H5 | mousedown | pointerdown |
| H5 | mousemove | pointermove |
| H5 | mouseup | pointerup |

### 事件生命周期

```
pointerdown
    ↓ (move events...)
pointermove (0次或多次)
    ↓
pointerup
    │
    ├── 如果 down → up 间位移 < 阈值 → 触发 click
    └── 如果 pointerdown 目标在 pointerup 时已不在 → 触发 pointerupoutside
```

### 坐标转换

```typescript
getCanvasPoint(nativeEvent): { x: number; y: number } {
  // 获取 Canvas 元素在页面中的偏移
  const rect = await adapter.getBoundingClientRect();

  // 从 touch 或 mouse 事件获取页面坐标
  const pageX = nativeEvent.touches?.[0]?.pageX ?? nativeEvent.clientX ?? 0;
  const pageY = nativeEvent.touches?.[0]?.pageY ?? nativeEvent.clientY ?? 0;

  // 转换为 Canvas 显示坐标（考虑滚动偏移）
  let canvasX = pageX - rect.left;
  let canvasY = pageY - rect.top;

  // H5: 加上页面滚动偏移（getBoundingClientRect 返回视口相对位置）
  // 微信小程序: boundingClientRect 行为不同，不需要滚动补偿
  if (platform === 'h5') {
    canvasX += window.scrollX;
    canvasY += window.scrollY;
  }

  // 物理像素 → 显示坐标（CSS 像素）
  const dpr = adapter.getDPR();
  canvasX /= dpr;
  canvasY /= dpr;

  return { x: canvasX, y: canvasY };
}
```

> **注意：** 微信小程序中 `boundingClientRect` 返回的是相对于页面（非视口）的坐标，因此不需要滚动补偿。各平台 Adapter 的 `getBoundingClientRect()` 应封装此差异，EventManager 无需判断平台。

### 键盘修饰键管理

Shift 键在交互中有多处使用（追加选择、等比缩放、15° 吸附旋转）。EventManager 负责统一追踪键盘修饰键状态，避免各控制器各自解析原生键盘事件：

```typescript
class EventManager {
  private modifiers: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean } = {
    shiftKey: false, altKey: false, ctrlKey: false, metaKey: false,
  };

  private onKeyDown = (nativeEvent: KeyboardEvent) => {
    this.modifiers.shiftKey = nativeEvent.shiftKey;
    this.modifiers.altKey = nativeEvent.altKey;
    this.modifiers.ctrlKey = nativeEvent.ctrlKey;
    this.modifiers.metaKey = nativeEvent.metaKey;
  };

  private onKeyUp = (nativeEvent: KeyboardEvent) => {
    this.modifiers.shiftKey = nativeEvent.shiftKey;
    this.modifiers.altKey = nativeEvent.altKey;
    this.modifiers.ctrlKey = nativeEvent.ctrlKey;
    this.modifiers.metaKey = nativeEvent.metaKey;
  };

  getModifiers(): { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean } {
    return { ...this.modifiers };
  }
}
```

控制器通过 `EventManager.getModifiers()` 获取当前修饰键状态，而非从 `nativeEvent` 中自行解析。

> **微信小程序兼容：** 小程序 touch 事件不携带键盘修饰键信息（物理键盘受限）。在小程序端 shiftKey 等始终为 false，等比缩放和角度吸附功能应提供替代交互方式（如双指捏合或额外的 UI 按钮）。

### 接口定义

```typescript
class EventManager {
  constructor(
    adapter: CanvasAdapter,
    hitTestService: HitTestService,
    renderer: SceneRenderer
  );

  /**
   * 绑定事件监听
   */
  attach(): void;

  /**
   * 解绑事件监听
   */
  detach(): void;

  /**
   * 注册交互控制器
   * 按注册顺序决定优先级（先注册的优先级高）
   */
  addController(controller: InteractionController): void;

  /**
   * 移除交互控制器
   * 如果该控制器正在交互中，先调用其 cancel() 方法再移除
   */
  removeController(name: string): void;
}
```

### 生命周期与清理

EventManager 的生命周期与 CanvasEngine 绑定：

```typescript
// CanvasEngine.destroy() 的扩展行为
destroy(): void {
  // 1. 先清理事件系统
  if (this.eventManager) {
    this.eventManager.detach();      // 解绑所有平台事件监听
    this.eventManager.removeAllControllers(); // 取消所有进行中的交互
  }

  // 2. 再销毁适配器
  this.adapter.destroy();
}
```

**清理顺序的关键约束：** 必须先清理事件系统再销毁 Adapter。因为 `detach()` 需要调用 Adapter 的 `addEventListener` 返回的解绑函数，若 Adapter 已销毁则无法正确解绑。

**removeController 的安全性：** 如果被移除的控制器正在交互中（`active === true`），先调用其 `cancel()` 方法确保交互状态正确结束，再移除。这避免了"控制器被移除但节点状态仍处于拖拽中"的残留问题。

**重复 attach 防护：** `attach()` 内部应记录已绑定状态，重复调用不会添加重复监听器。"

---

## InteractionController 接口

```typescript
interface InteractionController {
  /** 控制器名称（唯一标识） */
  name: string;

  /** 是否正在交互中 */
  active: boolean;

  /**
   * 处理 pointerdown 事件
   * @returns true 表示消费了该事件，后续控制器不再处理
   */
  onPointerDown(x: number, y: number, nativeEvent: any): boolean;

  /**
   * 处理 pointermove 事件
   */
  onPointerMove(x: number, y: number, nativeEvent: any): void;

  /**
   * 处理 pointerup 事件
   */
  onPointerUp(x: number, y: number, nativeEvent: any): void;

  /**
   * 处理 pointercancel 事件
   * 平台触发的被动取消（如微信小程序中手指移出可交互区域、系统弹窗等）
   * 与 cancel() 的区别：cancel() 是外部主动调用，onPointerCancel 是平台事件驱动
   */
  onPointerCancel?(x: number, y: number, nativeEvent: any): void;

  /**
   * 取消当前交互（外部主动调用，如切换页面、手动结束）
   */
  cancel(): void;
}
```

> **`onPointerCancel` vs `cancel()` 的区别：**
> - `onPointerCancel`：平台事件驱动（touchcancel/pointercancel），控制器应重置内部状态但不触发业务回调
> - `cancel()`：外部主动调用（如用户切换工具、手动取消），控制器应重置状态并可能触发取消回调

---

## SelectionController（选择控制器）

### 选择行为

| 操作 | 结果 |
|------|------|
| 单击节点（未选中） | 选中该节点，取消其他选中 |
| Shift + 单击节点 | 追加/切换该节点的选中状态 |
| 单击空白区域 | 取消所有选中 |
| 再次单击已选中节点 | 不改变选中状态（由 DragController 消费） |

### 选中态渲染

#### 渲染策略：主 Canvas 同层叠加

选中框和控制柄与场景内容在**同一个 Canvas 上绘制**，位于场景内容之上。每次交互导致状态变化时触发**全量重绘**（清空 → 绘制场景内容 → 绘制选中覆盖层）。

选择此方案的理由：
- 微信小程序不支持多个 Canvas 叠加，独立 overlay Canvas 方案不可行
- 全量重绘在名片编辑场景（节点数 < 100）下性能充足
- 后续可在 SceneRenderer 中引入脏矩形优化以支持更复杂的场景

#### 视觉元素

选中节点时绘制以下视觉反馈：

- **选中框**：节点 bounding box 的虚线轮廓（strokeDash = [4, 4]），颜色使用系统强调色（如 #4a90d9）
- **控制柄**：8 个空心小方块（4 角 + 4 边中点），白色填充 + 蓝色描边，尺寸 10×10 显示像素
- **旋转手柄**：选中框正上方中心的一个圆形点 + 从选中框上边中点连接到圆心的竖线

> **旋转后的选中框：** 当节点有旋转角度时，选中框和控制柄跟随节点的旋转角度绘制。Bounding box 为旋转后的外接矩形。控制柄位置计算需要考虑 rotation、scaleX、scaleY 的综合影响。

控制柄效果（示意图）：

```
                ○  ← 旋转手柄（圆形）
                │  ← 连接线
     □──────────□──────────□
     │                     │
     │    (selected        │
     │     node)           │
     │                     │
     □──────────□──────────□
     │                     │
     □──────────□──────────□
```

#### 渲染入口

```typescript
// SceneRenderer 新增方法
renderSelectionOverlay(
  adapter: CanvasAdapter,
  selectedNodes: SceneNode[],
  allHandles: ResizeHandle[]
): void {
  // 在场景内容渲染之后调用
  for (const node of selectedNodes) {
    this.drawSelectionBox(adapter, node);
    this.drawResizeHandles(adapter, allHandles);
    this.drawRotateHandle(adapter, node);
  }
}
```

### 接口

```typescript
class SelectionController implements InteractionController {
  name = 'selection';
  active: boolean;

  // 选中节点集合
  selectedNodeIds: Set<string>;

  // 事件
  onSelect(node: SceneNode): void;
  onDeselect(node: SceneNode): void;
  onSelectionChange(selectedIds: string[]): void;

  // 清除选中
  clearSelection(): void;

  // 选中指定节点
  selectNode(id: string): void;
  toggleNode(id: string): void;
}
```

---

## DragController（拖拽控制器）

### 交互流程

1. pointerdown 在已选中的节点上 → 激活拖拽，记录起始位置
2. pointermove → 计算位移，更新节点 x/y
3. pointerup → 停止拖拽，触发 `node:modified` 事件

### 对齐和约束

- **拖拽过程中触发全量重绘**
- 拖拽结束后触发 `node:modified` 事件，使用方可根据需要做吸附对齐

### 接口

```typescript
class DragController implements InteractionController {
  name = 'drag';
  active: boolean;

  // 拖拽中的节点
  draggingNodes: SceneNode[];

  // 事件
  onDragStart(node: SceneNode): void;
  onDragMove(node: SceneNode, dx: number, dy: number): void;
  onDragEnd(node: SceneNode): void;
}
```

---

## ResizeController（调整大小控制器）

### 控制柄类型与完整行为

| 标识 | 位置 | 行为 |
|------|------|------|
| TL | 左上角 | 同时调整宽高：`x += dx; y += dy; width -= dx; height -= dy` |
| TR | 右上角 | 同时调整宽高：`y += dy; width += dx; height -= dy` |
| BL | 左下角 | 同时调整宽高：`x += dx; width -= dx; height += dy` |
| BR | 右下角 | 同时调整宽高：`width += dx; height += dy`（最常用） |
| TC | 上边中点 | 仅调整高度和 y：`y += dy; height -= dy` |
| BC | 下边中点 | 仅调整高度：`height += dy` |
| LC | 左边中点 | 仅调整宽度和 x：`x += dx; width -= dx` |
| RC | 右边中点 | 仅调整宽度：`width += dx` |

> 上表中 `dx`、`dy` 为指针移动量（已转换为节点局部坐标系）。对左边控制柄（TL、BL、LC），`x` 位置随 `width` 同步调整；对上边控制柄（TL、TR、TC），`y` 位置随 `height` 同步调整。

### 核心逻辑

```typescript
// 控制柄命中检测（相对于节点局部坐标）
const handleSize = 10; // 控制柄大小（物理像素）
const handles = getResizeHandles(node);

// 拖拽时根据控制柄类型更新节点属性
function onResizeMove(dx: number, dy: number) {
  switch (activeHandle) {
    case 'BR':
      node.width = Math.max(minWidth, startWidth + dx / startScaleX);
      node.height = Math.max(minHeight, startHeight + dy / startScaleY);
      break;
    case 'TC':
      node.y += dy / startScaleY;
      node.height = Math.max(minHeight, startHeight - dy / startScaleY);
      break;
    // ... 其他控制柄
  }
}
```

### 约束

- 最小尺寸：10×10 像素
- Shift 拖拽角控制柄：等比缩放
- 拖拽边控制柄：限制单方向

### 接口

```typescript
class ResizeController implements InteractionController {
  name = 'resize';
  active: boolean;

  // 事件
  onResizeStart(node: SceneNode): void;
  onResize(node: SceneNode, width: number, height: number): void;
  onResizeEnd(node: SceneNode): void;
}
```

---

## RotateController（旋转控制器）

### 交互流程

1. pointerdown 在旋转手柄上 → 激活旋转，记录初始角度
2. pointermove → 计算从节点中心到当前点的角度，更新 rotation
3. pointerup → 结束旋转，触发 `node:modified` 事件

### 角度计算

```typescript
function onRotateMove(x: number, y: number) {
  const center = getRectCenter(node.x, node.y, node.width * node.scaleX, node.height * node.scaleY);
  const angle = Math.atan2(y - center.cy, x - center.cx);
  node.rotation = angle - startAngle;

  // 按 Shift 时每 15° 吸附一次
  if (nativeEvent.shiftKey) {
    node.rotation = Math.round(node.rotation / (Math.PI / 12)) * (Math.PI / 12);
  }
}
```

### 旋转手柄渲染

- 绘制在选中框正上方中心
- 圆形标记（半径 6px）+ 从选中框上边到圆心的连线
- 拖拽时显示辅助线（从节点中心到指针的虚线）

### 接口

```typescript
class RotateController implements InteractionController {
  name = 'rotate';
  active: boolean;

  // 事件
  onRotateStart(node: SceneNode): void;
  onRotate(node: SceneNode, rotation: number): void;
  onRotateEnd(node: SceneNode): void;
}
```

---

## 控制器优先级链

```typescript
// EventManager.pointerDown 处理流程
for (const controller of controllers) {
  // 按优先级顺序
  if (controller.onPointerDown?.(x, y, event)) {
    return; // 消费了事件，停止传递
  }
}

// 默认优先级（从高到低）：
// 1. RotateController   — 先检查是否点中旋转手柄
// 2. ResizeController   — 再检查是否点中 resize 手柄
// 3. DragController     — 然后检查是否在选中节点上按下
// 4. SelectionController — 最后处理选择/取消选择
```

---

## CanvasEngine 集成

### 新增方法

```typescript
class CanvasEngine {
  // ... 现有方法 ...

  /**
   * 启用交互
   */
  enableInteraction(): void;

  /**
   * 禁用交互
   */
  disableInteraction(): void;

  /**
   * 获取事件管理器
   */
  getEventManager(): EventManager;

  /**
   * 事件监听
   */
  on(event: EngineEvent, handler: Function): void;
  off(event: EngineEvent, handler: Function): void;
}

type EngineEvent =
  | 'node:select'
  | 'node:deselect'
  | 'node:modified'    // 拖拽/调整/旋转结束
  | 'node:moving'      // 正在拖拽
  | 'node:resizing'    // 正在调整
  | 'node:rotating';   // 正在旋转
```

### 重绘机制

交互导致节点属性变化时重新渲染：

```typescript
private requestRender(): void {
  // 当前阶段使用全量重绘
  // 后续可在缓存层做增量优化
  this.renderer.render(this.sceneGraph, this.adapter);
  this.renderSelectionOverlay(); // 绘制选中框和控制柄
}
```

---

## CanvasAdapter 新增接口

```typescript
interface CanvasAdapter {
  // ... 现有方法 ...

  /**
   * 获取 Canvas 元素在页面中的位置
   * 用于事件坐标转换为 Canvas 坐标
   *
   * 各平台差异封装：
   * - H5: 返回 getBoundingClientRect()，视口相对坐标
   * - 微信小程序: 返回 boundingClientRect()，页面相对坐标（不含滚动偏移）
   *
   * 返回值为显示坐标（CSS 像素），非物理像素
   */
  getBoundingClientRect(): Promise<{ left: number; top: number; width: number; height: number }>;

  /**
   * 绑定事件监听
   * @returns 解绑函数，调用后移除该监听器
   */
  addEventListener(type: string, handler: Function): () => void;

  /**
   * 获取 Canvas 元素的 DOM/平台引用
   * H5: 返回 HTMLCanvasElement
   * 微信小程序: 返回 canvas 节点对象（用于 createImage 等操作）
   */
  getCanvasElement(): any;
}
```

> **H5Adapter** 已有 `getCanvasElement()` 方法，只需在接口层补充声明。
> **WechatAdapter** 需要新增这三个方法。`addEventListener` 在微信小程序中对应 `canvas.addEventListener()`（新版 Canvas 2D API 支持标准事件）。
> **`addEventListener` 必须返回解绑函数**：EventManager 通过调用解绑函数来清理监听，而非手动 `removeEventListener`，以简化平台差异封装。

---

## 目录结构

```
renderer/
├── interaction/                  ← 新增
│   ├── EventManager.ts           # 事件管理器
│   ├── HitTestService.ts         # 命中检测服务
│   ├── InteractionController.ts  # 控制器接口
│   ├── controllers/
│   │   ├── SelectionController.ts  # 选择控制器
│   │   ├── DragController.ts       # 拖拽控制器
│   │   ├── ResizeController.ts     # 调整大小控制器
│   │   └── RotateController.ts     # 旋转控制器
│   └── index.ts
├── engine/
│   ├── CanvasEngine.ts           # 更新：集成事件系统
│   └── ...
├── adapters/
│   ├── CanvasAdapter.ts          # 新增接口定义
│   ├── WechatAdapter.ts          # 实现新增接口
│   ├── H5Adapter.ts              # 实现新增接口
│   └── ...
└── ...
```

---

## 实现优先级（分步实施）

### Step 0: 测试基础设施搭建
- 安装 vitest 测试框架
- 编写 HitTestService 的单元测试用例（先写测试，后写实现）
- 验证 CI 环境下的纯 Node 测试可运行
- 目标：在开始任何实现之前，确保测试基础设施就绪

### Step 1: HitTestService + 数学工具
- 纯数学运算，无需 Canvas 环境
- 支持所有节点类型的命中检测（含 Group 的二级逆变换）
- 在 Step 0 的测试用例基础上实现（TDD 流程）

### Step 2: SelectionController（核心选中逻辑）
- 选中框和控制柄的绘制
- 选择/取消选择状态管理
- 不依赖事件绑定（可通过手动调用测试）

### Step 3: EventManager + Adapter 事件接口
- 事件绑定/解绑
- 坐标转换
- 控制器链分发
- 平台差异封装

### Step 4: DragController
- 拖拽选中节点
- 事件驱动集成测试

### Step 5: ResizeController
- 8 个控制柄的命中检测
- 各方向调整逻辑

### Step 6: RotateController
- 旋转手柄命中检测
- 角度计算和吸附

---

## 创建日期

2026-05-29
