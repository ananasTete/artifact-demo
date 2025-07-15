import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { marked } from 'marked';
import { SlashCommandNode } from './extensions/SlashCommandNode';
import { MarkdownPaste } from './extensions/MarkdownPaste';
import { SelectionHighlight } from './extensions/SelectionHighlight';
import { FixedTitleNode } from './extensions/FixedTitleNode';
import { LinkHoverMenu } from './components/LinkHoverMenu';
import { CustomTextSelectionMenu } from './components/CustomTextSelectionMenu';
import { HoverIcon } from './components/HoverIcon';
import { useHoverIcon } from './hooks/useHoverIcon';

import './components/CustomTextSelectionMenu.css';

interface TiptapProps {
  markdown: string;
}

const Tiptap = ({ markdown }: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit, // 保留完整的StarterKit功能，包括标题
      Link.configure({
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      SelectionHighlight,
      SlashCommandNode,
      MarkdownPaste,
      FixedTitleNode.configure({
        placeholder: '标题',
      }),
    ],
    content: `<h1 data-fixed-title="true"></h1>${marked(markdown)}`,
    editable: true,
  });

  const {
    iconStyle,
    highlightStyle,
    lockedHighlight,
    bubbleCardState,
    handleMouseMove,
    handleMouseLeave,
    handleIconClick,
    handleIconMouseEnter,
    handleIconMouseLeave,
    handleBubbleCardSubmit,
    handleBubbleCardClose,
  } = useHoverIcon(editor?.view);

  // 添加鼠标移动事件处理
  useEffect(() => {
    if (editor?.view) {
      const handleDOMMouseMove = (event: MouseEvent) => {
        handleMouseMove(editor.view, event);
      };

      const editorElement = editor.view.dom;
      editorElement.addEventListener('mousemove', handleDOMMouseMove);

      // 将编辑器实例添加到全局对象，方便调试（仅在开发环境）
      if (typeof window !== 'undefined' && import.meta.env.DEV) {
        (window as any).editor = editor;
      }

      return () => {
        editorElement.removeEventListener('mousemove', handleDOMMouseMove);
      };
    }
  }, [editor, handleMouseMove]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-wrapper" onMouseLeave={handleMouseLeave}>
      <LinkHoverMenu editor={editor} />
      <CustomTextSelectionMenu editor={editor} />

      <HoverIcon
        iconStyle={iconStyle}
        highlightStyle={highlightStyle}
        lockedHighlight={lockedHighlight}
        bubbleCardState={bubbleCardState}
        onIconClick={handleIconClick}
        onIconMouseEnter={handleIconMouseEnter}
        onIconMouseLeave={handleIconMouseLeave}
        onBubbleCardSubmit={handleBubbleCardSubmit}
        onBubbleCardClose={handleBubbleCardClose}
      />

      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
