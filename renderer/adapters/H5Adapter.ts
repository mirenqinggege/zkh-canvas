import type { CanvasAdapter } from './CanvasAdapter';
import type { ImageHandle, FontOptions } from './types';
import { fontOptionsToString } from './types';
import { logger } from '../utils/Logger';

/**
 * H5/浏览器 Canvas 2D API 适配器
 * 使用标准 HTML Canvas API
 */
export class H5Adapter implements CanvasAdapter {
  private canvasElement: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr: number = 1;
  private displayWidth: number = 0;
  private displayHeight: number = 0;
  private imageCache: Map<string, ImageHandle> = new Map();
  private initialized: boolean = false;

  /**
   * 创建 H5 适配器
   * @param canvasElement HTML Canvas 元素
   */
  constructor(canvasElement: HTMLCanvasElement) {
    this.canvasElement = canvasElement;
  }

  /**
   * 通过 canvas ID 创建适配器
   * @param canvasId Canvas 元素的 ID
   */
  static fromId(canvasId: string): H5Adapter {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas 元素不存在: ${canvasId}`);
    }
    return new H5Adapter(canvas);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('H5Adapter 已经初始化');
      return;
    }

    try {
      // 获取 2D Context
      this.ctx = this.canvasElement.getContext('2d');

      if (!this.ctx) {
        throw new Error('无法获取 Canvas 2D Context');
      }

      // 记录初始尺寸
      this.displayWidth = this.canvasElement.clientWidth || this.canvasElement.width;
      this.displayHeight = this.canvasElement.clientHeight || this.canvasElement.height;

      // 检测 DPR
      this.dpr = this.detectDPR();

      // 应用 DPR 缩放
      this.applyDPR();

      this.initialized = true;
      logger.info('H5Adapter 初始化成功', {
        dpr: this.dpr,
        width: this.displayWidth,
        height: this.displayHeight,
      });
    } catch (error) {
      logger.error('H5Adapter 初始化失败', error);
      throw error;
    }
  }

  destroy(): void {
    this.ctx = null;
    this.imageCache.clear();
    this.initialized = false;
    logger.info('H5Adapter 已销毁');
  }

  // ============ Context 状态管理 ============

  save(): void {
    this.ensureContext();
    this.ctx!.save();
  }

  restore(): void {
    this.ensureContext();
    this.ctx!.restore();
  }

  // ============ Transform 操作 ============

  translate(x: number, y: number): void {
    this.ensureContext();
    this.ctx!.translate(x, y);
  }

  rotate(rad: number): void {
    this.ensureContext();
    this.ctx!.rotate(rad);
  }

  scale(x: number, y: number): void {
    this.ensureContext();
    this.ctx!.scale(x, y);
  }

  // ============ 样式设置 ============

  setFillStyle(color: string): void {
    this.ensureContext();
    this.ctx!.fillStyle = color;
  }

  setStrokeStyle(color: string): void {
    this.ensureContext();
    this.ctx!.strokeStyle = color;
  }

  setLineWidth(width: number): void {
    this.ensureContext();
    this.ctx!.lineWidth = width;
  }

  setGlobalAlpha(alpha: number): void {
    this.ensureContext();
    this.ctx!.globalAlpha = Math.max(0, Math.min(1, alpha));
  }

  // ============ 绘制基础图形 ============

  fillRect(x: number, y: number, w: number, h: number): void {
    this.ensureContext();
    this.ctx!.fillRect(x, y, w, h);
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this.ensureContext();
    this.ctx!.strokeRect(x, y, w, h);
  }

  fillCircle(cx: number, cy: number, radius: number): void {
    this.ensureContext();
    this.ctx!.beginPath();
    this.ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx!.fill();
  }

  strokeCircle(cx: number, cy: number, radius: number): void {
    this.ensureContext();
    this.ctx!.beginPath();
    this.ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx!.stroke();
  }

  // ============ 圆角矩形 ============

  fillRoundRect(x: number, y: number, w: number, h: number, rx: number, ry: number): void {
    this.ensureContext();
    this.drawRoundRectPath(x, y, w, h, rx, ry);
    this.ctx!.fill();
  }

  strokeRoundRect(x: number, y: number, w: number, h: number, rx: number, ry: number): void {
    this.ensureContext();
    this.drawRoundRectPath(x, y, w, h, rx, ry);
    this.ctx!.stroke();
  }

  private drawRoundRectPath(x: number, y: number, w: number, h: number, rx: number, ry: number): void {
    const ctx = this.ctx!;
    ctx.beginPath();

    // 确保圆角不超过矩形尺寸的一半
    rx = Math.min(rx, w / 2);
    ry = Math.min(ry, h / 2);

    // 绘制圆角矩形路径
    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + w - rx, y);
    ctx.arcTo(x + w, y, x + w, y + ry, rx);
    ctx.lineTo(x + w, y + h - ry);
    ctx.arcTo(x + w, y + h, x + w - rx, y + h, ry);
    ctx.lineTo(x + rx, y + h);
    ctx.arcTo(x, y + h, x, y + h - ry, rx);
    ctx.lineTo(x, y + ry);
    ctx.arcTo(x, y, x + rx, y, rx);

    ctx.closePath();
  }

  // ============ 裁剪路径 ============

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

  // ============ 文本绘制 ============

  setFont(options: FontOptions): void {
    this.ensureContext();
    this.ctx!.font = fontOptionsToString(options);
    // 设置文本基线为 top，便于定位
    this.ctx!.textBaseline = 'top';
  }

  fillText(text: string, x: number, y: number): void {
    this.ensureContext();
    this.ctx!.fillText(text, x, y);
  }

  // ============ 图片绘制 ============

  async loadImage(src: string): Promise<ImageHandle> {
    // 检查缓存
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.imageCache.set(src, img as ImageHandle);
        logger.debug(`图片加载成功: ${src}`);
        resolve(img as ImageHandle);
      };

      img.onerror = (event: Event | string) => {
        const err = new Error(`图片加载失败: ${src}`);
        logger.warn(`图片加载失败: ${src}`, event);
        reject(err);
      };

      // 处理跨域图片
      // 如果是跨域图片，可以设置 crossOrigin
      img.src = src;
    });
  }

  drawImage(image: ImageHandle, x: number, y: number, w: number, h: number): void {
    this.ensureContext();
    this.ctx!.drawImage(image as CanvasImageSource, x, y, w, h);
  }

  // ============ DPR 支持 ============

  applyDPR(): void {
    if (!this.canvasElement) {
      throw new Error('Canvas 元素未初始化');
    }

    // 物理 Canvas 尺寸 = 显示尺寸 × DPR
    const physicalWidth = Math.floor(this.displayWidth * this.dpr);
    const physicalHeight = Math.floor(this.displayHeight * this.dpr);

    this.canvasElement.width = physicalWidth;
    this.canvasElement.height = physicalHeight;

    // 通过 CSS 设置显示尺寸
    this.canvasElement.style.width = `${this.displayWidth}px`;
    this.canvasElement.style.height = `${this.displayHeight}px`;

    // 缩放 Context 以匹配显示尺寸
    if (this.ctx) {
      this.ctx.scale(this.dpr, this.dpr);
    }

    logger.debug(`应用 DPR 缩放: ${this.displayWidth}x${this.displayHeight} -> ${physicalWidth}x${physicalHeight} (DPR: ${this.dpr})`);
  }

  getDPR(): number {
    return this.dpr;
  }

  // ============ Canvas 尺寸 ============

  resize(width: number, height: number): void {
    this.displayWidth = width;
    this.displayHeight = height;

    if (this.initialized) {
      this.applyDPR();
      this.clear();
    }
  }

  getWidth(): number {
    return this.displayWidth;
  }

  getHeight(): number {
    return this.displayHeight;
  }

  clear(): void {
    this.ensureContext();
    this.ctx!.clearRect(0, 0, this.displayWidth, this.displayHeight);
  }

  // ============ 辅助方法 ============

  private ensureContext(): void {
    if (!this.ctx) {
      throw new Error('Context 未初始化，请先调用 initialize()');
    }
  }

  /**
   * 检测设备 DPR
   */
  private detectDPR(): number {
    if (typeof window !== 'undefined' && window.devicePixelRatio) {
      return window.devicePixelRatio;
    }
    logger.warn('无法获取 devicePixelRatio，使用默认 DPR = 1');
    return 1;
  }

  /**
   * 获取 Canvas 元素
   */
  getCanvasElement(): HTMLCanvasElement {
    return this.canvasElement;
  }

  /**
   * 获取 Context
   */
  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }
}