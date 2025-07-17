import React, { useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { UnifiedBubbleMenu } from './UnifiedBubbleMenu';
import { useUnifiedMenu } from '../hooks/useUnifiedMenu';
import { DEFAULT_MENU_CONFIG } from '../types/unifiedMenu';
import type { MenuEventHandlers } from '../types/unifiedMenu';
import { processTextSelection } from '../utils/textSelectionProcessor';

interface CustomTextSelectionMenuProps {
  editor: Editor;
}

export const CustomTextSelectionMenu: React.FC<CustomTextSelectionMenuProps> = ({
  editor,
}) => {
  const {
    menuState,
    currentSelection,
    showMenuForSelection,
    switchToAIMode,
    backToMainMenu,
    closeMenu,
    updateUserInput,
    setLoading,
  } = useUnifiedMenu(editor);

  // 监听选择变化，显示菜单
  useEffect(() => {
    const handleSelectionUpdate = () => {
      const { state } = editor;
      const { selection } = state;

      if (!selection.empty) {
        // 延迟显示菜单，确保选择操作完成
        setTimeout(() => {
          showMenuForSelection();
        }, 100);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, showMenuForSelection]);

  // 事件处理器
  const handlers: MenuEventHandlers = {
    onFormatClick: (format: string) => {
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
      closeMenu();
      // 延迟清除选择状态，确保格式化操作完成后菜单不会重新出现
      setTimeout(() => {
        editor.commands.setTextSelection(editor.state.selection.to);
      }, 100);
    },

    onNodeTypeClick: (nodeType: string, level?: number) => {
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
      if (!input.trim() || !currentSelection) return;

      setLoading(true);
      try {
        const result = await processTextSelection(editor, input.trim());
        if (result.success) {
          closeMenu();
          // 清除文本选择状态
          setTimeout(() => {
            editor.commands.setTextSelection(editor.state.selection.to);
          }, 100);
        }
      } catch (error) {
        console.error('处理AI指令时出错:', error);
      } finally {
        setLoading(false);
      }
    },

    onAICommandClick: async (command: string) => {
      if (!currentSelection) return;

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
    <UnifiedBubbleMenu
      state={menuState}
      config={DEFAULT_MENU_CONFIG}
      handlers={handlers}
      onUserInputChange={updateUserInput}
    />
  );
};