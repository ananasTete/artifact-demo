import type { NodeInfo } from '../hooks/useHoverIcon';

export interface ProcessTextRequest {
  originalText: string;
  inputText: string;
  nodeInfo: NodeInfo;
  nodeType?: string;
}

export interface ProcessTextResponse {
  success: boolean;
  newText: string;
  message?: string;
}

/**
 * 文本处理请求函数
 * 接收原文本、输入框文本和节点信息，返回处理后的新文本
 * TODO: 在生产环境中，这里应该调用真实的 API
 */
export const processText = async (request: ProcessTextRequest): Promise<ProcessTextResponse> => {
  // TODO: 替换为真实的 API 调用
  // 目前返回原文本，避免意外修改
  return {
    success: true,
    newText: request.originalText,
    message: '文本处理功能尚未实现'
  };
};

/**
 * 获取节点的文本内容
 * 从 ProseMirror 编辑器中提取指定节点的文本内容
 */
export const getNodeText = (view: any, nodeInfo: NodeInfo): string => {
  try {
    const { startPos, endPos } = nodeInfo;
    const doc = view.state.doc;
    
    // 获取节点的文本内容
    const textContent = doc.textBetween(startPos, endPos, '\n');
    return textContent;
  } catch (error) {

    return '';
  }
};

/**
 * 获取节点类型
 */
export const getNodeType = (view: any, nodeInfo: NodeInfo): string => {
  try {
    const { startPos } = nodeInfo;
    const resolvedPos = view.state.doc.resolve(startPos);
    return resolvedPos.parent.type.name;
  } catch (error) {

    return 'unknown';
  }
};

/**
 * 替换节点文本内容
 */
export const replaceNodeText = (view: any, nodeInfo: NodeInfo, newText: string): boolean => {
  try {
    const { startPos, endPos } = nodeInfo;
    const tr = view.state.tr;
    
    // 如果新文本为空，删除整个节点
    if (newText === '') {
      tr.deleteRange(startPos, endPos);
    } else {
      // 替换文本内容
      tr.replaceWith(startPos, endPos, view.state.schema.text(newText));
    }
    
    view.dispatch(tr);
    return true;
  } catch (error) {

    return false;
  }
};
