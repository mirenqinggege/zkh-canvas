import type {CanvasAdapter} from './CanvasAdapter';
import type {FontOptions, ImageHandle} from './types';
import {fontOptionsToString} from './types';
import {logger} from '../utils/Logger';

/**
 * 微信小程序 Canvas 2D API 适配器
 * 使用新版 Canvas 2D API (type="2d")
 */
export class WechatAdapter implements CanvasAdapter {
  private canvasId: string;
  private canvas: UniCanvas | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr: number = 1;
  private displayWidth: number = 0;
  private displayHeight: number = 0;
  private imageCache: Map<string, ImageHandle> = new Map();
  private initialized: boolean = false;

  constructor(canvasId: string) {
    this.canvasId = canvasId;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('WechatAdapter 已经初始化');
      return;
    }

    try {
      // 获取 Canvas 实例
      this.canvas = await this.getCanvasInstance();

      if (!this.canvas) {
        throw new Error('无法获取 Canvas 实例');
      }

      // 获取 2D Context
      this.ctx = this.canvas.getContext('2d');

      if (!this.ctx) {
        throw new Error('无法获取 Canvas 2D Context');
      }

      // 记录初始尺寸
      this.displayWidth = this.canvas.width || 300;
      this.displayHeight = this.canvas.height || 300;

      // 检测 DPR
      this.dpr = this.detectDPR();

      // 应用 DPR 缩放
      this.applyDPR();

      this.initialized = true;
      logger.info('WechatAdapter 初始化成功', {
        canvasId: this.canvasId,
        dpr: this.dpr,
        width: this.displayWidth,
        height: this.displayHeight,
      });
    } catch (error) {
      logger.error('WechatAdapter 初始化失败', error);
      throw error;
    }
  }

  destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.imageCache.clear();
    this.initialized = false;
    logger.info('WechatAdapter 已销毁');
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

  setFont(options: FontOptions): void {
    this.ensureContext();
    this.ctx!.font = fontOptionsToString(options);
  }

  // ============ 文本绘制 ============

  fillText(text: string, x: number, y: number): void {
    this.ensureContext();
    this.ctx!.fillText(text, x, y);
  }

  async loadImage(src: string): Promise<ImageHandle> {
    // 检查缓存
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    return new Promise((resolve, reject) => {
      this.ensureCanvas();

      // 微信小程序的 createImage 方法挂载在 canvas 对象上
      // 返回的对象兼容 CanvasImageSource，且有 onload/onerror/src 属性
      const img = this.canvas!.createImage();

      img.onload = () => {
        this.imageCache.set(src, img as ImageHandle);
        logger.debug(`图片加载成功: ${src}`);
        resolve(img as ImageHandle);
      };

      img.onerror = (err: Error) => {
        logger.warn(`图片加载失败: ${src}`, err);
        reject(err);
      };

      img.src = src;
    });
  }

  // ============ 图片绘制 ============

  drawImage(image: ImageHandle, x: number, y: number, w: number, h: number): void {
    this.ensureContext();
    // 微信小程序 Canvas 2D 的 drawImage 接受 createImage 创建的对象
    this.ctx!.drawImage(image as CanvasImageSource, x, y, w, h);
  }

  applyDPR(): void {
    this.ensureCanvas();

    // 物理 Canvas 尺寸 = 显示尺寸 × DPR
    const physicalWidth = Math.floor(this.displayWidth * this.dpr);
    const physicalHeight = Math.floor(this.displayHeight * this.dpr);

    this.canvas!.width = physicalWidth;
    this.canvas!.height = physicalHeight;

    // 缩放 Context 以匹配显示尺寸
    this.ctx!.scale(this.dpr, this.dpr);

    logger.debug(`应用 DPR 缩放: ${this.displayWidth}x${this.displayHeight} -> ${physicalWidth}x${physicalHeight} (DPR: ${this.dpr})`);
  }

  // ============ DPR 支持 ============

  getDPR(): number {
    return this.dpr;
  }

  resize(width: number, height: number): void {
    this.displayWidth = width;
    this.displayHeight = height;

    if (this.initialized) {
      this.applyDPR();
      this.clear();
    }
  }

  // ============ Canvas 尺寸 ============

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
    ctx.arcTo(x + w, y + h, x + w - ry, y + h, ry);
    ctx.lineTo(x + rx, y + h);
    ctx.arcTo(x, y + h, x, y + h - ry, rx);
    ctx.lineTo(x, y + ry);
    ctx.arcTo(x, y, x + rx, y, rx);

    ctx.closePath();
  }

  // ============ 辅助方法 ============

  private ensureCanvas(): void {
    if (!this.canvas) {
      throw new Error('Canvas 未初始化，请先调用 initialize()');
    }
  }

  private ensureContext(): void {
    if (!this.ctx) {
      throw new Error('Context 未初始化，请先调用 initialize()');
    }
  }

  /**
   * 获取 Canvas 实例
   * uni-app 微信小程序使用 uni.createCanvasContext
   */
  private async getCanvasInstance(): Promise<UniCanvas | null> {
    // 使用 uni-app API 获取 canvas
    // 微信小程序新版 Canvas 2D API
    return new Promise((resolve) => {
      uni.createSelectorQuery()
        .select(`#${this.canvasId}`)
        .fields({node: true, size: true})
        .exec((res: SelectorQueryResultItem[]) => {
          if (res && res[0] && res[0].node) {
            const canvas = res[0].node as UniCanvas;
            // 获取实际尺寸
            if (res[0].width) {
              this.displayWidth = res[0].width;
            }
            if (res[0].height) {
              this.displayHeight = res[0].height;
            }
            resolve(canvas);
          } else {
            resolve(null);
          }
        });
    });
  }

  /**
   * 检测设备 DPR
   */
  private detectDPR(): number {
    try {
      const systemInfo = uni.getSystemInfoSync();
      return systemInfo.pixelRatio || 1;
    } catch {
      logger.warn('无法获取系统信息，使用默认 DPR = 1');
      return 1;
    }
  }
}

// UniCanvas 类型已在 types/uni-canvas.d.ts 中定义
