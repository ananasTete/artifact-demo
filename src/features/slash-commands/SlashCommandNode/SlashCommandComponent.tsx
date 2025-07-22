import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { CommandsList } from '../CommandsList';
import { getCommands } from './commands.ts';
import type { CommandItem } from '../../shared/types/commands';
import './SlashCommandComponent.css';

export const SlashCommandComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}) => {
  const [query, setQuery] = useState(node.attrs.query || '');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showMenu] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const clickPositionRef = useRef<number | null>(null);
  const spaceCountRef = useRef<number>(0);
  const isComposingRef = useRef<boolean>(false);


  // 获取过滤后的命令列表
  const filteredCommands = getCommands().filter((item: CommandItem) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  // 监听编辑器点击事件来记录点击位置
  useEffect(() => {
    const handleEditorClick = (event: MouseEvent) => {
      const editorView = editor.view;
      const pos = editorView.posAtCoords({ left: event.clientX, top: event.clientY });
      if (pos) {
        clickPositionRef.current = pos.pos;
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('mousedown', handleEditorClick);

    return () => {
      editorElement.removeEventListener('mousedown', handleEditorClick);
    };
  }, [editor]);

  // 自动聚焦输入框
  useEffect(() => {
    // 使用 setTimeout 确保在 DOM 更新后聚焦
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // 将光标移到末尾
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        );
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 退出节点的通用函数
  const exitNode = useCallback((removeTrailingSpace = false) => {
    const pos = getPos();
    if (pos !== undefined) {
      // 获取输入框中的实际内容
      let inputContent = inputRef.current?.value || '/';

      // 如果需要移除尾随空格（双空格退出时）
      if (removeTrailingSpace && inputContent.endsWith(' ')) {
        inputContent = inputContent.slice(0, -1);
      }

      // 删除节点并插入内容，然后设置光标位置
      deleteNode();

      // 在下一个事件循环中插入内容和设置光标
      setTimeout(() => {
        editor
          .chain()
          .focus()
          .insertContentAt(pos, inputContent)
          .setTextSelection(pos + inputContent.length)
          .run();
      }, 0);
    }
  }, [editor, getPos, deleteNode]);

  // 处理失去焦点时退出节点
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // 检查焦点是否移动到菜单项
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isMenuClick = relatedTarget?.closest('.slash-command-menu');

    if (!isMenuClick) {
      // 失去焦点时用输入框中的内容替换节点
      const pos = getPos();
      if (pos !== undefined) {
        // 使用 setTimeout 来延迟执行，让编辑器先处理点击事件
        setTimeout(() => {
          const clickPosition = clickPositionRef.current;
          // 获取输入框中的实际内容
          const inputContent = inputRef.current?.value || '/';

          // 删除节点
          deleteNode();

          // 插入内容并设置光标位置
          setTimeout(() => {
            if (clickPosition !== null && clickPosition !== pos) {
              // 如果点击位置在节点之后，需要调整位置
              const contentLengthDiff = inputContent.length - 1;
              const adjustedPosition = clickPosition > pos ?
                clickPosition + contentLengthDiff : clickPosition;

              editor
                .chain()
                .focus()
                .insertContentAt(pos, inputContent)
                .setTextSelection(adjustedPosition)
                .run();
            } else {
              // 设置到替换内容的末尾
              editor
                .chain()
                .focus()
                .insertContentAt(pos, inputContent)
                .setTextSelection(pos + inputContent.length)
                .run();
            }
          }, 0);

          // 清除记录的点击位置
          clickPositionRef.current = null;
        }, 0);
      }
    }
  }, [editor, getPos, deleteNode]);

  // 更新节点属性
  useEffect(() => {
    updateAttributes({ query });
  }, [query, updateAttributes]);

  // 重置选中索引当命令列表变化时
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // 执行命令
  const executeCommand = useCallback((command: CommandItem) => {
    const pos = getPos();
    if (pos === undefined) return;

    // 删除当前节点
    deleteNode();

    // 执行命令
    const range = { from: pos, to: pos + 1 };
    command.command({ editor, range });
  }, [editor, deleteNode, getPos]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 如果不是空格键，重置空格计数
    if (e.key !== ' ') {
      spaceCountRef.current = 0;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (filteredCommands.length > 0 && filteredCommands[selectedIndex]) {
          // 如果有匹配的命令，执行命令
          executeCommand(filteredCommands[selectedIndex]);
        } else {
          // 如果没有匹配的命令，退出节点并插入输入内容
          exitNode();
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        deleteNode();
        break;
      
      case ' ': {
        // 如果正在使用输入法，不要拦截空格键
        if (isComposingRef.current) {
          return;
        }

        e.preventDefault();
        // 检测连续两次空格（无时间间隔限制）
        spaceCountRef.current += 1;

        // 连续两次空格则退出节点，并移除尾随空格
        if (spaceCountRef.current >= 2) {
          exitNode(true); // 传递 true 来移除尾随空格
          return;
        }

        // 单次空格则正常添加到输入内容
        const currentValue = inputRef.current?.value || '';
        const newValue = currentValue + ' ';
        if (inputRef.current) {
          inputRef.current.value = newValue;
          // 手动触发 onChange 事件来更新 query 状态
          const event = new Event('input', { bubbles: true });
          inputRef.current.dispatchEvent(event);
        }
        break;
      }
      
      case 'Backspace':
        if (query === '') {
          e.preventDefault();
          deleteNode();
        }
        break;
    }
  }, [query, selectedIndex, filteredCommands, executeCommand, deleteNode, exitNode]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 确保输入始终以 / 开头
    if (value.startsWith('/')) {
      setQuery(value.slice(1)); // 移除 / 前缀存储查询
    } else if (value === '') {
      setQuery('');
    }
  }, []);

  // 处理输入法开始
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  // 处理输入法结束
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
  }, []);

  // 处理命令选择
  const handleCommandSelect = useCallback((command: CommandItem) => {
    executeCommand(command);
  }, [executeCommand]);

  return (
    <NodeViewWrapper className="slash-command-wrapper">
      <div className="slash-command-container">
        <input
          ref={inputRef}
          type="text"
          className="slash-command-input"
          value={`/${query}`}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="/"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          autoFocus
          onBlur={handleBlur}
        />
        
        {showMenu && (
          <div className="slash-command-menu">
            {filteredCommands.length > 0 ? (
              <CommandsList
                items={filteredCommands}
                command={handleCommandSelect}
                selectedIndex={selectedIndex}
              />
            ) : query && (
              <div className="no-commands-hint">
                <div className="hint-text">
                  没有找到匹配的命令
                </div>
                <div className="hint-action">
                  按 <kbd>Enter</kbd> 插入文本，或按 <kbd>Esc</kbd> 取消
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
