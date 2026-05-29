import { describe, it, expect } from 'vitest';
import type { DesignJSON, DesignRect } from '../../../renderer/types/DesignTypes';

describe('DesignTypes', () => {
  it('DesignJSON 结构正确', () => {
    const json: DesignJSON = {
      version: '1.0',
      width: 800,
      height: 600,
      nodes: [],
    };
    expect(json.version).toBe('1.0');
  });

  it('DesignRect 包含完整字段', () => {
    const node: DesignRect = {
      id: 'r1', type: 'rect',
      x: 10, y: 20, width: 100, height: 50,
      rotation: 0, scaleX: 1, scaleY: 1,
      fill: '#ff0000', stroke: null, strokeWidth: 1,
      opacity: 1, visible: true,
      rx: 8, ry: 8,
    };
    expect(node.type).toBe('rect');
    expect(node.rx).toBe(8);
  });
});
