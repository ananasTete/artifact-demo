import React, { useRef } from 'react';
import type { IconStyle, HighlightStyle, LockedHighlight } from '../hooks/useHoverIcon';
import { UnifiedBubbleMenu } from './UnifiedBubbleMenu';
import { useUnifiedMenu } from '../hooks/useUnifiedMenu';
import { DEFAULT_MENU_CONFIG } from '../types/unifiedMenu';
import type { MenuEventHandlers, NodeInfo } from '../types/unifiedMenu';
import type { Editor } from '@tiptap/react';
import './HoverIcon.css';

interface HoverIconProps {
  iconStyle: IconStyle;
  highlightStyle: HighlightStyle;
  lockedHighlight: LockedHighlight | null;
  onIconClick: () => void;
  onIconMouseEnter: () => void;
  onIconMouseLeave: () => void;
  editor?: Editor;
  currentNodeInfo?: NodeInfo | null;
}

export const HoverIcon: React.FC<HoverIconProps> = ({
  iconStyle,
  highlightStyle,
  lockedHighlight,
  onIconClick,
  onIconMouseEnter,
  onIconMouseLeave,
  editor,
  currentNodeInfo,
}) => {
  const iconRef = useRef<HTMLDivElement>(null);

  const {
    menuState,
    showMenuForNode,
    switchToAIMode,
    backToMainMenu,
    closeMenu,
    updateUserInput,
    setLoading,
  } = useUnifiedMenu(editor);

  // 处理icon点击，显示统一菜单
  const handleIconClick = () => {
    onIconClick(); // 保持原有的高亮逻辑

    if (currentNodeInfo && iconRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const editorWrapper = iconRef.current.closest('.editor-wrapper');

      if (editorWrapper) {
        const editorRect = editorWrapper.getBoundingClientRect();
        const position = {
          top: iconRect.top - editorRect.top,
          left: iconRect.left - editorRect.left,
        };

        showMenuForNode(currentNodeInfo, position);
      }
    }
  };

  // 事件处理器
  const handlers: MenuEventHandlers = {
    onFormatClick: () => {
      // 节点icon触发不支持格式化
    },

    onNodeTypeClick: (nodeType: string, level?: number) => {
      if (!editor) return;

      if (nodeType === 'heading' && level) {
        editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
      } else {
        switch (nodeType) {
          case 'paragraph':
            editor.chain().focus().setParagraph().run();
            break;
          case 'bulletList':
            editor.chain().focus().toggleBulletList().run();
            break;
          case 'orderedList':
            editor.chain().focus().toggleOrderedList().run();
            break;
          case 'blockquote':
            editor.chain().focus().toggleBlockquote().run();
            break;
        }
      }
      closeMenu();
    },

    onAIClick: () => {
      switchToAIMode();
    },

    onAIInputSubmit: async (input: string) => {
      if (!input.trim() || !editor || !currentNodeInfo) return;

      setLoading(true);
      try {
        // 选择整个节点
        editor.commands.setTextSelection({
          from: currentNodeInfo.startPos,
          to: currentNodeInfo.endPos,
        });

        // 处理AI指令（这里可以复用processTextSelection或创建新的处理函数）
        // const result = await processNodeWithAI(editor, currentNodeInfo, input.trim());
        console.log('处理节点AI指令:', input, currentNodeInfo);

        closeMenu();
      } catch (error) {
        console.error('处理AI指令时出错:', error);
      } finally {
        setLoading(false);
      }
    },

    onAICommandClick: async (command: string) => {
      if (!currentNodeInfo) return;

      // 根据命令类型生成对应的AI指令
      const commandMap: Record<string, string> = {
        polish: '润色这段文字',
        expand: '扩写这段文字',
        simplify: '简化这段文字',
        continue: '续写这段文字',
        imitate: '仿写这段文字',
        rewrite: '改写这段文字',
        analyze: '解析这段内容',
      };

      const instruction = commandMap[command] || command;
      handlers.onAIInputSubmit(instruction);
    },

    onBack: () => {
      backToMainMenu();
    },

    onClose: () => {
      closeMenu();
    },
  };

  return (
    <>
      {/* 锁定的高亮背景覆盖层 */}
      {lockedHighlight && (
        <div
          className="text-node-highlight locked"
          style={lockedHighlight.style}
        />
      )}

      {/* 悬浮时的高亮背景覆盖层 */}
      <div
        className="text-node-highlight"
        style={highlightStyle}
      />

      {/* 块级元素悬浮图标容器 */}
      <div
        className="paragraph-hover-icon-container"
        style={iconStyle}
      >
        {/* 图标本身 */}
        <div
          ref={iconRef}
          className="paragraph-hover-icon"
          onClick={handleIconClick}
          onMouseEnter={onIconMouseEnter}
          onMouseLeave={onIconMouseLeave}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3.5V12.5M3.5 8H12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 统一气泡菜单 */}
      <UnifiedBubbleMenu
        state={menuState}
        config={DEFAULT_MENU_CONFIG}
        handlers={handlers}
        onUserInputChange={updateUserInput}
      />
    </>
  );
};
