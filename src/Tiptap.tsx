import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { marked } from 'marked';
import { SlashCommands } from './extensions/SlashCommands';
import { MarkdownPaste } from './extensions/MarkdownPaste';
import { LinkHoverMenu } from './components/LinkHoverMenu';
import { TextFormatBubbleMenu } from './components/TextFormatBubbleMenu';
import { HoverIcon } from './components/HoverIcon';
import { useHoverIcon } from './hooks/useHoverIcon';
import './components/TextFormatBubbleMenu.css';

interface TiptapProps {
  markdown: string;
}

const Tiptap = ({ markdown }: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      SlashCommands,
      MarkdownPaste,
    ],
    content: marked(markdown),
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
      <TextFormatBubbleMenu editor={editor} />

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
