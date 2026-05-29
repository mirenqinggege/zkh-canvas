/**
 * 节点 ID 生成器
 * 确保在单次解析中生成的 ID 不重复
 */

let counter = 0;

/**
 * 生成唯一节点 ID
 * @param type 节点类型
 * @param existingId 已有 ID（如果对象已有 ID 则使用原 ID）
 */
export function generateNodeId(type: string, existingId?: string): string {
  if (existingId) return existingId;
  return `${type}-${Date.now()}-${++counter}`;
}
