import type {FabricClipPath} from '../../types/FabricTypes';

export interface ClipInfo {
  type: 'circle' | 'rect';
  radius?: number;
  rx?: number;
  ry?: number;
}

/**
 * 解析 Fabric clipPath 为统一的 ClipInfo 格式
 */
export function parseClipPath(
  clipPath: FabricClipPath | undefined,
): ClipInfo | undefined {
  if (!clipPath) return undefined;

  if (clipPath.type === 'circle') {
    // 不给 radius 就存 {type:'circle'}，渲染时从节点当前尺寸实时计算
    if (clipPath.radius != null) {
      return {type: 'circle', radius: clipPath.radius};
    }
    return {type: 'circle'};
  }

  if (clipPath.type === 'rect') {
    return {
      type: 'rect',
      rx: clipPath.rx ?? 0,
      ry: clipPath.ry ?? 0,
    };
  }

  return undefined;
}
