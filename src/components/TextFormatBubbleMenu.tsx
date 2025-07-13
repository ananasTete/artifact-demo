import React from "react";
import { BubbleMenu } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

interface TextFormatBubbleMenuProps {
  editor: Editor;
}

export const TextFormatBubbleMenu: React.FC<TextFormatBubbleMenuProps> = ({
  editor,
}) => {
  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <div className="bubble-menu">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
        >
          粗体
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
        >
          斜体
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}
        >
          下划线
        </button>
      </div>
    </BubbleMenu>
  );
};
