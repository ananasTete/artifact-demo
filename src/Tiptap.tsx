import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { marked } from 'marked';
import { SlashCommands } from './extensions/SlashCommands';
import { MarkdownPaste } from './extensions/MarkdownPaste';
import { LinkHoverMenu } from './components/LinkHoverMenu';
import { TextFormatBubbleMenu } from './components/TextFormatBubbleMenu';
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

  if (!editor) {
    return null;
  }

  return (
    <div>
      <LinkHoverMenu editor={editor} />
      <TextFormatBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
