import React, { useState, useRef, useEffect, useCallback } from "react";
import { BubbleMenu, isTextSelection } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import type { Transaction } from "prosemirror-state";
import {
  persistentHighlightPluginKey,
  type PersistentHighlightState,
} from "../extensions/PersistentSelectionHighlight";
import { posToDOMRect } from "@tiptap/core";
import "./SelectionBubbleMenu.css";

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
  const [menuMode, setMenuMode] = useState<"replace" | "insert">("replace"); // 'replace' or 'insert'
  const inputRef = useRef<HTMLInputElement>(null);

  // Use ref to track showInput state immediately for shouldShow function
  const showInputRef = useRef(false);

  // Ref for the bubble menu container to detect outside clicks
  const bubbleMenuRef = useRef<HTMLDivElement>(null);

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

    const handleTransaction = ({
      transaction,
    }: {
      transaction: Transaction;
    }) => {
      if (!transaction.docChanged) return;

      const { selection } = editor.state;
      const { $from } = selection;

      // Check for insert mode trigger: typing a space on an empty line
      if (
        selection.empty &&
        $from.parent.isTextblock &&
        $from.parent.content.size === 1 &&
        $from.parent.textContent === ' '
      ) {
        // First set the ref to immediately track the state
        showInputRef.current = true;

        // Then set the React state
        setMenuMode('insert');
        setShowInput(true);

        // Then delete the space in the next tick
        setTimeout(() => {
          editor.chain().deleteRange({ from: $from.pos - 1, to: $from.pos }).run();
        }, 0);
      }
    };

    editor.on("transaction", updateHighlightState);
    editor.on("transaction", handleTransaction);

    return () => {
      editor.off("transaction", updateHighlightState);
      editor.off("transaction", handleTransaction);
    };
  }, [editor]);


  // 当显示输入框时自动聚焦
  useEffect(() => {
    if (showInput && inputRef.current) {
      // 使用 setTimeout 确保 DOM 更新完成后再聚焦
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [showInput]);

  // 处理点击外部关闭气泡
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (showInput || showConfirmationMenu) &&
        bubbleMenuRef.current &&
        !bubbleMenuRef.current.contains(event.target as Node)
      ) {
        // 关闭气泡菜单
        setShowInput(false);
        showInputRef.current = false;
        setShowConfirmationMenu(false);
        setInputValue("");
        setSubmittedValue("");
        // 清除持久选择但不强制聚焦编辑器
        editor.chain().clearPersistentSelection().run();
      }
    };

    if (showInput || showConfirmationMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInput, showConfirmationMenu, editor]);

  const handleSetPersistentHighlight = () => {
    setMenuMode("replace");
    editor.chain().setPersistentSelection().run();
    setShowInput(true);
  };

  // 处理输入框提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSubmittedValue(inputValue.trim());
      setShowInput(false);
      showInputRef.current = false;
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
    showInputRef.current = false;
    setShowConfirmationMenu(false);
    editor.chain().focus().clearPersistentSelection().run();
  };

  const handleInsert = () => {
    editor.chain().focus().insertContent(submittedValue).run();

    // 重置所有状态并关闭菜单
    setInputValue("");
    setSubmittedValue("");
    setShowInput(false);
    showInputRef.current = false;
    setShowConfirmationMenu(false);
    editor.chain().focus().clearPersistentSelection().run();
  };

  const handleDiscard = () => {
    // 重置所有状态并关闭菜单
    setInputValue("");
    setSubmittedValue("");
    setShowInput(false);
    showInputRef.current = false;
    setShowConfirmationMenu(false);
    editor.chain().focus().clearPersistentSelection().run();
  };

  // 获取当前节点类型
  const getCurrentNodeType = () => {
    if (editor.isActive("heading", { level: 1 })) return "heading1";
    if (editor.isActive("heading", { level: 2 })) return "heading2";
    if (editor.isActive("heading", { level: 3 })) return "heading3";
    if (editor.isActive("heading", { level: 4 })) return "heading4";
    if (editor.isActive("heading", { level: 5 })) return "heading5";
    if (editor.isActive("bulletList")) return "bulletList";
    if (editor.isActive("orderedList")) return "orderedList";
    if (editor.isActive("code")) return "code";
    if (editor.isActive("blockquote")) return "blockquote";
    return "paragraph";
  };

  // 处理节点类型变化
  const handleNodeTypeChange = (nodeType: string) => {
    switch (nodeType) {
      case "paragraph":
        editor.chain().focus().setParagraph().run();
        break;
      case "heading1":
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case "heading2":
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case "heading3":
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case "heading4":
        editor.chain().focus().toggleHeading({ level: 4 }).run();
        break;
      case "heading5":
        editor.chain().focus().toggleHeading({ level: 5 }).run();
        break;
      case "bulletList":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "orderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "code":
        editor.chain().focus().toggleCode().run();
        break;
      case "blockquote":
        editor.chain().focus().toggleBlockquote().run();
        break;
    }
  };

  // 获取当前对齐方式
  const getCurrentAlignment = () => {
    if (editor.isActive({ textAlign: "left" })) return "left";
    if (editor.isActive({ textAlign: "center" })) return "center";
    if (editor.isActive({ textAlign: "right" })) return "right";
    return "";
  };

  // 处理对齐方式变化
  const handleAlignmentChange = (alignment: string) => {
    if (alignment === "") {
      editor.chain().focus().unsetTextAlign().run();
    } else {
      editor.chain().focus().setTextAlign(alignment).run();
    }
  };

  // 获取当前文字颜色
  const getCurrentTextColor = () => {
    const { color } = editor.getAttributes('textStyle');
    return color || "";
  };

  // 处理文字颜色变化
  const handleTextColorChange = (color: string) => {
    if (color === "") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  };

  // 获取当前背景颜色
  const getCurrentBackgroundColor = () => {
    const { color } = editor.getAttributes('highlight');
    return color || "";
  };

  // 处理背景颜色变化
  const handleBackgroundColorChange = (color: string) => {
    if (color === "") {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
  };

  // 处理AI工具点击
  const handleAIToolClick = (toolName: string) => {
    // 可以在这里添加具体的AI工具逻辑
    // 例如：调用不同的AI API，或者设置不同的输入提示
    setInputValue(`使用${toolName}功能: `);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };


  const getReferenceClientRect = useCallback(() => {
    if (highlightState.isActive && highlightState.from && highlightState.to) {
      return posToDOMRect(editor.view, highlightState.from, highlightState.to);
    }
    const { from, to } = editor.state.selection;
    return posToDOMRect(editor.view, from, to);
  }, [editor.view, editor.state.selection, highlightState]);

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        hideOnClick: false, // Keep menu open when clicking inside it
        getReferenceClientRect,
        onHidden: () => {
          setShowInput(false);
          showInputRef.current = false;
          setShowConfirmationMenu(false); // 隐藏时也关闭确认菜单
          editor.chain().focus().clearPersistentSelection().run();
        },
      }}
      shouldShow={({ state }) => {
        const hasTextSelection = isTextSelection(state.selection) && state.selection.from !== state.selection.to;
        const shouldShowMenu = hasTextSelection || highlightState.isActive || showInput || showConfirmationMenu || showInputRef.current;
        return shouldShowMenu;
      }}
    >
      <div className="bubble-menu-container" ref={bubbleMenuRef}>
        {!showInput && !showConfirmationMenu ? (
          // 默认的格式化按钮
          <div className="bubble-menu-buttons">
            {/* 第一组：替换文本按钮 */}
            <button
              onClick={handleSetPersistentHighlight}
              className="bubble-btn bubble-input-btn"
              title="输入替换文本"
            >
              ✏️
            </button>

            <div className="bubble-divider" />

            {/* 第二组：节点类型、对齐方式、文字颜色、背景颜色 */}
            <select
              className="bubble-select"
              value={getCurrentNodeType()}
              onChange={(e) => handleNodeTypeChange(e.target.value)}
              title="节点类型"
            >
              <option value="paragraph">文本</option>
              <option value="heading1">一级标题</option>
              <option value="heading2">二级标题</option>
              <option value="heading3">三级标题</option>
              <option value="heading4">四级标题</option>
              <option value="heading5">五级标题</option>
              <option value="bulletList">无序列表</option>
              <option value="orderedList">有序列表</option>
              <option value="code">行内代码</option>
              <option value="blockquote">引用</option>
            </select>

            <select
              className="bubble-select"
              value={getCurrentAlignment()}
              onChange={(e) => handleAlignmentChange(e.target.value)}
              title="对齐方式"
            >
              <option value="">默认</option>
              <option value="left">左对齐</option>
              <option value="center">居中对齐</option>
              <option value="right">右对齐</option>
            </select>

            <select
              className="bubble-select"
              value={getCurrentTextColor()}
              onChange={(e) => handleTextColorChange(e.target.value)}
              title="文字颜色"
            >
              <option value="">默认</option>
              <option value="#000000" style={{color: '#000000'}}>黑色</option>
              <option value="#374151" style={{color: '#374151'}}>深灰</option>
              <option value="#6b7280" style={{color: '#6b7280'}}>灰色</option>
              <option value="#9ca3af" style={{color: '#9ca3af'}}>浅灰</option>
              <option value="#ef4444" style={{color: '#ef4444'}}>红色</option>
              <option value="#f97316" style={{color: '#f97316'}}>橙色</option>
              <option value="#eab308" style={{color: '#eab308'}}>黄色</option>
              <option value="#22c55e" style={{color: '#22c55e'}}>绿色</option>
              <option value="#3b82f6" style={{color: '#3b82f6'}}>蓝色</option>
              <option value="#8b5cf6" style={{color: '#8b5cf6'}}>紫色</option>
              <option value="#ec4899" style={{color: '#ec4899'}}>粉色</option>
            </select>

            <select
              className="bubble-select"
              value={getCurrentBackgroundColor()}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              title="背景颜色"
            >
              <option value="">无背景</option>
              <option value="#f3f4f6" style={{backgroundColor: '#f3f4f6'}}>浅灰背景</option>
              <option value="#fee2e2" style={{backgroundColor: '#fee2e2'}}>浅红背景</option>
              <option value="#fed7aa" style={{backgroundColor: '#fed7aa'}}>浅橙背景</option>
              <option value="#fef3c7" style={{backgroundColor: '#fef3c7'}}>浅黄背景</option>
              <option value="#dcfce7" style={{backgroundColor: '#dcfce7'}}>浅绿背景</option>
              <option value="#dbeafe" style={{backgroundColor: '#dbeafe'}}>浅蓝背景</option>
              <option value="#e9d5ff" style={{backgroundColor: '#e9d5ff'}}>浅紫背景</option>
              <option value="#fce7f3" style={{backgroundColor: '#fce7f3'}}>浅粉背景</option>
            </select>

            <div className="bubble-divider" />

            {/* 第三组：加粗、斜体、删除线、下划线 */}
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
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`bubble-btn ${
                editor.isActive("underline") ? "active" : ""
              }`}
              title="下划线"
            >
              <u>U</u>
            </button>
          </div>
        ) : showInput ? (
          // 输入框模式
          <div className="bubble-input-container">
            {/* 输入框块 */}
            <div className="input-block">
              <form onSubmit={handleSubmit} className="bubble-input-form">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="说说你的想法"
                  className="bubble-input"
                />
                <div className="bubble-input-actions">
                  <button
                    type="submit"
                    className="bubble-btn bubble-submit"
                    disabled={!inputValue.trim()}
                  >
                    ↑
                  </button>
                </div>
              </form>
            </div>

            {/* AI工具列表块 */}
            {menuMode === "replace" && (
            <div className="ai-tools-block">
              <div className="ai-tools-category">
                <div className="category-title">智写</div>
                <div className="ai-tools-list">
                  <div className="ai-tool-item" onClick={() => handleAIToolClick('润色')}>
                    <span className="tool-icon">🎨</span>
                    <span className="tool-name">润色</span>
                  </div>
                  <div className="ai-tool-item" onClick={() => handleAIToolClick('扩写')}>
                    <span className="tool-icon">🔄</span>
                    <span className="tool-name">扩写</span>
                  </div>
                  <div className="ai-tool-item" onClick={() => handleAIToolClick('简写')}>
                    <span className="tool-icon">😊</span>
                    <span className="tool-name">简写</span>
                  </div>
                  <div className="ai-tool-item" onClick={() => handleAIToolClick('续写')}>
                    <span className="tool-icon">📝</span>
                    <span className="tool-name">续写</span>
                  </div>
                </div>
              </div>

              <div className="ai-tools-category">
                <div className="category-title">AI工具</div>
                <div className="ai-tools-list">
                  <div className="ai-tool-item" onClick={() => handleAIToolClick('仿写')}>
                    <span className="tool-icon">📋</span>
                    <span className="tool-name">仿写</span>
                  </div>
                  <div className="ai-tool-item" onClick={() => handleAIToolClick('改写')}>
                    <span className="tool-icon">🔧</span>
                    <span className="tool-name">改写</span>
                  </div>
                  <div className="ai-tool-item" onClick={() => handleAIToolClick('解析内容')}>
                    <span className="tool-icon">🔍</span>
                    <span className="tool-name">解析内容</span>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        ) : (
          // 确认菜单模式
          <div className="bubble-confirmation-menu">
            <div className="confirmation-text">{submittedValue}</div>
            <div className="confirmation-actions">
              {menuMode === "replace" ? (
                <button
                  onClick={handleReplace}
                  className="bubble-btn bubble-replace"
                >
                  替换
                </button>
              ) : (
                <button
                  onClick={handleInsert}
                  className="bubble-btn bubble-replace" // Note: You might want a different class for 'insert'
                >
                  插入
                </button>
              )}
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
