import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import type { Editor } from '@tiptap/react';

interface LinkHoverMenuProps {
  editor: Editor;
}

interface MenuState {
  visible: boolean;
  x: number;
  y: number;
  linkUrl: string;
  linkText: string;
  linkElement: HTMLElement | null;
  linkPosition: { from: number; to: number } | null;
}

// 防抖 hook
const useDebounce = <T extends unknown[]>(callback: (...args: T) => void, delay: number) => {
  const timeoutRef = useRef<number | null>(null);

  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

export const LinkHoverMenu: React.FC<LinkHoverMenuProps> = ({ editor }) => {
  const [menuState, setMenuState] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    linkUrl: '',
    linkText: '',
    linkElement: null,
    linkPosition: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [needsRepositioning, setNeedsRepositioning] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editingMenuRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const ignoreHoverRef = useRef<boolean>(false);

  // 获取链接信息
  const getLinkInfo = useCallback((element: HTMLElement) => {
    const href = element.getAttribute('href') || '';
    const text = element.textContent || '';
    return { url: href, text };
  }, []);

  // 获取链接在编辑器中的位置
  const getLinkPosition = useCallback((linkElement: HTMLElement): { from: number; to: number } | null => {
    const { state } = editor;
    const { doc } = state;
    const linkUrl = linkElement.getAttribute('href') || '';

    let linkPos: { from: number; to: number } | null = null;
    doc.descendants((node, pos) => {
      if (node.marks) {
        const linkMark = node.marks.find(mark =>
          mark.type.name === 'link' && mark.attrs.href === linkUrl
        );
        if (linkMark && !linkPos) {
          linkPos = { from: pos, to: pos + node.nodeSize };
          return false;
        }
      }
    });

    return linkPos;
  }, [editor]);

  // 获取菜单的实际尺寸（动态测量）
  const getMenuDimensions = useCallback(() => {
    // 根据当前模式选择正确的 ref
    const currentMenuRef = isEditing ? editingMenuRef : menuRef;

    if (!currentMenuRef.current) {
      // 如果菜单还没有渲染，返回默认尺寸
      return { width: 280, height: isEditing ? 200 : 90 };
    }

    const rect = currentMenuRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, [isEditing]);

  // 计算菜单位置，处理边缘遮挡
  const calculateMenuPosition = useCallback((linkElement: HTMLElement) => {
    const rect = linkElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 使用实际测量的菜单尺寸
    const { width: menuWidth, height: menuHeight } = getMenuDimensions();

    const padding = 10; // 距离屏幕边缘的最小距离
    const gap = 8; // 菜单与链接之间的间距

    // 默认位置：链接下方居中
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + gap;

    // 处理水平方向的边缘遮挡
    if (x - menuWidth / 2 < padding) {
      // 左边缘遮挡，调整到左边缘 + padding
      x = padding + menuWidth / 2;
    } else if (x + menuWidth / 2 > viewportWidth - padding) {
      // 右边缘遮挡，调整到右边缘 - padding
      x = viewportWidth - padding - menuWidth / 2;
    }

    // 处理垂直方向的边缘遮挡
    if (y + menuHeight > viewportHeight - padding) {
      // 下方空间不足，显示在链接上方
      y = rect.top - menuHeight - gap;

      // 如果上方空间也不足，则显示在视口内最佳位置
      if (y < padding) {
        // 如果上下都不够，优先选择空间更大的一侧
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow > spaceAbove) {
          // 下方空间更大，显示在下方但限制在视口内
          y = rect.bottom + gap;
          if (y + menuHeight > viewportHeight - padding) {
            y = viewportHeight - padding - menuHeight;
          }
        } else {
          // 上方空间更大，显示在上方
          y = padding;
        }
      }
    }

    return { x, y };
  }, [getMenuDimensions]);

  // 显示菜单
  const showMenu = useCallback((_event: MouseEvent, linkElement: HTMLElement) => {
    try {
      // 检查链接元素是否仍然在 DOM 中
      if (!linkElement || !document.contains(linkElement)) {
        return;
      }

      const { url, text } = getLinkInfo(linkElement);
      const position = getLinkPosition(linkElement);

      setMenuState({
        visible: true,
        x: -9999, // 先设置到屏幕外，等待重新定位
        y: -9999,
        linkUrl: url,
        linkText: text,
        linkElement: linkElement,
        linkPosition: position,
      });
      setIsEditing(false);
      setNeedsRepositioning(true); // 标记需要重新定位
    } catch (error) {

    }
  }, [getLinkInfo, getLinkPosition]);

  // 隐藏菜单
  const hideMenu = useCallback(() => {
    // 如果当前是编辑模式，不响应鼠标移出事件
    if (isEditing) {
      return;
    }

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setMenuState(prev => ({
        ...prev,
        visible: false,
        linkElement: null,
        linkPosition: null
      }));
      setIsEditing(false);
    }, 100);
  }, [isEditing]);

  // 取消隐藏菜单
  const cancelHideMenu = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // 统一的菜单定位逻辑，避免多个 useLayoutEffect 冲突
  useLayoutEffect(() => {
    // 检查是否需要重新定位菜单
    const currentMenuRef = isEditing ? editingMenuRef : menuRef;
    const shouldReposition = (needsRepositioning || isEditing) &&
                             menuState.visible &&
                             menuState.linkElement &&
                             currentMenuRef.current;

    if (shouldReposition) {
      // 使用 requestAnimationFrame 确保 DOM 更新完成后再计算位置
      const updatePosition = () => {
        try {
          // 再次检查元素是否仍然存在
          if (menuState.linkElement && document.contains(menuState.linkElement) && currentMenuRef.current) {
            const { x, y } = calculateMenuPosition(menuState.linkElement);
            setMenuState(prev => ({
              ...prev,
              x,
              y
            }));
            setNeedsRepositioning(false);
          }
        } catch (error) {

          // 如果定位失败，隐藏菜单
          setMenuState(prev => ({
            ...prev,
            visible: false,
            linkElement: null,
            linkPosition: null
          }));
          setNeedsRepositioning(false);
        }
      };

      requestAnimationFrame(updatePosition);
    }
  }, [needsRepositioning, isEditing, menuState.visible, menuState.linkElement, calculateMenuPosition]);

  // 处理链接悬停
  useEffect(() => {
    const editorElement = editor.view.dom;

    const handleMouseEnter = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && target.classList.contains('tiptap-link')) {
        // 如果正在忽略悬停事件，则直接返回
        if (ignoreHoverRef.current) {
          return;
        }
        cancelHideMenu();
        showMenu(event as MouseEvent, target);
      }
    };

    const handleMouseLeave = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && target.classList.contains('tiptap-link')) {
        hideMenu();
      }
    };

    // 使用事件委托
    editorElement.addEventListener('mouseover', handleMouseEnter);
    editorElement.addEventListener('mouseout', handleMouseLeave);

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseEnter);
      editorElement.removeEventListener('mouseout', handleMouseLeave);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [editor, showMenu, hideMenu, cancelHideMenu]);

  // 处理窗口大小变化，重新计算菜单位置
  useEffect(() => {
    const handleResize = () => {
      if (menuState.visible && menuState.linkElement) {
        const { x, y } = calculateMenuPosition(menuState.linkElement);
        setMenuState(prev => ({
          ...prev,
          x,
          y
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [menuState.visible, menuState.linkElement, calculateMenuPosition]);

  // 处理编辑模式时的页面滚动阻止
  useEffect(() => {
    if (isEditing) {
      // 进入编辑模式时阻止页面滚动
      document.body.classList.add('no-scroll');
    } else {
      // 退出编辑模式时恢复页面滚动
      document.body.classList.remove('no-scroll');
    }

    // 清理函数：确保组件卸载时恢复滚动
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isEditing]);

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      // 清理所有定时器
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // 重置所有状态
      setMenuState({
        visible: false,
        x: 0,
        y: 0,
        linkUrl: '',
        linkText: '',
        linkElement: null,
        linkPosition: null,
      });
      setIsEditing(false);
      setNeedsRepositioning(false);

      // 恢复页面滚动
      document.body.classList.remove('no-scroll');
    };
  }, []);

  // 处理菜单悬停
  const handleMenuMouseEnter = useCallback(() => {
    cancelHideMenu();
  }, [cancelHideMenu]);

  const handleMenuMouseLeave = useCallback(() => {
    // 如果当前是编辑模式，不响应鼠标移出事件
    if (isEditing) {
      return;
    }
    hideMenu();
  }, [hideMenu, isEditing]);

  // 编辑链接
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // 复制链接
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(menuState.linkUrl);

      hideMenu();
    } catch (err) {

    }
  }, [menuState.linkUrl, hideMenu]);

  // 删除链接
  const handleRemove = useCallback(() => {
    if (menuState.linkPosition) {
      const { from, to } = menuState.linkPosition;
      const tr = editor.state.tr;
      tr.removeMark(from, to, editor.state.schema.marks.link);
      editor.view.dispatch(tr);
    } else {
      // 备用方法：使用 Tiptap 的命令
      editor.chain().focus().unsetLink().run();
    }
    setIsEditing(false);
    // 立即隐藏菜单，而不是等待延迟
    setMenuState(prev => ({
      ...prev,
      visible: false,
      linkElement: null,
      linkPosition: null
    }));
  }, [editor, menuState.linkPosition]);

  // 优化的链接更新逻辑
  const updateLink = useCallback((newUrl: string, newText: string) => {
    if (!menuState.linkPosition) {
      return;
    }

    const { from, to } = menuState.linkPosition;

    // 使用 Tiptap 的链式命令来简化更新逻辑
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .command(({ tr, state }) => {
        // 如果文本改变了，替换内容
        if (newText && newText !== menuState.linkText) {
          tr.replaceWith(from, to, state.schema.text(newText));

          // 更新位置信息
          const newTo = from + newText.length;
          setMenuState(prev => ({
            ...prev,
            linkPosition: { from, to: newTo },
            linkText: newText,
            linkUrl: newUrl
          }));
        } else {
          // 只更新 URL
          setMenuState(prev => ({
            ...prev,
            linkUrl: newUrl
          }));
        }

        return true;
      })
      .run();

    // 设置或移除链接标记
    if (newUrl) {
      const newTo = newText && newText !== menuState.linkText
        ? from + newText.length
        : to;
      editor.chain().focus().setTextSelection({ from, to: newTo }).setLink({ href: newUrl }).run();
    } else {
      editor.chain().focus().setTextSelection({ from, to }).unsetLink().run();
    }
  }, [editor, menuState.linkPosition, menuState.linkText]);

  // 防抖的更新函数
  const debouncedUpdateLink = useDebounce(updateLink, 300);

  // 保存编辑（现在主要用于关闭编辑模式）
  const handleSave = useCallback(() => {
    setIsEditing(false);

    // 设置忽略悬停事件标志位，防止菜单意外重新出现
    ignoreHoverRef.current = true;

    // 立即隐藏菜单，而不是通过延迟的 hideMenu
    setMenuState(prev => ({
      ...prev,
      visible: false,
      linkElement: null,
      linkPosition: null
    }));

    // 200ms 后恢复悬停事件响应
    setTimeout(() => {
      ignoreHoverRef.current = false;
    }, 200);
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleSave(); // 使用 handleSave 来确保一致的关闭行为
    }
  }, [handleSave]);

  // 处理遮罩层点击事件
  const handleOverlayClick = useCallback(() => {
    if (isEditing) {
      handleSave();
    }
  }, [isEditing, handleSave]);

  // 阻止编辑面板点击事件冒泡
  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // 统一的渲染逻辑，始终返回组件但用 CSS 控制可见性
  try {
    return (
      <>
        {/* 编辑模式：全屏遮罩层 */}
        <div
          className="link-hover-menu-overlay"
          onClick={handleOverlayClick}
          style={{
            display: isEditing && menuState.visible ? 'block' : 'none',
          }}
        >
          <div
            ref={editingMenuRef}
            className={`link-hover-menu editing`}
            style={{
              position: 'fixed',
              left: menuState.x,
              top: menuState.y,
              transform: 'translateX(-50%)',
              zIndex: 1001,
            }}
            onClick={handleMenuClick}
          >
            <div className="link-bubble-menu editing">
              <div className="link-bubble-menu-item">
                <span className="link-bubble-menu-label">链接</span>
              </div>
              <div className="link-bubble-menu-item">
                <input
                  type="url"
                  value={menuState.linkUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    // 使用防抖更新
                    debouncedUpdateLink(newUrl, menuState.linkText);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入链接地址"
                  className="link-bubble-menu-input"
                  autoFocus={isEditing && menuState.visible}
                />
              </div>
              <div className="link-bubble-menu-item">
                <span className="link-bubble-menu-label">链接标题</span>
              </div>
              <div className="link-bubble-menu-item">
                <input
                  type="text"
                  value={menuState.linkText}
                  onChange={(e) => {
                    const newText = e.target.value;
                    // 使用防抖更新
                    debouncedUpdateLink(menuState.linkUrl, newText);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入链接显示文本"
                  className="link-bubble-menu-input"
                />
              </div>
              <div className="link-bubble-menu-divider" />
              <div className="link-bubble-menu-item">
                <button
                  onClick={handleRemove}
                  className="link-bubble-menu-button danger"
                >
                  删除链接
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 非编辑模式：悬停菜单 */}
        <div
          ref={menuRef}
          className={`link-hover-menu`}
          style={{
            position: 'fixed',
            left: menuState.x,
            top: menuState.y,
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: !isEditing && menuState.visible ? 'block' : 'none',
          }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="link-bubble-menu">
            <div className="link-bubble-menu-item url">
              <span className="link-bubble-menu-url">{menuState.linkUrl}</span>
            </div>
            <div className="link-bubble-menu-item">
              <button
                onClick={handleEdit}
                className="link-bubble-menu-button"
              >
                编辑
              </button>
            </div>
            <div className="link-bubble-menu-item">
              <button
                onClick={handleCopy}
                className="link-bubble-menu-button"
              >
                复制
              </button>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {

    // 发生错误时重置状态
    setMenuState(prev => ({
      ...prev,
      visible: false,
      linkElement: null,
      linkPosition: null
    }));
    setIsEditing(false);

    // 返回隐藏的占位元素，避免返回 null
    return (
      <div style={{ display: 'none' }} />
    );
  }
};
