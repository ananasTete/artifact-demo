import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { marked } from "marked";
import { CustomHeading } from "./extensions/CustomHeading";
import { SlashCommandNode } from "./extensions/SlashCommandNode";
import { MarkdownPaste } from "./extensions/MarkdownPaste";
import { ProtectedFirstHeading } from "./extensions/ProtectedFirstHeading";
import { CustomPlaceholder } from "./extensions/CustomPlaceholder";
import { PersistentSelectionHighlight } from "./extensions/PersistentSelectionHighlight";
import { LinkHoverMenu } from "./components/LinkHoverMenu";
import { SelectionBubbleMenu } from "./components/SelectionBubbleMenu";
import "./components/SelectionBubbleMenu.css";
import { NodeHoverIcon } from "./components/NodeHoverIcon";

interface TiptapProps {
  markdown: string;
  onEditorReady?: (editor: Editor) => void;
}

// TODO 之后确认标题需不需要添加到目录里

const Tiptap = ({ markdown, onEditorReady }: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 禁用 StarterKit 中的 Heading，使用我们的 CustomHeading
        heading: false,
      }),
      CustomHeading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      Link.extend({
        inclusive: false, // 防止光标在链接末尾时自动扩展链接
      }).configure({
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      CustomPlaceholder.configure({
        placeholder: ({ node, pos }) => {
          // 检查是否是第一个节点（位置为0的一级标题）
          if (
            node.type.name === "heading" &&
            node.attrs.level === 1 &&
            pos === 0
          ) {
            return "标题";
          }
          return "输入正文，输入“/”执行命令，点击”空格“执行AI生文，点击“TAB“执行切换元素标题";
        },
      }),
      SlashCommandNode,
      MarkdownPaste,
      ProtectedFirstHeading,
      PersistentSelectionHighlight,
    ],
    content: `<h1></h1>${marked(markdown)}`,
    editable: true,
  });

  // 编辑器准备就绪回调
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-wrapper">
      <LinkHoverMenu editor={editor} />
      <SelectionBubbleMenu editor={editor} />
      <NodeHoverIcon editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
