import type {CanvasAdapter} from '../adapters/CanvasAdapter';
import type {SceneRenderer} from '../renderer/SceneRenderer';
import type {InteractionController} from './InteractionController';
import {HitTestService} from './HitTestService';
import {logger} from '../utils/Logger';

/**
 * 事件管理器
 * 职责：
 * 1. 管理控制器注册和优先级链
 * 2. 统一 pointerdown/move/up 事件分发
 * 3. 键盘修饰键追踪（H5）
 */
export class EventManager {
  private adapter: CanvasAdapter;
  private controllers: InteractionController[] = [];
  private attached = false;

  /** 修饰键状态 */
  private modifiers = {
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  };

  constructor(
    adapter: CanvasAdapter,
    _hitTestService: HitTestService,
    _renderer: SceneRenderer
  ) {
    this.adapter = adapter;
  }

  /**
   * 启动事件监听
   */
  attach(): void {
    if (this.attached) return;
    this.attached = true;

    if (!this.adapter.supportsEvents()) {
      logger.warn('当前适配器不支持事件绑定');
      return;
    }

    // H5: 绑定键盘修饰键追踪
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyChange);
      window.addEventListener('keyup', this.handleKeyChange);
    }

    logger.info('EventManager 已启动');
  }

  /**
   * 停止事件监听
   */
  detach(): void {
    if (!this.attached) return;

    // 取消所有进行中的交互
    for (const ctrl of this.controllers) {
      if (ctrl.active) ctrl.cancel();
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyChange);
      window.removeEventListener('keyup', this.handleKeyChange);
    }

    this.attached = false;
    logger.info('EventManager 已停止');
  }

  /**
   * 注册控制器（先注册的优先级高）
   */
  addController(controller: InteractionController): void {
    this.controllers.push(controller);
  }

  /**
   * 移除控制器
   */
  removeController(name: string): void {
    const idx = this.controllers.findIndex(c => c.name === name);
    if (idx === -1) return;
    const ctrl = this.controllers[idx];
    if (ctrl.active) ctrl.cancel();
    this.controllers.splice(idx, 1);
  }

  /**
   * 移除所有控制器
   */
  removeAllControllers(): void {
    for (const ctrl of this.controllers) {
      if (ctrl.active) ctrl.cancel();
    }
    this.controllers.length = 0;
  }

  /**
   * 分发 pointerdown 事件
   * 按控制器注册顺序（优先级从高到低）分发
   */
  dispatchPointerDown(x: number, y: number, nativeEvent: any): void {
    for (const ctrl of this.controllers) {
      if (ctrl.onPointerDown(x, y, nativeEvent)) return;
    }
  }

  /**
   * 分发 pointermove 事件
   * 只分发到当前活跃的控制器
   */
  dispatchPointerMove(x: number, y: number, nativeEvent: any): void {
    for (const ctrl of this.controllers) {
      if (ctrl.active) {
        ctrl.onPointerMove(x, y, nativeEvent);
      }
    }
  }

  /**
   * 分发 pointerup 事件
   * 只分发到当前活跃的控制器
   */
  dispatchPointerUp(x: number, y: number, nativeEvent: any): void {
    for (const ctrl of this.controllers) {
      if (ctrl.active) {
        ctrl.onPointerUp(x, y, nativeEvent);
      }
    }
  }

  /**
   * 获取当前修饰键状态
   */
  getModifiers(): { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean } {
    return { ...this.modifiers };
  }

  private handleKeyChange = (e: KeyboardEvent): void => {
    this.modifiers.shiftKey = e.shiftKey;
    this.modifiers.altKey = e.altKey;
    this.modifiers.ctrlKey = e.ctrlKey;
    this.modifiers.metaKey = e.metaKey;
  };
}
