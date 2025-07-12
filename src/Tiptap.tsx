import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { marked } from 'marked';
import { SlashCommands } from './extensions/SlashCommands';
import { MarkdownPaste } from './extensions/MarkdownPaste';
import { LinkHoverMenu } from './components/LinkHoverMenu';
import { SuggestionBubbleMenu } from './components/SuggestionBubbleMenu';

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
      {/* 建议气泡菜单 - 仅当有文本被选中时才显示 */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        shouldShow={({ state }) => {
          const { from, to } = state.selection;
          return from !== to;
        }}
      >
        <SuggestionBubbleMenu editor={editor} />
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
