import { useState, useCallback, useMemo, useEffect } from 'react';
import throttle from 'lodash.throttle';
import { EditorView } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';
import { processText, getNodeText, getNodeType, replaceNodeText } from '../utils/textProcessor';
import type { ProcessTextRequest } from '../utils/textProcessor';

export interface IconStyle {
  display: string;
  top: string;
}

export interface HighlightStyle {
  display: string;
  top: string;
  left: string;
  width: string;
  height: string;
}

export interface NodeInfo {
  startPos: number;
  endPos: number;
}

export interface LockedHighlight {
  startPos: number;
  endPos: number;
  style: HighlightStyle;
}

export interface BubbleCardState {
  isVisible: boolean;
  position: {
    top: string;
    left: string;
  };
  isLoading: boolean;
}

export const useHoverIcon = (editorView?: EditorView) => {
  const [iconStyle, setIconStyle] = useState<IconStyle>({
    display: 'none',
    top: '-100px',
  });

  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>({
    display: 'none',
    top: '0px',
    left: '0px',
    width: '0px',
    height: '0px',
  });

  const [currentNodeInfo, setCurrentNodeInfo] = useState<NodeInfo | null>(null);

  // 跟踪被锁定高亮的节点
  const [lockedHighlight, setLockedHighlight] = useState<LockedHighlight | null>(null);

  // 用于延迟隐藏图标的定时器
  const [hideTimer, setHideTimer] = useState<number | null>(null);

  // 气泡卡片状态
  const [bubbleCardState, setBubbleCardState] = useState<BubbleCardState>({
    isVisible: false,
    position: { top: '0px', left: '0px' },
    isLoading: false,
  });

  // 计算文本内容实际宽度的辅助函数
  const calculateTextWidth = useCallback((view: EditorView, currentNode: Node, nodeStartPos: number, nodeEndCoords: { left: number, right: number, top: number, bottom: number }, nodeStartCoords: { left: number, right: number, top: number, bottom: number }) => {
    let baseWidth;

    try {
      // 尝试通过位置找到对应的DOM节点
      const domAtPos = view.domAtPos(nodeStartPos);
      const textNode = domAtPos.node;



      if (textNode) {
        // 根据节点类型选择合适的元素来计算宽度
        let targetElement;

        // 如果 textNode 本身就是我们要的元素类型，直接使用
        if (textNode.nodeType === window.Node.ELEMENT_NODE) {
          const element = textNode as Element;
          if (currentNode.type.name === 'paragraph' && element.tagName === 'P') {
            targetElement = element;
          } else if (currentNode.type.name === 'heading' && /^H[1-6]$/.test(element.tagName)) {
            targetElement = element;
          } else if (currentNode.type.name === 'blockquote' && element.tagName === 'BLOCKQUOTE') {
            targetElement = element;
          } else if (currentNode.type.name === 'listItem' && element.tagName === 'LI') {
            targetElement = element;
          } else if (currentNode.type.name === 'codeBlock' && element.tagName === 'PRE') {
            targetElement = element;
          }
        }

        // 如果没有找到合适的元素，尝试从父元素或自身中查找
        if (!targetElement && textNode.parentElement) {
          if (currentNode.type.name === 'paragraph') {
            targetElement = (textNode as Element).closest?.('p') || textNode.parentElement.closest('p');
          } else if (currentNode.type.name === 'heading') {
            targetElement = (textNode as Element).closest?.('h1, h2, h3, h4, h5, h6') || textNode.parentElement.closest('h1, h2, h3, h4, h5, h6');
          } else if (currentNode.type.name === 'blockquote') {
            targetElement = (textNode as Element).closest?.('blockquote') || textNode.parentElement.closest('blockquote');
          } else if (currentNode.type.name === 'listItem') {
            targetElement = (textNode as Element).closest?.('li') || textNode.parentElement.closest('li');
          } else if (currentNode.type.name === 'codeBlock') {
            targetElement = (textNode as Element).closest?.('pre') || textNode.parentElement.closest('pre');
          }
        }

        if (targetElement) {
          const textElementRect = targetElement.getBoundingClientRect();
          const proseMirrorElement = view.dom;
          const proseMirrorRect = proseMirrorElement.getBoundingClientRect();

          // 确保宽度不超过编辑器内容区域
          const maxAllowedWidth = proseMirrorRect.width;
          baseWidth = Math.min(textElementRect.width, maxAllowedWidth);


        } else {
          // 如果找不到合适的元素，回退到坐标计算
          baseWidth = nodeEndCoords.right - nodeStartCoords.left;

        }
      } else {
        // 回退到坐标计算
        baseWidth = nodeEndCoords.right - nodeStartCoords.left;

      }
    } catch {
      // 如果出错，回退到坐标计算
      baseWidth = nodeEndCoords.right - nodeStartCoords.left;

    }

    return baseWidth;
  }, []);

  // 悬浮图标的鼠标移动处理函数
  const throttledMouseMove = useMemo(
    () => throttle((view: EditorView, event: MouseEvent) => {
      // 检查鼠标是否在图标区域内
      const editorWrapper = view.dom.closest('.editor-wrapper');
      if (editorWrapper) {
        const editorRect = editorWrapper.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // 图标区域大致在编辑器左侧，现在贴着编辑器边缘
        const iconAreaLeft = editorRect.left - 24;
        const iconAreaRight = editorRect.left;
        const isInIconArea = mouseX >= iconAreaLeft && mouseX <= iconAreaRight &&
                            mouseY >= editorRect.top && mouseY <= editorRect.bottom;

        // 如果鼠标在图标区域内，不执行隐藏逻辑，保持当前状态
        if (isInIconArea) {
          // 清除之前的隐藏定时器
          if (hideTimer) {
            clearTimeout(hideTimer);
            setHideTimer(null);
          }
          return;
        }
      }

      // 清除之前的隐藏定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
        setHideTimer(null);
      }

      // 获取鼠标的屏幕坐标
      const coords = { left: event.clientX, top: event.clientY };

      // 将屏幕坐标转换为 ProseMirror 的文档位置
      const pos = view.posAtCoords(coords);

      if (pos) {
        // 从文档位置解析出更详细的信息，比如父节点的起始位置
        const resolvedPos = view.state.doc.resolve(pos.pos);

        // 检查当前节点是否是块级文本节点（段落、标题、列表项等）
        const currentNode = resolvedPos.parent;
        const blockTextTypes = ['paragraph', 'heading', 'blockquote', 'listItem', 'codeBlock'];
        if (!blockTextTypes.includes(currentNode.type.name)) {
          setIconStyle({ display: 'none', top: '-100px' });
          return;
        }

        // 我们希望 icon 和整个块级节点（如段落）对齐，所以获取该节点的起始位置
        const nodeStartPos = resolvedPos.start(resolvedPos.depth);
        const nodeEndPos = resolvedPos.end(resolvedPos.depth);

        // 获取节点起始和结束位置的屏幕坐标
        const nodeStartCoords = view.coordsAtPos(nodeStartPos);
        const nodeEndCoords = view.coordsAtPos(nodeEndPos);

        // 更新 icon 的位置和节点信息
        // nodeCoords.top 是相对于视口的，我们需要计算相对于 editor-wrapper 的位置
        const editorWrapper = view.dom.closest('.editor-wrapper');
        if (editorWrapper) {
          const editorRect = editorWrapper.getBoundingClientRect();
          const iconTop = nodeStartCoords.top - editorRect.top;

          setIconStyle({
            display: 'flex',
            top: `${iconTop}px`,
          });

          // 检查是否切换到了新的节点
          const newNodeInfo = {
            startPos: nodeStartPos,
            endPos: nodeEndPos,
          };

          // 如果当前有锁定的高亮，检查是否切换到了不同的节点
          if (lockedHighlight) {
            const isDifferentNode = lockedHighlight.startPos !== nodeStartPos ||
                                   lockedHighlight.endPos !== nodeEndPos;

            if (isDifferentNode) {
              // 切换到不同节点时，清除锁定状态和卡片
              setLockedHighlight(null);
              setBubbleCardState(prev => ({ ...prev, isVisible: false }));
            }
          }

          // 存储当前节点信息，用于高亮显示
          setCurrentNodeInfo(newNodeInfo);

          // 计算高亮覆盖层的位置和尺寸（包含内边距效果）
          const baseTop = nodeStartCoords.top - editorRect.top;
          const baseLeft = nodeStartCoords.left - editorRect.left;
          const baseHeight = nodeEndCoords.bottom - nodeStartCoords.top;

          // 计算文本内容的实际宽度
          const baseWidth = calculateTextWidth(view, currentNode, nodeStartPos, nodeEndCoords, nodeStartCoords);

          // 添加内边距效果：扩大高亮区域
          const highlightTop = baseTop - 4;
          const highlightLeft = baseLeft - 8;
          const highlightWidth = baseWidth + 16;
          const highlightHeight = baseHeight + 8;

          setHighlightStyle({
            display: 'none', // 默认隐藏，只有在悬浮图标时才显示
            top: `${highlightTop}px`,
            left: `${highlightLeft}px`,
            width: `${highlightWidth}px`,
            height: `${highlightHeight}px`,
          });
        }
      } else {
        // 如果鼠标不在有效文本上，延迟隐藏图标和高亮
        const timer = setTimeout(() => {
          setIconStyle({ display: 'none', top: '-100px' });
          setHighlightStyle({
            display: 'none',
            top: '0px',
            left: '0px',
            width: '0px',
            height: '0px',
          });
          setCurrentNodeInfo(null);
        }, 300); // 300ms 延迟隐藏

        setHideTimer(timer);
      }
    }, 100), // 节流，每 100ms 最多执行一次
    [setIconStyle, hideTimer, setHideTimer, calculateTextWidth, lockedHighlight, setBubbleCardState]
  );

  const handleMouseMove = useCallback((view: EditorView, event: MouseEvent) => {
    throttledMouseMove(view, event);
  }, [throttledMouseMove]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [hideTimer]);

  // 图标点击处理函数
  const handleIconClick = useCallback(() => {


    if (currentNodeInfo) {
      // 检查当前节点是否已经被锁定
      const isCurrentlyLocked = lockedHighlight &&
        lockedHighlight.startPos === currentNodeInfo.startPos &&
        lockedHighlight.endPos === currentNodeInfo.endPos;

      if (isCurrentlyLocked && bubbleCardState.isVisible) {
        // 如果已经锁定且气泡卡片已显示，则关闭气泡卡片并解锁
        setBubbleCardState(prev => ({ ...prev, isVisible: false }));
        setLockedHighlight(null);
      } else {
        // 锁定当前节点的高亮，使用与悬浮时相同的样式
        const lockedStyle: HighlightStyle = {
          ...highlightStyle,
          display: 'block',
        };

        setLockedHighlight({
          startPos: currentNodeInfo.startPos,
          endPos: currentNodeInfo.endPos,
          style: lockedStyle,
        });

        // 显示气泡卡片（位置将相对于 icon 计算）
        setBubbleCardState({
          isVisible: true,
          position: { top: '0px', left: '0px' }, // 这些值现在不重要，因为会相对于 icon 定位
          isLoading: false,
        });
      }
    }
  }, [currentNodeInfo, lockedHighlight, highlightStyle, iconStyle, bubbleCardState.isVisible]);

  // 鼠标移出整个容器时，延迟隐藏图标和高亮
  const handleMouseLeave = useCallback(() => {
    // 清除之前的定时器
    if (hideTimer) {
      clearTimeout(hideTimer);
    }

    // 设置新的延迟隐藏定时器
    const timer = setTimeout(() => {
      // 如果有卡片显示，不隐藏图标和高亮
      if (bubbleCardState.isVisible) {
        return;
      }

      setIconStyle({ display: 'none', top: '-100px' });
      setHighlightStyle({
        display: 'none',
        top: '0px',
        left: '0px',
        width: '0px',
        height: '0px',
      });
      setCurrentNodeInfo(null);
      // 如果有锁定状态但没有卡片，也清除锁定状态
      if (lockedHighlight) {
        setLockedHighlight(null);
      }
    }, 200); // 200ms 延迟隐藏

    setHideTimer(timer);
  }, [setIconStyle, setHighlightStyle, setCurrentNodeInfo, hideTimer, setHideTimer, bubbleCardState.isVisible, lockedHighlight]);

  // 图标悬浮时显示高亮
  const handleIconMouseEnter = useCallback(() => {
    // 清除所有隐藏定时器
    if (hideTimer) {
      clearTimeout(hideTimer);
      setHideTimer(null);
    }

    if (currentNodeInfo) {
      // 检查当前节点是否已经被锁定
      const isCurrentlyLocked = lockedHighlight &&
        lockedHighlight.startPos === currentNodeInfo.startPos &&
        lockedHighlight.endPos === currentNodeInfo.endPos;

      // 如果已经锁定，保持锁定状态的高亮；如果没有锁定，显示悬浮高亮
      if (!isCurrentlyLocked) {
        // 立即显示高亮，不使用 prev 状态避免状态更新延迟
        setHighlightStyle({
          ...highlightStyle,
          display: 'block',
        });
      }
    }
  }, [currentNodeInfo, lockedHighlight, highlightStyle, hideTimer, setHideTimer]);

  // 图标移出时延迟隐藏高亮（但不影响锁定的高亮）
  const handleIconMouseLeave = useCallback(() => {
    // 清除之前的定时器
    if (hideTimer) {
      clearTimeout(hideTimer);
      setHideTimer(null);
    }

    if (currentNodeInfo) {
      const isCurrentlyLocked = lockedHighlight &&
        lockedHighlight.startPos === currentNodeInfo.startPos &&
        lockedHighlight.endPos === currentNodeInfo.endPos;

      if (!isCurrentlyLocked) {
        // 没有锁定时，延迟隐藏高亮
        const timer = setTimeout(() => {
          setHighlightStyle(prev => ({
            ...prev,
            display: 'none',
          }));
        }, 300);
        setHideTimer(timer);
      } else {
        // 如果有锁定且卡片已显示，鼠标移出icon不做任何操作
        // 卡片和遮罩层应该保持显示，直到点击外部区域或提交
        if (bubbleCardState.isVisible) {
          // 不做任何操作，保持卡片和遮罩层显示
          return;
        }

        // 如果有锁定但卡片没有显示，延迟清除锁定状态
        // 这处理了点击icon后立即离开但没有进入卡片的情况
        const timer = setTimeout(() => {
          setLockedHighlight(null);
          setHighlightStyle({
            display: 'none',
            top: '0px',
            left: '0px',
            width: '0px',
            height: '0px',
          });
          setCurrentNodeInfo(null);
        }, 500); // 给用户更多时间进入卡片
        setHideTimer(timer);
      }
    }
  }, [currentNodeInfo, lockedHighlight, bubbleCardState.isVisible, setHighlightStyle, setHideTimer, hideTimer]);

  // 气泡卡片提交处理函数
  const handleBubbleCardSubmit = useCallback(async (inputText: string) => {
    if (!currentNodeInfo || !editorView) {
      return;
    }

    setBubbleCardState(prev => ({ ...prev, isLoading: true }));

    try {
      // 获取节点的原始文本和类型
      const originalText = getNodeText(editorView, currentNodeInfo);
      const nodeType = getNodeType(editorView, currentNodeInfo);

      // 调用模拟请求函数
      const request: ProcessTextRequest = {
        originalText,
        inputText,
        nodeInfo: currentNodeInfo,
        nodeType,
      };

      const response = await processText(request);

      if (response.success) {
        // 替换文本内容
        const success = replaceNodeText(editorView, currentNodeInfo, response.newText);

        if (success) {

          // 关闭气泡卡片、解锁高亮并隐藏遮罩层
          setBubbleCardState(prev => ({ ...prev, isVisible: false, isLoading: false }));
          setLockedHighlight(null);
          // 隐藏遮罩层
          setHighlightStyle({
            display: 'none',
            top: '0px',
            left: '0px',
            width: '0px',
            height: '0px',
          });
          setCurrentNodeInfo(null);
        } else {

          setBubbleCardState(prev => ({ ...prev, isLoading: false }));
        }
      } else {

        setBubbleCardState(prev => ({ ...prev, isLoading: false }));
      }
    } catch {

      setBubbleCardState(prev => ({ ...prev, isLoading: false }));
    }
  }, [currentNodeInfo, editorView]);

  // 气泡卡片关闭处理函数
  const handleBubbleCardClose = useCallback(() => {
    setBubbleCardState(prev => ({ ...prev, isVisible: false }));
    // 关闭卡片时解锁高亮并隐藏遮罩层
    setLockedHighlight(null);
    // 隐藏遮罩层
    setHighlightStyle({
      display: 'none',
      top: '0px',
      left: '0px',
      width: '0px',
      height: '0px',
    });
    setCurrentNodeInfo(null);
  }, []);

  return {
    iconStyle,
    highlightStyle,
    currentNodeInfo,
    lockedHighlight,
    bubbleCardState,
    handleMouseMove,
    handleMouseLeave,
    handleIconClick,
    handleIconMouseEnter,
    handleIconMouseLeave,
    handleBubbleCardSubmit,
    handleBubbleCardClose,
  };
};
