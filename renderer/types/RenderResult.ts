/**
 * 渲染结果类型
 */

/**
 * 图片加载失败信息
 */
export interface ImageLoadError {
  id: string;
  src: string;
  error: Error | string;
}

/**
 * 图片加载结果
 */
export interface ImageLoadResult {
  loaded: string[];
  failed: ImageLoadError[];
}

/**
 * 渲染结果
 */
export interface RenderResult {
  success: boolean;
  loadedImages: string[];
  failedImages: ImageLoadError[];
}

/**
 * 引擎初始化结果
 */
export interface EngineInitResult {
  success: boolean;
  error?: Error;
}