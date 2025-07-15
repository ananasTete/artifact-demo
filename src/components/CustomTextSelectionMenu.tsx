import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { cleanupSelectionSpans, wrapSelectionWithSpan, processTextSelection } from '../utils/textSelectionProcessor';
import type { SelectionNodeWithSpan } from '../utils/textSelectionProcessor';
import './CustomTextSelectionMenu.css';

interface CustomTextSelectionMenuProps {
  editor: Editor;
}

export const CustomTextSelectionMenu: React.FC<CustomTextSelectionMenuProps> = ({
  editor,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showAskInput, setShowAskInput] = useState(false);
  const [askInputText, setAskInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wrappedSelectionNodes, setWrappedSelectionNodes] = useState<SelectionNodeWithSpan[]>([]);

  const menuRef = useRef<HTMLDivElement>(null);
  const askInputRef = useRef<HTMLInputElement>(null);

  // 计算菜单位置
  const calculatePosition = useCallback(() => {
    const { state, view } = editor;
    const { selection } = state;
    
    if (selection.empty) {
      return null;
    }

    try {
      const { from, to } = selection;
      const startCoords = view.coordsAtPos(from);
      const endCoords = view.coordsAtPos(to);
      
      // 计算选择区域的中心位置
      const centerX = (startCoords.left + endCoords.right) / 2;
      const centerY = startCoords.top;
      
      // 获取编辑器容器的位置
      const editorWrapper = view.dom.closest('.editor-wrapper');
      if (editorWrapper) {
        const editorRect = editorWrapper.getBoundingClientRect();
        const relativeX = centerX - editorRect.left;
        const relativeY = centerY - editorRect.top - 60; // 在选择区域上方显示
        
        return {
          left: relativeX,
          top: relativeY,
        };
      }
    } catch (error) {
      console.error('计算菜单位置时出错:', error);
    }
    
    return null;
  }, [editor]);

  // 监听选择变化
  useEffect(() => {
    const handleSelectionUpdate = () => {
      const { state } = editor;
      const { selection } = state;

      if (selection.empty) {
        // 如果没有选择，隐藏菜单
        setIsVisible(false);
        return;
      }

      // 如果正在显示询问输入框，不更新位置但保持显示
      if (showAskInput) {
        return;
      }

      // 计算位置并显示菜单
      const pos = calculatePosition();
      if (pos) {
        setPosition(pos);
        setIsVisible(true);
      }
    };

    // 监听编辑器的选择更新事件
    editor.on('selectionUpdate', handleSelectionUpdate);

    // 初始检查
    handleSelectionUpdate();

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, calculatePosition, showAskInput]);

  // 处理格式化按钮点击
  const handleFormatClick = (format: string) => {
    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
    }
    setIsVisible(false);
    // 延迟清除选择状态，确保格式化操作完成后菜单不会重新出现
    setTimeout(() => {
      editor.commands.setTextSelection(editor.state.selection.to);
    }, 100);
  };

  // 处理询问按钮点击
  const handleAskClick = () => {
    // 立即为选中文本添加高亮span包装
    try {
      const wrappedNodes = wrapSelectionWithSpan(editor);
      setWrappedSelectionNodes(wrappedNodes);
    } catch (error) {
      console.error('添加span包装时出错:', error);
    }

    setShowAskInput(true);
    // 延迟聚焦，确保输入框已渲染
    setTimeout(() => {
      askInputRef.current?.focus();
    }, 0);
  };

  // 处理询问输入提交
  const handleAskSubmit = async () => {
    if (!askInputText.trim() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const selection = editor.state.selection;

      if (selection.empty) {
        console.warn('没有选中任何文本');
        return;
      }

      // 处理文本选择，使用原始的processTextSelection函数
      // 因为span包装已经在handleAskClick中完成了
      const result = await processTextSelection(editor, askInputText.trim());

      if (result.success) {
        // 处理成功后清理span包装并关闭菜单
        cleanupSelectionSpans(editor, wrappedSelectionNodes);
        setWrappedSelectionNodes([]);

        handleCloseAskInput();
        setIsVisible(false);
        // 清除文本选择状态，防止菜单重新出现
        setTimeout(() => {
          editor.commands.setTextSelection(editor.state.selection.to);
        }, 100);
      } else {
        console.error('处理失败:', result.message);
        // 处理失败时也要清理span包装
        cleanupSelectionSpans(editor, wrappedSelectionNodes);
        setWrappedSelectionNodes([]);
      }
    } catch (error) {
      console.error('处理文本选择时出错:', error);
      // 出错时清理可能存在的span包装
      if (wrappedSelectionNodes.length > 0) {
        cleanupSelectionSpans(editor, wrappedSelectionNodes);
        setWrappedSelectionNodes([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 关闭询问输入
  const handleCloseAskInput = () => {
    // 清理可能存在的span包装
    if (wrappedSelectionNodes.length > 0) {
      cleanupSelectionSpans(editor, wrappedSelectionNodes);
      setWrappedSelectionNodes([]);
    }

    setShowAskInput(false);
    setAskInputText('');
    setIsLoading(false);
    // 如果是用户主动取消，也清除选择状态
    if (!isLoading) {
      setIsVisible(false);
      setTimeout(() => {
        editor.commands.setTextSelection(editor.state.selection.to);
      }, 100);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAskSubmit();
    } else if (event.key === 'Escape') {
      handleCloseAskInput();
    }
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (showAskInput) {
          handleCloseAskInput();
        } else {
          setIsVisible(false);
        }
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, showAskInput]);

  // 阻止页面滚动
  useEffect(() => {
    if (showAskInput) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [showAskInput]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* 遮罩层（仅在显示询问输入时） */}
      {showAskInput && <div className="custom-text-selection-overlay" />}
      
      {/* 菜单 */}
      <div
        ref={menuRef}
        className="custom-text-selection-menu"
        style={{
          position: 'absolute',
          left: `${position.left}px`,
          top: `${position.top}px`,
          transform: 'translateX(-50%)',
        }}
      >
        {!showAskInput ? (
          // 格式化按钮
          <div className="custom-text-selection-menu-buttons">
            <button
              onClick={() => handleFormatClick('bold')}
              className={editor.isActive('bold') ? 'is-active' : ''}
              title="粗体"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => handleFormatClick('italic')}
              className={editor.isActive('italic') ? 'is-active' : ''}
              title="斜体"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => handleFormatClick('strike')}
              className={editor.isActive('strike') ? 'is-active' : ''}
              title="删除线"
            >
              <s>S</s>
            </button>
            <div className="menu-divider" />
            <button
              onClick={handleAskClick}
              className="ask-button"
              title="询问AI"
            >
              询问
            </button>
          </div>
        ) : (
          // 询问输入框
          <div className="custom-text-selection-ask-input">
            <input
              ref={askInputRef}
              type="text"
              placeholder="输入建议..."
              value={askInputText}
              onChange={(e) => setAskInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              onClick={handleAskSubmit}
              disabled={!askInputText.trim() || isLoading}
              className="ask-submit-button"
            >
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8L14 8M14 8L8 2M14 8L8 14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={handleCloseAskInput}
              className="ask-cancel-button"
              title="取消"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </>
  );
};
