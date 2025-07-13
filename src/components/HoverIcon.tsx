import React, { useRef } from 'react';
import type { IconStyle, HighlightStyle, LockedHighlight, BubbleCardState } from '../hooks/useHoverIcon';
import { BubbleCard } from './BubbleCard';
import './HoverIcon.css';

interface HoverIconProps {
  iconStyle: IconStyle;
  highlightStyle: HighlightStyle;
  lockedHighlight: LockedHighlight | null;
  bubbleCardState: BubbleCardState;
  onIconClick: () => void;
  onIconMouseEnter: () => void;
  onIconMouseLeave: () => void;
  onBubbleCardSubmit: (inputText: string) => void;
  onBubbleCardClose: () => void;
}

export const HoverIcon: React.FC<HoverIconProps> = ({
  iconStyle,
  highlightStyle,
  lockedHighlight,
  bubbleCardState,
  onIconClick,
  onIconMouseEnter,
  onIconMouseLeave,
  onBubbleCardSubmit,
  onBubbleCardClose,
}) => {
  const iconRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* 锁定的高亮背景覆盖层 */}
      {lockedHighlight && (
        <div
          className="text-node-highlight locked"
          style={lockedHighlight.style}
        />
      )}

      {/* 悬浮时的高亮背景覆盖层 */}
      <div
        className="text-node-highlight"
        style={highlightStyle}
      />

      {/* 块级元素悬浮图标容器 */}
      <div
        className="paragraph-hover-icon-container"
        style={iconStyle}
      >
        {/* 图标本身 */}
        <div
          ref={iconRef}
          className="paragraph-hover-icon"
          onClick={onIconClick}
          onMouseEnter={onIconMouseEnter}
          onMouseLeave={onIconMouseLeave}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3.5V12.5M3.5 8H12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 气泡卡片 - 相对于图标容器定位 */}
        {bubbleCardState.isVisible && (
          <BubbleCard
            isVisible={bubbleCardState.isVisible}
            position={bubbleCardState.position}
            isLoading={bubbleCardState.isLoading}
            onSubmit={onBubbleCardSubmit}
            onClose={onBubbleCardClose}
            iconRef={iconRef}
          />
        )}
      </div>
    </>
  );
};
