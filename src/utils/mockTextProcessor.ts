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
 * 模拟文本处理请求函数
 * 接收原文本、输入框文本和节点信息，返回处理后的新文本
 */
export const processText = async (request: ProcessTextRequest): Promise<ProcessTextResponse> => {
  const { originalText, inputText, nodeInfo, nodeType } = request;

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  try {
    // 模拟不同类型的文本处理
    let newText = originalText;
    const instruction = inputText.toLowerCase().trim();

    // 根据输入指令进行不同的处理
    if (instruction.includes('翻译') || instruction.includes('translate')) {
      // 模拟翻译功能
      newText = `[已翻译] ${originalText} → This is a translated version of the original text.`;
    } else if (instruction.includes('总结') || instruction.includes('summarize')) {
      // 模拟总结功能
      const wordCount = originalText.length;
      newText = `[总结] 原文共${wordCount}字，主要内容：${originalText.substring(0, Math.min(50, wordCount))}...`;
    } else if (instruction.includes('扩展') || instruction.includes('expand')) {
      // 模拟扩展功能
      newText = `${originalText}\n\n[扩展内容] 基于原文内容，我们可以进一步探讨相关话题，包括背景信息、相关案例和深入分析等方面。`;
    } else if (instruction.includes('修正') || instruction.includes('correct')) {
      // 模拟文本修正功能
      newText = `[已修正] ${originalText.replace(/。/g, '。').replace(/，/g, '，')}`;
    } else if (instruction.includes('格式化') || instruction.includes('format')) {
      // 模拟格式化功能
      if (nodeType === 'paragraph') {
        newText = `**${originalText}**`; // 加粗
      } else if (nodeType === 'heading') {
        newText = `${originalText} ✨`; // 添加装饰
      } else {
        newText = `\`${originalText}\``; // 代码格式
      }
    } else if (instruction.includes('删除') || instruction.includes('delete')) {
      // 模拟删除功能
      newText = '';
    } else {
      // 默认处理：在原文基础上添加处理标记
      newText = `[已处理: ${inputText}] ${originalText}`;
    }

    // 模拟一些错误情况
    if (Math.random() < 0.1) { // 10% 的概率模拟错误
      throw new Error('模拟网络错误或处理失败');
    }

    return {
      success: true,
      newText,
      message: `成功处理文本，指令：${inputText}`
    };

  } catch (error) {
    console.error('文本处理失败:', error);
    return {
      success: false,
      newText: originalText, // 失败时返回原文本
      message: error instanceof Error ? error.message : '处理失败，请重试'
    };
  }
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
    console.error('获取节点文本失败:', error);
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
    console.error('获取节点类型失败:', error);
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
    console.error('替换文本失败:', error);
    return false;
  }
};
