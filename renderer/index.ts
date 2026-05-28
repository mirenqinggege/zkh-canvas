// 引擎入口
export { CanvasEngine } from './engine/CanvasEngine';
export type { CanvasEngineConfig } from './engine/CanvasEngine';

// 解析器
export { FabricParser } from './parser/FabricParser';
export { TransformConverter } from './parser/TransformConverter';

// 场景图
export { SceneGraph } from './scene/SceneGraph';
export type { SceneNode } from './scene/SceneNode';
export type { RectNode } from './scene/nodes/RectNode';
export type { CircleNode } from './scene/nodes/CircleNode';
export type { TextNode } from './scene/nodes/TextNode';
export type { ImageNode } from './scene/nodes/ImageNode';
export type { GroupNode } from './scene/nodes/GroupNode';
export { createRectNode } from './scene/nodes/RectNode';
export { createCircleNode } from './scene/nodes/CircleNode';
export { createTextNode } from './scene/nodes/TextNode';
export { createImageNode } from './scene/nodes/ImageNode';
export { createGroupNode } from './scene/nodes/GroupNode';

// 渲染器
export { SceneRenderer } from './renderer/SceneRenderer';
export type { NodeRenderer } from './renderer/NodeRenderer';

// 适配器
export type { CanvasAdapter } from './adapters/CanvasAdapter';
export { WechatAdapter } from './adapters/WechatAdapter';
export type { ImageHandle } from './adapters/types/ImageHandle';
export type { FontOptions } from './adapters/types/FontOptions';

// 类型定义
export type { NodeType } from './types/NodeType';
export type { FabricExportJSON, FabricObject, FabricRect, FabricCircle, FabricText, FabricImage, FabricGroup } from './types/FabricTypes';
export type { RenderResult, ImageLoadError, ImageLoadResult } from './types/RenderResult';
export { SUPPORTED_NODE_TYPES, isSupportedNodeType } from './types/NodeType';

// 工具函数
export { logger } from './utils/Logger';
export { normalizeColor, isValidColor } from './utils/ColorParser';
export { degToRad, radToDeg, clamp } from './utils/MathUtils';