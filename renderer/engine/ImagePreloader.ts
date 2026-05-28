import type {SceneGraph} from '../scene/SceneGraph';
import type {ImageNode} from '../scene/nodes/ImageNode';
import type {CanvasAdapter} from '../adapters/CanvasAdapter';
import type {ImageLoadError, ImageLoadResult} from '../types/RenderResult';
import {logger} from '../utils/Logger';

/**
 * 图片预加载器
 * 渲染前统一加载所有图片
 */
export class ImagePreloader {
  private adapter: CanvasAdapter;

  constructor(adapter: CanvasAdapter) {
    this.adapter = adapter;
  }

  /**
   * 预加载场景图中的所有图片
   */
  async preload(graph: SceneGraph): Promise<ImageLoadResult> {
    const imageNodes = this.collectImageNodes(graph);
    const result: ImageLoadResult = {
      loaded: [],
      failed: [],
    };

    if (imageNodes.length === 0) {
      logger.info('没有需要加载的图片');
      return result;
    }

    logger.info(`开始预加载 ${imageNodes.length} 张图片`);

    // 并行加载所有图片
    const promises = imageNodes.map(async (node) => {
      try {
        const imageHandle = await this.adapter.loadImage(node.src);
        node.imageHandle = imageHandle;
        result.loaded.push(node.id);
        logger.debug(`图片加载成功: ${node.src}`);
      } catch (err) {
        const error: ImageLoadError = {
          id: node.id,
          src: node.src,
          error: err instanceof Error ? err : new Error(String(err)),
        };
        result.failed.push(error);
        logger.warn(`图片加载失败: ${node.src}`, err);
      }
    });

    await Promise.all(promises);

    logger.info(`图片预加载完成: 成功 ${result.loaded.length}, 失败 ${result.failed.length}`);

    return result;
  }

  /**
   * 收集场景图中的所有图片节点（包括 Group 内的）
   */
  private collectImageNodes(graph: SceneGraph): ImageNode[] {
    const nodes: ImageNode[] = [];
    const allNodes = graph.getNodes();

    for (const node of allNodes) {
      this.collectFromNode(node, nodes);
    }

    return nodes;
  }

  /**
   * 从单个节点收集图片节点
   */
  private collectFromNode(node: unknown, imageNodes: ImageNode[]): void {
    const typedNode = node as { type: string; id: string; children?: unknown[] };

    if (typedNode.type === 'image') {
      imageNodes.push(node as ImageNode);
    } else if (typedNode.type === 'group' && typedNode.children) {
      // 递归收集 Group 内的图片
      for (const child of typedNode.children) {
        this.collectFromNode(child, imageNodes);
      }
    }
  }
}
