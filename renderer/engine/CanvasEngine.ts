import type {FabricExportJSON, RenderResult, CardTemplateJSON} from '../types';
import type {CanvasAdapter} from '../adapters/CanvasAdapter';
import type {SceneGraph} from '../scene/SceneGraph';
import {FabricParser} from '../parser/FabricParser';
import {CardParser} from '../parser/CardParser';
import {SceneRenderer} from '../renderer/SceneRenderer';
import {ImagePreloader} from './ImagePreloader';
import {logger} from '../utils/Logger';
import {EventManager} from '../interaction/EventManager';
import {HitTestService} from '../interaction/HitTestService';
import {SelectionController} from '../interaction/controllers/SelectionController';
import {DragController} from '../interaction/controllers/DragController';
import {ResizeController} from '../interaction/controllers/ResizeController';
import {RotateController} from '../interaction/controllers/RotateController';
import {SelectionOverlayRenderer} from '../interaction/SelectionOverlayRenderer';

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

  // 交互系统属性
  private eventManager: EventManager | null = null;
  private hitTestService: HitTestService | null = null;
  private selectionController: SelectionController | null = null;
  private dragController: DragController | null = null;
  private resizeController: ResizeController | null = null;
  private rotateController: RotateController | null = null;
  private selectionOverlayRenderer: SelectionOverlayRenderer | null = null;

  /** 当前场景图（用于交互重绘） */
  private currentGraph: SceneGraph | null = null;

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
    this.currentGraph = graph;

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
    this.currentGraph = graph;

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
    // 先清理事件系统
    this.disableInteraction();
    // 再销毁适配器
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

  // ============ 交互系统 ============

  /**
   * 启用交互（需在 render() 之后调用）
   */
  enableInteraction(): void {
    if (!this.currentGraph) {
      logger.warn('请先调用 render() 再启用交互');
      return;
    }

    const graph = this.currentGraph;

    this.hitTestService = new HitTestService();
    this.selectionController = new SelectionController(this.hitTestService, graph);
    this.dragController = new DragController(this.hitTestService, graph, this.selectionController);
    this.resizeController = new ResizeController(graph, this.selectionController);
    this.rotateController = new RotateController(graph, this.selectionController);
    this.selectionOverlayRenderer = new SelectionOverlayRenderer(
      this.adapter,
      this.selectionController,
      graph,
      this.resizeController,
      this.rotateController
    );

    this.eventManager = new EventManager(this.adapter, this.hitTestService, this.renderer);

    // 注册控制器（优先级从高到低）
    this.eventManager.addController(this.rotateController);
    this.eventManager.addController(this.resizeController);
    this.eventManager.addController(this.dragController);
    this.eventManager.addController(this.selectionController);

    // 修改回调 → 触发重绘
    const requestReRender = () => this.reRender();
    this.dragController.onModify(requestReRender);
    this.resizeController.onModify(requestReRender);
    this.rotateController.onModify(requestReRender);

    // 选中变化 → 触发重绘（显示/隐藏选中框和控制柄）
    this.selectionController.onChange(() => this.reRender());

    this.eventManager.attach();
    logger.info('交互已启用');
  }

  /**
   * 禁用交互
   */
  disableInteraction(): void {
    this.eventManager?.detach();
    this.eventManager = null;
    this.hitTestService = null;
    this.selectionController = null;
    this.dragController = null;
    this.resizeController = null;
    this.rotateController = null;
    this.selectionOverlayRenderer = null;
  }

  /**
   * 触发重绘（交互修改后调用）
   */
  private reRender(): void {
    if (!this.currentGraph) return;
    this.renderer.render(this.currentGraph, this.adapter);
    this.selectionOverlayRenderer?.render();
  }

  /**
   * 获取事件管理器
   */
  getEventManager(): EventManager | null {
    return this.eventManager;
  }

  /**
   * 获取选择控制器
   */
  getSelectionController(): SelectionController | null {
    return this.selectionController;
  }
}
