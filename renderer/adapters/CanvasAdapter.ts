import type {ImageHandle} from './types/ImageHandle';
import type {FontOptions} from './types/FontOptions';

/**
 * Canvas 适配器接口
 * 所有平台差异通过此接口抽象
 */
export interface CanvasAdapter {
  // ============ 生命周期 ============

  /**
   * 初始化适配器
   * 获取 Canvas 实例、Context、检测 DPR
   */
  initialize(): Promise<void>;

  /**
   * 销毁适配器
   * 清理资源
   */
  destroy(): void;

  // ============ Context 状态管理 ============

  /**
   * 保存当前 Context 状态
   */
  save(): void;

  /**
   * 恢复上次保存的 Context 状态
   */
  restore(): void;

  // ============ Transform 操作 ============

  /**
   * 平移
   */
  translate(x: number, y: number): void;

  /**
   * 旋转（弧度）
   */
  rotate(rad: number): void;

  /**
   * 缩放
   */
  scale(x: number, y: number): void;

  // ============ 样式设置 ============

  /**
   * 设置填充颜色
   */
  setFillStyle(color: string): void;

  /**
   * 设置描边颜色
   */
  setStrokeStyle(color: string): void;

  /**
   * 设置线条宽度
   */
  setLineWidth(width: number): void;

  /**
   * 设置全局透明度
   */
  setGlobalAlpha(alpha: number): void;

  // ============ 绘制基础图形 ============

  /**
   * 填充矩形
   */
  fillRect(x: number, y: number, w: number, h: number): void;

  /**
   * 描边矩形
   */
  strokeRect(x: number, y: number, w: number, h: number): void;

  /**
   * 填充圆形
   */
  fillCircle(cx: number, cy: number, radius: number): void;

  /**
   * 描边圆形
   */
  strokeCircle(cx: number, cy: number, radius: number): void;

  // ============ 圆角矩形 ============

  /**
   * 填充圆角矩形
   */
  fillRoundRect(x: number, y: number, w: number, h: number, rx: number, ry: number): void;

  /**
   * 描边圆角矩形
   */
  strokeRoundRect(x: number, y: number, w: number, h: number, rx: number, ry: number): void;

  // ============ 裁剪路径 ============

  /**
   * 创建圆形裁剪路径
   */
  clipCircle(cx: number, cy: number, radius: number): void;

  /**
   * 创建圆角矩形裁剪路径
   */
  clipRoundRect(x: number, y: number, w: number, h: number, rx: number, ry: number): void;

  // ============ 文本绘制 ============

  /**
   * 设置字体
   */
  setFont(options: FontOptions): void;

  /**
   * 填充文本
   */
  fillText(text: string, x: number, y: number): void;

  // ============ 图片绘制 ============

  /**
   * 加载图片（异步）
   * 返回平台无关的 ImageHandle
   */
  loadImage(src: string): Promise<ImageHandle>;

  /**
   * 获取图片原始宽度
   */
  getImageWidth(image: ImageHandle): number;

  /**
   * 获取图片原始高度
   */
  getImageHeight(image: ImageHandle): number;

  /**
   * 绘制图片
   */
  drawImage(image: ImageHandle, x: number, y: number, w: number, h: number): void;

  // ============ DPR 支持 ============

  /**
   * 应用 DPR 缩放
   * 设置 Canvas 物理尺寸并缩放 Context
   */
  applyDPR(): void;

  /**
   * 获取当前 DPR
   */
  getDPR(): number;

  // ============ Canvas 尺寸 ============

  /**
   * 设置 Canvas 尺寸
   */
  resize(width: number, height: number): void;

  /**
   * 获取 Canvas 显示宽度
   */
  getWidth(): number;

  /**
   * 获取 Canvas 显示高度
   */
  getHeight(): number;

  /**
   * 清空 Canvas
   */
  clear(): void;

  // ============ 事件支持 ============

  /**
   * 绑定事件监听
   * @param type 事件类型 (如 'touchstart', 'mousedown')
   * @param handler 事件处理函数
   * @returns 解绑函数
   */
  addEventListener?(type: string, handler: Function): () => void;

  /**
   * 获取 Canvas 元素在页面中的位置
   * 用于将原生事件坐标转换为 Canvas 显示坐标
   */
  getBoundingClientRect?(): Promise<{ left: number; top: number; width: number; height: number }>;

  /**
   * 判断适配器是否支持事件绑定
   */
  supportsEvents(): boolean;
}
