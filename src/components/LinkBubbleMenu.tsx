import React, { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

interface LinkBubbleMenuProps {
  editor: Editor;
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // 获取当前链接的信息
  const getCurrentLinkInfo = useCallback(() => {
    const { from, to } = editor.state.selection;
    const attrs = editor.getAttributes('link');

    // 如果没有选择文本，尝试扩展到整个链接范围
    let linkText = '';
    if (from === to && attrs.href) {
      // 光标在链接内，获取整个链接的文本
      const { state } = editor;
      const { doc } = state;
      const resolvedPos = doc.resolve(from);
      const linkMark = resolvedPos.marks().find(mark => mark.type.name === 'link');
      if (linkMark) {
        // 找到链接标记的范围
        let start = from;
        let end = from;

        // 向前查找链接的开始
        while (start > 0) {
          const prevPos = doc.resolve(start - 1);
          const prevMarks = prevPos.marks();
          if (!prevMarks.some(mark => mark.type.name === 'link' && mark.attrs.href === attrs.href)) {
            break;
          }
          start--;
        }

        // 向后查找链接的结束
        while (end < doc.content.size) {
          const nextPos = doc.resolve(end);
          const nextMarks = nextPos.marks();
          if (!nextMarks.some(mark => mark.type.name === 'link' && mark.attrs.href === attrs.href)) {
            break;
          }
          end++;
        }

        linkText = doc.textBetween(start, end);
      }
    } else {
      linkText = editor.state.doc.textBetween(from, to);
    }

    return {
      url: attrs.href || '',
      text: linkText || '',
    };
  }, [editor]);

  // 进入编辑模式
  const handleEdit = useCallback(() => {
    const linkInfo = getCurrentLinkInfo();
    setLinkUrl(linkInfo.url);
    setLinkText(linkInfo.text);
    setIsEditing(true);
  }, [getCurrentLinkInfo]);

  // 复制链接
  const handleCopy = useCallback(async () => {
    const linkInfo = getCurrentLinkInfo();
    try {
      await navigator.clipboard.writeText(linkInfo.url);
      // 可以添加一个提示消息
      console.log('链接已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, [getCurrentLinkInfo]);

  // 保存链接编辑
  const handleSave = useCallback(() => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      
      // 如果文本也改变了，更新文本内容
      if (linkText && linkText !== getCurrentLinkInfo().text) {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .insertContent(linkText)
          .run();
      }
    }
    setIsEditing(false);
  }, [editor, linkUrl, linkText, getCurrentLinkInfo]);

  // 删除链接
  const handleRemove = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsEditing(false);
  }, [editor]);

  // 取消编辑
  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const currentLinkInfo = getCurrentLinkInfo();

  if (isEditing) {
    // 编辑状态的菜单
    return (
      <div className="link-bubble-menu editing">
        <div className="link-bubble-menu-item">
          <span className="link-bubble-menu-label">链接</span>
        </div>
        <div className="link-bubble-menu-item">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入链接地址"
            className="link-bubble-menu-input"
            autoFocus
          />
        </div>
        <div className="link-bubble-menu-item">
          <span className="link-bubble-menu-label">链接标题</span>
        </div>
        <div className="link-bubble-menu-item">
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入链接显示文本"
            className="link-bubble-menu-input"
          />
        </div>
        <div className="link-bubble-menu-divider" />
        <div className="link-bubble-menu-item">
          <button
            onClick={handleRemove}
            className="link-bubble-menu-button danger"
          >
            删除链接
          </button>
        </div>
      </div>
    );
  }

  // 默认状态的菜单
  return (
    <div className="link-bubble-menu">
      <div className="link-bubble-menu-item url">
        <span className="link-bubble-menu-url">{currentLinkInfo.url}</span>
      </div>
      <div className="link-bubble-menu-item">
        <button
          onClick={handleEdit}
          className="link-bubble-menu-button"
        >
          编辑
        </button>
      </div>
      <div className="link-bubble-menu-item">
        <button
          onClick={handleCopy}
          className="link-bubble-menu-button"
        >
          复制
        </button>
      </div>
    </div>
  );
};
