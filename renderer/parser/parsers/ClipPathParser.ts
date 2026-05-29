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
  nodeWidth: number,
  nodeHeight: number
): ClipInfo | undefined {
  if (!clipPath) return undefined;

  if (clipPath.type === 'circle') {
    const radius = clipPath.radius ?? Math.min(nodeWidth, nodeHeight) / 2;
    return {type: 'circle', radius};
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
