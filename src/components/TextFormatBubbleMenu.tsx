import React from 'react';
import { BubbleMenu } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

interface TextFormatBubbleMenuProps {
  editor: Editor;
}

export const TextFormatBubbleMenu: React.FC<TextFormatBubbleMenuProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  // 安全的命令执行函数
  const safeExecuteCommand = (command: () => void) => {
    try {
      command();
    } catch (error) {
      console.error('Error executing editor command:', error);
    }
  };

  const formatButtons = [
    {
      name: 'bold',
      label: 'B',
      title: '粗体 (Ctrl+B)',
      isActive: () => editor.isActive('bold'),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleBold().run());
      },
      className: 'format-button bold'
    },
    {
      name: 'italic',
      label: 'I',
      title: '斜体 (Ctrl+I)',
      isActive: () => editor.isActive('italic'),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleItalic().run());
      },
      className: 'format-button italic'
    },
    {
      name: 'strike',
      label: 'S',
      title: '删除线 (Ctrl+Shift+X)',
      isActive: () => editor.isActive('strike'),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleStrike().run());
      },
      className: 'format-button strike'
    },
    {
      name: 'code',
      label: '</>',
      title: '行内代码 (Ctrl+E)',
      isActive: () => editor.isActive('code'),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleCode().run());
      },
      className: 'format-button code'
    }
  ];

  const headingButtons = [
    {
      name: 'heading1',
      label: 'H1',
      title: '标题 1',
      isActive: () => editor.isActive('heading', { level: 1 }),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run());
      },
      className: 'format-button heading'
    },
    {
      name: 'heading2',
      label: 'H2',
      title: '标题 2',
      isActive: () => editor.isActive('heading', { level: 2 }),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run());
      },
      className: 'format-button heading'
    },
    {
      name: 'heading3',
      label: 'H3',
      title: '标题 3',
      isActive: () => editor.isActive('heading', { level: 3 }),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleHeading({ level: 3 }).run());
      },
      className: 'format-button heading'
    }
  ];

  const blockButtons = [
    {
      name: 'blockquote',
      label: '❝',
      title: '引用块',
      isActive: () => editor.isActive('blockquote'),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleBlockquote().run());
      },
      className: 'format-button blockquote'
    },
    {
      name: 'codeBlock',
      label: '{ }',
      title: '代码块',
      isActive: () => editor.isActive('codeBlock'),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleCodeBlock().run());
      },
      className: 'format-button code-block'
    }
  ];

  const listButtons = [
    {
      name: 'bulletList',
      label: '•',
      title: '无序列表',
      isActive: () => editor.isActive('bulletList'),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleBulletList().run());
      },
      className: 'format-button bullet-list'
    },
    {
      name: 'orderedList',
      label: '1.',
      title: '有序列表',
      isActive: () => editor.isActive('orderedList'),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        safeExecuteCommand(() => editor.chain().focus().toggleOrderedList().run());
      },
      className: 'format-button ordered-list'
    }
  ];

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        arrow: true,
        theme: 'light-border',
        interactive: true,
        appendTo: () => {
          // 安全地获取或创建容器
          let container = document.getElementById('bubble-menu-container');
          if (!container) {
            container = document.createElement('div');
            container.id = 'bubble-menu-container';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.zIndex = '1000';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);
          }
          return container;
        },
        zIndex: 1000,
        onShow: () => {
          // 确保菜单显示时保持文本选择
          // 返回 void 表示允许显示
        },
        onHide: () => {
          // 允许菜单隐藏
          // 返回 void 表示允许隐藏
        }
      }}
      shouldShow={({ editor, state }) => {
        // 只在有文本选择时显示
        const { selection } = state;
        const { empty } = selection;

        // 如果没有选择文本，不显示菜单
        if (empty) {
          return false;
        }

        // 如果选择的是链接，不显示格式化菜单（避免与链接菜单冲突）
        if (editor.isActive('link')) {
          return false;
        }

        return true;
      }}
      className="text-format-bubble-menu"
    >
      <div className="bubble-menu-container">
        {/* 文本格式化按钮 */}
        <div className="button-group">
          {formatButtons.map((button) => (
            <button
              key={button.name}
              onMouseDown={(e) => {
                e.preventDefault(); // 防止失去焦点
              }}
              onClick={button.onClick}
              className={`${button.className} ${button.isActive() ? 'active' : ''}`}
              title={button.title}
              type="button"
            >
              {button.label}
            </button>
          ))}
        </div>

        <div className="divider" />

        {/* 标题按钮 */}
        <div className="button-group">
          {headingButtons.map((button) => (
            <button
              key={button.name}
              onMouseDown={(e) => {
                e.preventDefault(); // 防止失去焦点
              }}
              onClick={button.onClick}
              className={`${button.className} ${button.isActive() ? 'active' : ''}`}
              title={button.title}
              type="button"
            >
              {button.label}
            </button>
          ))}
        </div>

        <div className="divider" />

        {/* 块级元素按钮 */}
        <div className="button-group">
          {blockButtons.map((button) => (
            <button
              key={button.name}
              onMouseDown={(e) => {
                e.preventDefault(); // 防止失去焦点
              }}
              onClick={button.onClick}
              className={`${button.className} ${button.isActive() ? 'active' : ''}`}
              title={button.title}
              type="button"
            >
              {button.label}
            </button>
          ))}
        </div>

        <div className="divider" />

        {/* 列表按钮 */}
        <div className="button-group">
          {listButtons.map((button) => (
            <button
              key={button.name}
              onMouseDown={(e) => {
                e.preventDefault(); // 防止失去焦点
              }}
              onClick={button.onClick}
              className={`${button.className} ${button.isActive() ? 'active' : ''}`}
              title={button.title}
              type="button"
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </BubbleMenu>
  );
};
