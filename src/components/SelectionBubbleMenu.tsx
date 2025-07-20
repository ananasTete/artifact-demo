import React, { useState, useRef, useEffect, useCallback } from "react";
import { BubbleMenu, isTextSelection } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import {
  persistentHighlightPluginKey,
  type PersistentHighlightState,
} from "../extensions/PersistentSelectionHighlight";
import { posToDOMRect } from "@tiptap/core";

interface SelectionBubbleMenuProps {
  editor: Editor;
}

export const SelectionBubbleMenu: React.FC<SelectionBubbleMenuProps> = ({
  editor,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the state of our custom highlight plugin
  const [highlightState, setHighlightState] = useState<PersistentHighlightState>({
    isActive: false,
    from: null,
    to: null,
  });

  useEffect(() => {
    const updateHighlightState = () => {
      const state = persistentHighlightPluginKey.getState(editor.state);
      if (state) {
        setHighlightState(state);
      }
    };
    editor.on("transaction", updateHighlightState);
    return () => {
      editor.off("transaction", updateHighlightState);
    };
  }, [editor]);


  // 当显示输入框时自动聚焦
  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSetPersistentHighlight = () => {
    editor.chain().setPersistentSelection().run();
    setShowInput(true);
  };

  // 处理输入框提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // 这里可以调用 API 或执行其他操作
      console.log("提交的内容:", inputValue);

      // 模拟 API 调用，替换选中的文本
      const { from, to } = editor.state.selection;
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(inputValue)
        .run();

      // 重置状态
      setInputValue("");
      setShowInput(false);
      editor.chain().focus().clearPersistentSelection().run();
    }
  };


  const getReferenceClientRect = useCallback(() => {
    if (highlightState.isActive && highlightState.from && highlightState.to) {
      return posToDOMRect(editor.view, highlightState.from, highlightState.to);
    }
    const { from, to } = editor.state.selection;
    return posToDOMRect(editor.view, from, to);
  }, [editor.view, highlightState]);

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        hideOnClick: false, // Keep menu open when clicking inside it
        getReferenceClientRect,
        onHidden: () => {
          setShowInput(false);
          editor.chain().focus().clearPersistentSelection().run();
        },
      }}
      shouldShow={({ state }) => {
        const hasTextSelection = isTextSelection(state.selection) && state.selection.from !== state.selection.to;
        return hasTextSelection || highlightState.isActive;
      }}
    >
      <div className="bubble-menu-container">
        {!showInput ? (
          // 默认的格式化按钮
          <div className="bubble-menu-buttons">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`bubble-btn ${
                editor.isActive("bold") ? "active" : ""
              }`}
              title="加粗"
            >
              <strong>B</strong>
            </button>

            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`bubble-btn ${
                editor.isActive("italic") ? "active" : ""
              }`}
              title="斜体"
            >
              <em>I</em>
            </button>

            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`bubble-btn ${
                editor.isActive("strike") ? "active" : ""
              }`}
              title="删除线"
            >
              <s>S</s>
            </button>

            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`bubble-btn ${
                editor.isActive("code") ? "active" : ""
              }`}
              title="行内代码"
            >
              {"</>"}
            </button>

            <div className="bubble-divider" />

            <button
              onClick={handleSetPersistentHighlight}
              className="bubble-btn bubble-input-btn"
              title="输入替换文本"
            >
              ✏️
            </button>
          </div>
        ) : (
          // 输入框模式
          <form onSubmit={handleSubmit} className="bubble-input-form">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入替换文本..."
              className="bubble-input"
            />
            <div className="bubble-input-actions">
              <button
                type="submit"
                className="bubble-btn bubble-submit"
                disabled={!inputValue.trim()}
              >
                ✓
              </button>
            </div>
          </form>
        )}
      </div>
    </BubbleMenu>
  );
};
