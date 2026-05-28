/**
 * uni-app 新版 Canvas 2D API 类型补充
 * 扩展官方 @types/uni-app 的类型定义
 */

import 'uni-app';

declare global {
  /**
   * 扩展 NodeField，添加新版 Canvas 2D API 的 node 字段
   */
  interface NodeField {
    /** 是否返回节点实例（Canvas 2D API） */
    node?: boolean;
    /** 是否返回节点尺寸 */
    size?: boolean;
    /** 是否返回节点宽度 */
    width?: boolean;
    /** 是否返回节点高度 */
    height?: boolean;
  }

  /**
   * 选择器查询结果项（新版 Canvas 2D API）
   */
  interface SelectorQueryResultItem {
    /** Canvas 节点实例 */
    node?: UniCanvas | null;
    /** 节点宽度 */
    width?: number;
    /** 节点高度 */
    height?: number;
    /** 节点 ID */
    id?: string;
    /** 节点数据集 */
    dataset?: Record<string, unknown>;
  }

  /**
   * 扩展 SelectorQuery，修正 exec 回调参数类型
   */
  interface SelectorQuery {
    /**
     * 执行查询
     * @param callback 回调函数，返回查询结果数组
     */
    exec(callback?: (res: SelectorQueryResultItem[]) => void): void;
  }

  /**
   * uni-app Canvas 2D 实例类型
   * 微信小程序新版 Canvas 2D API
   * 注意：createImage 返回的对象兼容 DOM CanvasImageSource
   */
  interface UniCanvas {
    /** Canvas 宽度 */
    width: number;
    /** Canvas 高度 */
    height: number;

    /** 获取 Canvas 2D Context */
    getContext(contextType: '2d'): CanvasRenderingContext2D | null;

    /** 创建图片对象（兼容 CanvasImageSource） */
    createImage(): CanvasImageSource & {
      /** 图片源 */
      src: string;
      /** 加载完成回调 */
      onload?: (() => void) | null;
      /** 加载失败回调 */
      onerror?: ((err: Error) => void) | null;
    };
  }

  /**
   * 扩展系统信息，确保 pixelRatio 存在
   */
  interface SystemInfo {
    /** 设备像素比 */
    pixelRatio: number;
  }
}

export {};
