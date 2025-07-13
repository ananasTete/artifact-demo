import React, { useState, useRef, useEffect } from 'react';
import './BubbleCard.css';

interface BubbleCardProps {
  isVisible: boolean;
  position: {
    top: string;
    right: string;
  };
  onSubmit: (inputText: string) => void;
  onClose: () => void;
  isLoading?: boolean;
  iconRef?: React.RefObject<HTMLDivElement>; // 添加 icon 引用，用于点击检测
}

export const BubbleCard: React.FC<BubbleCardProps> = ({
  isVisible,
  position,
  onSubmit,
  onClose,
  isLoading = false,
  iconRef,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 当卡片显示时自动聚焦输入框
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // 点击卡片外部时关闭卡片
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 如果点击的是卡片内部，不关闭
      if (cardRef.current && cardRef.current.contains(target)) {
        return;
      }

      // 如果点击的是 icon，不关闭卡片
      if (iconRef?.current && iconRef.current.contains(target)) {
        return;
      }

      // 点击其他区域时关闭卡片
      onClose();
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose, iconRef]);

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (inputText.trim() && !isLoading) {
      onSubmit(inputText.trim());
      setInputText(''); // 清空输入框
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={cardRef}
      className="bubble-card"
    >
      <div className="bubble-card-content">
        <input
          ref={inputRef}
          type="text"
          className="bubble-card-input"
          placeholder="输入处理指令..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          className="bubble-card-submit"
          onClick={handleSubmit}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8L14 8M14 8L8 2M14 8L8 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
