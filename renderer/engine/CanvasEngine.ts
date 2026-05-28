import type {FabricExportJSON, RenderResult, CardTemplateJSON} from '../types';
import type {CanvasAdapter} from '../adapters/CanvasAdapter';
import {FabricParser} from '../parser/FabricParser';
import {CardParser} from '../parser/CardParser';
import {SceneRenderer} from '../renderer/SceneRenderer';
import {ImagePreloader} from './ImagePreloader';
import {logger} from '../utils/Logger';

/**
 * Canvas 渲染引擎配置
 */
export interface CanvasEngineConfig {
  /** 是否启用调试日志 */
  debug?: boolean;
}

/**
 * Canvas 渲染引擎
 * 整合 Parser、Renderer、Adapter 的完整渲染流程
 */
export class CanvasEngine {
  private adapter: CanvasAdapter;
  private fabricParser: FabricParser;
  private cardParser: CardParser;
  private renderer: SceneRenderer;
  private preloader: ImagePreloader;
  private config: CanvasEngineConfig;

  constructor(adapter: CanvasAdapter, config?: CanvasEngineConfig) {
    this.adapter = adapter;
    this.fabricParser = new FabricParser();
    this.cardParser = new CardParser();
    this.renderer = new SceneRenderer();
    this.preloader = new ImagePreloader(adapter);
    this.config = config || {};

    // 配置日志级别
    if (this.config.debug) {
      logger.setLevel('debug');
    }
  }

  /**
   * 初始化引擎
   */
  async initialize(): Promise<void> {
    logger.info('初始化 CanvasEngine');
    await this.adapter.initialize();
    logger.info('CanvasEngine 初始化完成');
  }

  /**
   * 渲染 Fabric JSON
   */
  async render(json: FabricExportJSON): Promise<RenderResult> {
    logger.info('开始渲染流程 (Fabric JSON)');

    // 0. 根据 JSON 设置 Canvas 尺寸
    if (json.width && json.height) {
      logger.debug('根据 JSON 设置 Canvas 尺寸', {width: json.width, height: json.height});
      this.resize(json.width, json.height);
    }

    // 1. 解析 JSON
    const graph = this.fabricParser.parse(json);

    // 2. 预加载图片
    const loadResult = await this.preloader.preload(graph);

    // 3. 执行渲染
    this.renderer.render(graph, this.adapter);

    // 4. 返回结果
    const result: RenderResult = {
      success: loadResult.failed.length === 0,
      loadedImages: loadResult.loaded,
      failedImages: loadResult.failed,
    };

    logger.info('渲染流程完成', {success: result.success});

    return result;
  }

  /**
   * 渲染名片模板 JSON
   */
  async renderCard(json: CardTemplateJSON): Promise<RenderResult> {
    logger.info('开始渲染流程 (Card Template JSON)');

    // 0. 根据 JSON 设置 Canvas 尺寸
    if (json.size?.width && json.size?.height) {
      logger.debug('根据 JSON 设置 Canvas 尺寸', {width: json.size.width, height: json.size.height});
      this.resize(json.size.width, json.size.height);
    }

    // 1. 解析 JSON
    const graph = this.cardParser.parse(json);

    // 2. 预加载图片
    const loadResult = await this.preloader.preload(graph);

    // 3. 执行渲染
    this.renderer.render(graph, this.adapter);

    // 4. 返回结果
    const result: RenderResult = {
      success: loadResult.failed.length === 0,
      loadedImages: loadResult.loaded,
      failedImages: loadResult.failed,
    };

    logger.info('渲染流程完成', {success: result.success});

    return result;
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    logger.info('销毁 CanvasEngine');
    this.adapter.destroy();
  }

  /**
   * 设置 Canvas 尺寸
   */
  resize(width: number, height: number): void {
    this.adapter.resize(width, height);
  }

  /**
   * 获取适配器
   */
  getAdapter(): CanvasAdapter {
    return this.adapter;
  }

  /**
   * 获取渲染器
   */
  getRenderer(): SceneRenderer {
    return this.renderer;
  }

  /**
   * 获取 Fabric 解析器
   */
  getParser(): FabricParser {
    return this.fabricParser;
  }

  /**
   * 获取名片模板解析器
   */
  getCardParser(): CardParser {
    return this.cardParser;
  }
}
