import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';

interface SuggestionBubbleMenuProps {
  editor: Editor;
}

export const SuggestionBubbleMenu: React.FC<SuggestionBubbleMenuProps> = ({ editor }) => {
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动聚焦到输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 处理建议提交
  const handleSuggestionSubmit = useCallback(async () => {
    if (!suggestion.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 点击提交建议后不执行任何操作
      console.log('提交建议:', suggestion.trim());
      
      // 清空输入框并重置状态
      setSuggestion('');

    } catch (error) {
      console.error('建议提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [suggestion, isSubmitting]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSuggestionSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // 清除选区，隐藏气泡菜单
      const { to } = editor.state.selection;
      editor.commands.setTextSelection(to);
    }
  }, [handleSuggestionSubmit, editor]);

  return (
    <div className="suggestion-bubble-menu">
      <div className="suggestion-bubble-menu-content">
        <div className="suggestion-bubble-menu-item">
          <input
            ref={inputRef}
            type="text"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入对划词内容的修改建议..."
            className="suggestion-bubble-menu-input"
            disabled={isSubmitting}
          />
        </div>
        <div className="suggestion-bubble-menu-item">
          <button
            onClick={handleSuggestionSubmit}
            disabled={!suggestion.trim() || isSubmitting}
            className="suggestion-bubble-menu-button primary"
          >
            {isSubmitting ? '处理中...' : '提交建议'}
          </button>
        </div>
      </div>
    </div>
  );
};
