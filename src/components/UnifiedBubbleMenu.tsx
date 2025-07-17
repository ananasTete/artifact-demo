import React, { useRef, useEffect } from 'react';
import {
  MenuState,
  TriggerSource
} from '../types/unifiedMenu';
import type {
  UnifiedMenuState,
  MenuEventHandlers,
  MenuConfig
} from '../types/unifiedMenu';
import './UnifiedBubbleMenu.css';

interface UnifiedBubbleMenuProps {
  state: UnifiedMenuState;
  config: MenuConfig;
  handlers: MenuEventHandlers;
  onUserInputChange: (input: string) => void;
}

export const UnifiedBubbleMenu: React.FC<UnifiedBubbleMenuProps> = ({
  state,
  config,
  handlers,
  onUserInputChange,
}) => {
  const mainMenuRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 当AI模式显示时自动聚焦输入框
  useEffect(() => {
    if (state.currentState === MenuState.AI_MODE && aiInputRef.current) {
      aiInputRef.current.focus();
    }
  }, [state.currentState]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 如果点击的是菜单内部，不关闭
      if (mainMenuRef.current && mainMenuRef.current.contains(target)) {
        return;
      }

      // 点击其他区域时关闭菜单
      handlers.onClose();
    };

    if (state.isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.isVisible, handlers.onClose]);

  // 阻止页面滚动
  useEffect(() => {
    if (state.currentState === MenuState.AI_MODE) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [state.currentState]);

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (state.userInput.trim()) {
        handlers.onAIInputSubmit(state.userInput.trim());
      }
    } else if (event.key === 'Escape') {
      if (state.currentState === MenuState.AI_MODE) {
        handlers.onBack();
      } else {
        handlers.onClose();
      }
    }
  };

  if (!state.isVisible) {
    return null;
  }

  return (
    <>
      {/* 遮罩层（仅在AI模式时显示） */}
      {state.currentState === MenuState.AI_MODE && (
        <div ref={overlayRef} className="unified-menu-overlay" />
      )}

      {/* 主菜单 */}
      {state.currentState === MenuState.MAIN && (
        <div
          ref={mainMenuRef}
          className="unified-bubble-menu main-menu"
          style={{
            position: 'absolute',
            left: `${state.layout.mainMenu.left}px`,
            top: `${state.layout.mainMenu.top}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="menu-buttons">
            {/* AI按钮 */}
            <button
              onClick={handlers.onAIClick}
              className="menu-button ai-button"
              title="AI助手"
            >
              AI
            </button>

            <div className="menu-divider" />

            {/* 节点类型按钮 */}
            {config.nodeTypes.map((nodeType) => (
              <button
                key={nodeType.id}
                onClick={() => handlers.onNodeTypeClick(nodeType.command, nodeType.level)}
                className="menu-button node-type-button"
                title={nodeType.label}
              >
                {nodeType.icon}
              </button>
            ))}

            {/* 格式化按钮（仅在划词时显示） */}
            {state.triggerSource === TriggerSource.TEXT_SELECTION && (
              <>
                <div className="menu-divider" />
                {config.formatOptions.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handlers.onFormatClick(format.command)}
                    className="menu-button format-button"
                    title={format.label}
                  >
                    {format.icon === 'B' && <strong>B</strong>}
                    {format.icon === 'I' && <em>I</em>}
                    {format.icon === 'S' && <s>S</s>}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* AI模式：输入菜单和指令菜单同时显示 */}
      {state.currentState === MenuState.AI_MODE && (
        <>
          {/* AI输入菜单 */}
          <div
            className="unified-bubble-menu ai-input-menu"
            style={{
              position: 'absolute',
              left: `${state.layout.aiInputMenu.left}px`,
              top: `${state.layout.aiInputMenu.top}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="ai-input-content">
              <input
                ref={aiInputRef}
                type="text"
                className="ai-input-field"
                placeholder="输入AI指令..."
                value={state.userInput}
                onChange={(e) => onUserInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={state.isLoading}
              />
              <button
                className="ai-input-submit"
                onClick={() => handlers.onAIInputSubmit(state.userInput)}
                disabled={!state.userInput.trim() || state.isLoading}
              >
                {state.isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
              <button
                className="ai-input-back"
                onClick={handlers.onBack}
                title="返回"
              >
                ←
              </button>
            </div>
          </div>

          {/* AI指令菜单 */}
          <div
            className="unified-bubble-menu ai-command-menu"
            style={{
              position: 'absolute',
              left: `${state.layout.aiCommandMenu.left}px`,
              top: `${state.layout.aiCommandMenu.top}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="ai-commands">
              {/* 智写组 */}
              <div className="command-group">
                <div className="group-title">智写</div>
                <div className="command-buttons">
                  {config.aiCommands
                    .filter(cmd => cmd.category === 'writing')
                    .map((command) => (
                      <button
                        key={command.id}
                        onClick={() => handlers.onAICommandClick(command.id)}
                        className="command-button"
                        disabled={state.isLoading}
                      >
                        {command.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* AI工具组 */}
              <div className="command-group">
                <div className="group-title">AI工具</div>
                <div className="command-buttons">
                  {config.aiCommands
                    .filter(cmd => cmd.category === 'tools')
                    .map((command) => (
                      <button
                        key={command.id}
                        onClick={() => handlers.onAICommandClick(command.id)}
                        className="command-button"
                        disabled={state.isLoading}
                      >
                        {command.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
