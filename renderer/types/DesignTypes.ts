/**
 * 通用设计稿序列化格式类型定义
 * 引擎原生存储/加载格式
 */

export interface DesignJSON {
  version: string;
  width: number;
  height: number;
  nodes: DesignNode[];
}

export type DesignNode = DesignRect | DesignCircle | DesignText | DesignImage | DesignGroup;

export interface DesignNodeBase {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  clip?: { type: 'circle' | 'rect'; radius?: number; rx?: number; ry?: number };

  /** 是否锁定 */
  locked?: boolean;
}

export interface DesignRect extends DesignNodeBase {
  type: 'rect';
  rx?: number;
  ry?: number;
}

export interface DesignCircle extends DesignNodeBase {
  type: 'circle';
}

export interface DesignText extends DesignNodeBase {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  fontStyle: 'normal' | 'italic' | 'oblique';
  textAlign: 'left' | 'center' | 'right';
  textBaseline?: 'top' | 'center' | 'bottom';
}

export interface DesignImage extends DesignNodeBase {
  type: 'image';
  src: string;
  fillMode?: 'fill' | 'cover' | 'contain';
}

export interface DesignGroup extends DesignNodeBase {
  type: 'group';
  children: DesignNode[];
}
