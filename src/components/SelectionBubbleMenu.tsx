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
  const [showConfirmationMenu, setShowConfirmationMenu] = useState(false);
  const [submittedValue, setSubmittedValue] = useState("");
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
      setSubmittedValue(inputValue.trim());
      setShowInput(false);
      setShowConfirmationMenu(true);
    }
  };

  const handleReplace = () => {
    const { from, to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(submittedValue)
      .run();
    
    // 重置所有状态并关闭菜单
    setInputValue("");
    setSubmittedValue("");
    setShowInput(false);
    setShowConfirmationMenu(false);
    editor.chain().focus().clearPersistentSelection().run();
  };

  const handleDiscard = () => {
    // 重置所有状态并关闭菜单
    setInputValue("");
    setSubmittedValue("");
    setShowInput(false);
    setShowConfirmationMenu(false);
    editor.chain().focus().clearPersistentSelection().run();
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
          setShowConfirmationMenu(false); // 隐藏时也关闭确认菜单
          editor.chain().focus().clearPersistentSelection().run();
        },
      }}
      shouldShow={({ state }) => {
        const hasTextSelection = isTextSelection(state.selection) && state.selection.from !== state.selection.to;
        return hasTextSelection || highlightState.isActive || showConfirmationMenu;
      }}
    >
      <div className="bubble-menu-container">
        {!showInput && !showConfirmationMenu ? (
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
        ) : showInput ? (
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
        ) : (
          // 确认菜单模式
          <div className="bubble-confirmation-menu">
            <div className="confirmation-text">{submittedValue}</div>
            <div className="confirmation-actions">
              <button
                onClick={handleReplace}
                className="bubble-btn bubble-replace"
              >
                替换
              </button>
              <button
                onClick={handleDiscard}
                className="bubble-btn bubble-discard"
              >
                弃用
              </button>
            </div>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
};
