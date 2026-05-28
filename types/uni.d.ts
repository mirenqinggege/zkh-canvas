/**
 * uni-app 全局类型定义
 */

declare global {
  /**
   * uni-app 全局对象
   */
  const uni: UniNamespace;

  /**
   * Canvas 2D Context 类型扩展
   */
  interface CanvasRenderingContext2D {
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    lineWidth: number;
    globalAlpha: number;
    font: string;

    save(): void;
    restore(): void;
    translate(x: number, y: number): void;
    rotate(angle: number): void;
    scale(x: number, y: number): void;

    beginPath(): void;
    closePath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;

    fill(): void;
    stroke(): void;
    fillRect(x: number, y: number, width: number, height: number): void;
    strokeRect(x: number, y: number, width: number, height: number): void;
    clearRect(x: number, y: number, width: number, height: number): void;

    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): TextMetrics;

    drawImage(image: CanvasImageSource, dx: number, dy: number): void;
    drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
    drawImage(image: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  }

  /**
   * Canvas 图像源类型
   */
  type CanvasImageSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap;

  /**
   * Console 类型扩展
   */
  interface Console {
    log(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
  }

  const console: Console;
}

/**
 * uni-app API 命名空间
 */
interface UniNamespace {
  /**
   * 创建选择器查询
   */
  createSelectorQuery(): SelectorQuery;

  /**
   * 获取系统信息
   */
  getSystemInfoSync(): SystemInfo;
}

/**
 * 选择器查询结果项
 */
interface SelectorQueryResultItem {
  node?: unknown;
  width?: number;
  height?: number;
  id?: string;
  dataset?: Record<string, unknown>;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}

/**
 * 选择器查询
 */
interface SelectorQuery {
  select(selector: string): NodesRef;
  fields(fields: Fields, callback?: (res: unknown) => void): SelectorQuery;
  exec(callback: (res: SelectorQueryResultItem[]) => void): void;
}

/**
 * 节点引用
 */
interface NodesRef {
  fields(fields: Fields): SelectorQuery;
}

/**
 * 字段配置
 */
interface Fields {
  node?: boolean;
  size?: boolean;
  width?: boolean;
  height?: boolean;
  id?: boolean;
  dataset?: boolean;
  rect?: boolean;
  scrollTop?: boolean;
}

/**
 * 系统信息
 */
interface SystemInfo {
  pixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  platform: string;
  model: string;
  system: string;
  brand: string;
  fontSizeSetting: number;
  SDKVersion: string;
  appVersion: string;
  appVersionCode: string;
  appWgtVersion: string;
}

export {};