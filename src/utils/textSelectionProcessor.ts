import type { Editor } from '@tiptap/react';

// 节点信息接口
export interface SelectionNodeInfo {
  from: number;
  to: number;
  content: string;
  context: string;
  contextFrom: number;
  contextTo: number;
}

// 扩展的选择节点信息，包含span包装信息
export interface SelectionNodeWithSpan extends SelectionNodeInfo {
  hasSpanWrapper: boolean;
  spanId: string;
}

// 处理请求接口
export interface ProcessSelectionRequest {
  suggestion: string;
  nodes: SelectionNodeInfo[];
}

// 处理响应接口
export interface ProcessSelectionResponse {
  success: boolean;
  results: Array<{
    nodeIndex: number;
    newContent: string;
    replaceEntireContext: boolean; // 是否替换整个上下文
  }>;
  message?: string;
}

/**
 * 分析文本选择，识别涉及的节点和内容
 */
export const analyzeTextSelection = (editor: Editor): SelectionNodeInfo[] => {
  const { state } = editor;
  const { selection } = state;
  const { from, to } = selection;

  if (from === to) {
    return []; // 没有选择
  }

  const doc = state.doc;
  const nodes: SelectionNodeInfo[] = [];

  // 遍历选择范围内的所有节点
  doc.nodesBetween(from, to, (node, pos) => {
    // 只处理文本节点的父节点（段落、标题等）
    if (node.isBlock && node.type.name !== 'doc') {
      const nodeStart = pos;
      const nodeEnd = pos + node.nodeSize;

      // 计算选择在当前节点中的范围
      const selectionStart = Math.max(from, nodeStart);
      const selectionEnd = Math.min(to, nodeEnd);

      // 如果选择范围与当前节点有交集
      if (selectionStart < selectionEnd) {
        // 获取节点的完整文本内容（上下文）
        const context = node.textContent;

        // 获取选择的文本内容
        const selectedContent = doc.textBetween(selectionStart, selectionEnd, '\n');

        // 计算选择在节点内的相对位置
        // 需要考虑节点的开始标记（如段落标记占用1个位置）
        const nodeContentStart = nodeStart + 1; // 跳过开始标记
        const relativeFrom = Math.max(0, selectionStart - nodeContentStart);
        const relativeTo = Math.min(context.length, selectionEnd - nodeContentStart);

        const nodeInfo = {
          from: relativeFrom,
          to: relativeTo,
          content: selectedContent,
          context: context,
          contextFrom: nodeStart,
          contextTo: nodeEnd,
        };



        nodes.push(nodeInfo);
      }
    }
  });

  return nodes;
};

/**
 * 模拟AI处理函数
 * 将每个节点的划词部分倒序返回
 */
export const simulateAIProcessing = async (request: ProcessSelectionRequest): Promise<ProcessSelectionResponse> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const results = request.nodes.map((node, index) => {
    // 将选中的文本倒序
    const reversedContent = node.content.split('').reverse().join('');
    
    return {
      nodeIndex: index,
      newContent: reversedContent,
      replaceEntireContext: false, // 只替换选中的部分
    };
  });
  
  return {
    success: true,
    results,
    message: '处理完成'
  };
};

/**
 * 应用AI处理结果到编辑器
 */
export const applyProcessingResults = (
  editor: Editor,
  originalNodes: SelectionNodeInfo[],
  results: ProcessSelectionResponse['results']
): boolean => {
  try {
    const { state } = editor;
    const tr = state.tr;

    // 按照从后往前的顺序处理，避免位置偏移问题
    const sortedResults = [...results].sort((a, b) => {
      const nodeA = originalNodes[a.nodeIndex];
      const nodeB = originalNodes[b.nodeIndex];
      return nodeB.contextFrom - nodeA.contextFrom;
    });

    for (const result of sortedResults) {
      const node = originalNodes[result.nodeIndex];

      if (result.replaceEntireContext) {
        // 替换整个节点内容
        const nodeContentStart = node.contextFrom + 1; // 跳过开始标记
        const nodeContentEnd = node.contextTo - 1; // 跳过结束标记

        tr.replaceWith(
          nodeContentStart,
          nodeContentEnd,
          state.schema.text(result.newContent)
        );
      } else {
        // 只替换选中的部分
        const nodeContentStart = node.contextFrom + 1; // 跳过开始标记
        const actualFrom = nodeContentStart + node.from;
        const actualTo = nodeContentStart + node.to;

        tr.replaceWith(
          actualFrom,
          actualTo,
          state.schema.text(result.newContent)
        );
      }
    }

    editor.view.dispatch(tr);
    return true;
  } catch (error) {
    console.error('应用处理结果时出错:', error);
    return false;
  }
};

/**
 * 为选中文本添加span包装，保持选中状态的视觉反馈
 */
export const wrapSelectionWithSpan = (editor: Editor): SelectionNodeWithSpan[] => {
  const nodes = analyzeTextSelection(editor);
  const { state } = editor;
  const tr = state.tr;
  const wrappedNodes: SelectionNodeWithSpan[] = [];

  // 从后往前处理，避免位置偏移
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const spanId = `selection-highlight-${Date.now()}-${i}`;

    // 计算绝对位置
    const nodeContentStart = node.contextFrom + 1;
    const absoluteFrom = nodeContentStart + node.from;
    const absoluteTo = nodeContentStart + node.to;

    // 应用选择高亮标记到选中的文本
    const selectionHighlightMark = state.schema.marks.selectionHighlight;
    if (selectionHighlightMark) {
      tr.addMark(
        absoluteFrom,
        absoluteTo,
        selectionHighlightMark.create({
          'data-selection-id': spanId,
          class: 'text-selection-highlight'
        })
      );
    } else {
      console.warn('selectionHighlight mark not found in schema');
    }

    wrappedNodes.unshift({
      ...node,
      hasSpanWrapper: true,
      spanId
    });
  }

  editor.view.dispatch(tr);
  return wrappedNodes;
};

/**
 * 清理选择高亮span包装
 */
export const cleanupSelectionSpans = (editor: Editor, wrappedNodes: SelectionNodeWithSpan[]): void => {
  const { state } = editor;
  const tr = state.tr;

  // 遍历文档，移除所有选择高亮标记
  state.doc.descendants((node, pos) => {
    if (node.isText && node.marks.length > 0) {
      const selectionHighlightMarks = node.marks.filter(mark =>
        mark.type.name === 'selectionHighlight' &&
        wrappedNodes.some(wrappedNode =>
          mark.attrs['data-selection-id'] === wrappedNode.spanId
        )
      );

      if (selectionHighlightMarks.length > 0) {
        // 移除选择高亮标记
        selectionHighlightMarks.forEach(mark => {
          tr.removeMark(pos, pos + node.nodeSize, mark);
        });
      }
    }
  });

  if (tr.steps.length > 0) {
    editor.view.dispatch(tr);
  }
};

/**
 * 处理文本选择的主函数（带span包装的版本）
 */
export const processTextSelectionWithSpan = async (
  editor: Editor,
  suggestion: string
): Promise<{ success: boolean; message?: string; wrappedNodes?: SelectionNodeWithSpan[] }> => {
  let wrappedNodes: SelectionNodeWithSpan[] = [];

  try {
    // 1. 分析当前选择
    const nodes = analyzeTextSelection(editor);

    if (nodes.length === 0) {
      return { success: false, message: '没有选中任何文本' };
    }

    // 2. 为选中文本添加高亮span包装
    wrappedNodes = wrapSelectionWithSpan(editor);

    // 3. 构建请求
    const request: ProcessSelectionRequest = {
      suggestion,
      nodes,
    };



    // 4. 调用AI处理
    const response = await simulateAIProcessing(request);

    if (!response.success) {
      // 处理失败时清理span包装
      cleanupSelectionSpans(editor, wrappedNodes);
      return { success: false, message: response.message || '处理失败' };
    }

    // 5. 先清理span包装，再应用结果
    cleanupSelectionSpans(editor, wrappedNodes);

    // 6. 应用结果
    const applied = applyProcessingResults(editor, nodes, response.results);

    if (!applied) {
      return { success: false, message: '应用处理结果失败' };
    }

    return { success: true, message: '处理完成', wrappedNodes };
  } catch (error) {
    console.error('处理文本选择时出错:', error);
    // 出错时也要清理span包装
    if (wrappedNodes.length > 0) {
      cleanupSelectionSpans(editor, wrappedNodes);
    }
    return { success: false, message: '处理过程中出现错误' };
  }
};

/**
 * 处理文本选择的主函数（原版本，保持向后兼容）
 */
export const processTextSelection = async (
  editor: Editor,
  suggestion: string
): Promise<{ success: boolean; message?: string }> => {
  const result = await processTextSelectionWithSpan(editor, suggestion);
  return {
    success: result.success,
    message: result.message
  };
};
