import { useState, useCallback, useMemo, useEffect } from 'react';
import throttle from 'lodash.throttle';
import { EditorView } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';

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
  nodeType: string;
  level?: number;
}

export interface LockedHighlight {
  startPos: number;
  endPos: number;
  style: HighlightStyle;
}

export const useHoverIcon = (_editorView?: EditorView) => {
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

  // 计算文本宽度的辅助函数
  const calculateTextWidth = useCallback((
    _view: EditorView,
    _node: Node,
    _nodeStartPos: number,
    nodeEndCoords: { right: number },
    nodeStartCoords: { left: number }
  ) => {
    // 默认使用节点的视觉宽度
    return nodeEndCoords.right - nodeStartCoords.left;
  }, []);

  // 节流处理的鼠标移动处理函数
  const throttledMouseMove = useMemo(() => throttle(
    (view: EditorView, event: MouseEvent) => {
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

        // 获取节点的起始和结束位置
        const nodeStartPos = resolvedPos.start();
        const nodeEndPos = resolvedPos.end();

        // 获取节点在屏幕上的坐标
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
          const newNodeInfo: NodeInfo = {
            startPos: nodeStartPos,
            endPos: nodeEndPos,
            nodeType: currentNode.type.name,
            level: currentNode.attrs.level, // 对于标题节点
          };

          // 如果当前有锁定的高亮，检查是否切换到了不同的节点
          if (lockedHighlight) {
            const isDifferentNode = lockedHighlight.startPos !== nodeStartPos ||
                                   lockedHighlight.endPos !== nodeEndPos;

            if (isDifferentNode) {
              // 切换到不同节点时，清除锁定状态
              setLockedHighlight(null);
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
    [setIconStyle, hideTimer, setHideTimer, calculateTextWidth, lockedHighlight]
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

      if (isCurrentlyLocked) {
        // 如果已经锁定，则解锁
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
      }
    }
  }, [currentNodeInfo, lockedHighlight, highlightStyle]);

  // 鼠标移出整个容器时，延迟隐藏图标和高亮
  const handleMouseLeave = useCallback(() => {
    // 清除之前的定时器
    if (hideTimer) {
      clearTimeout(hideTimer);
    }

    // 设置新的延迟隐藏定时器
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
      // 如果有锁定状态但没有卡片，也清除锁定状态
      if (lockedHighlight) {
        setLockedHighlight(null);
      }
    }, 200); // 200ms 延迟隐藏

    setHideTimer(timer);
  }, [setIconStyle, setHighlightStyle, setCurrentNodeInfo, hideTimer, setHideTimer, lockedHighlight]);

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
      }
    }
  }, [currentNodeInfo, lockedHighlight, hideTimer, setHideTimer]);

  return {
    iconStyle,
    highlightStyle,
    currentNodeInfo,
    lockedHighlight,
    handleMouseMove,
    handleMouseLeave,
    handleIconClick,
    handleIconMouseEnter,
    handleIconMouseLeave,
  };
};
