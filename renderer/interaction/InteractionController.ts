import type {SceneNode} from '../scene/SceneNode';

/**
 * 控制器接口
 * 所有交互控制器必须实现此接口
 */
export interface InteractionController {
  /** 控制器名称（唯一标识） */
  name: string;
  /** 是否正在交互中 */
  active: boolean;
  /** 处理 pointerdown，返回 true 表示消费了该事件，后续控制器不再处理 */
  onPointerDown(x: number, y: number, nativeEvent: any): boolean;
  /** 处理 pointermove */
  onPointerMove(x: number, y: number, nativeEvent: any): void;
  /** 处理 pointerup */
  onPointerUp(x: number, y: number, nativeEvent: any): void;
  /** 取消当前交互 */
  cancel(): void;
}

/** 选择变化回调 */
export type SelectionCallback = (selectedIds: string[]) => void;
/** 节点修改回调 */
export type ModifyCallback = (nodeId: string, changes: Partial<SceneNode>) => void;
