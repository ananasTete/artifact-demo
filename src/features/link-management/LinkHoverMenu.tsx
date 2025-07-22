import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
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

const INITIAL_MENU_STATE: MenuState = {
  visible: false,
  x: 0,
  y: 0,
  linkUrl: '',
  linkText: '',
  linkElement: null,
  linkPosition: null,
};


export const LinkHoverMenu: React.FC<LinkHoverMenuProps> = ({ editor }) => {
  const [menuState, setMenuState] = useState<MenuState>(INITIAL_MENU_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [needsRepositioning, setNeedsRepositioning] = useState(false);
  const [editingUrl, setEditingUrl] = useState('');
  const [editingText, setEditingText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const editingMenuRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const ignoreHoverRef = useRef<boolean>(false);

  // 公共的状态重置函数
  const resetMenuState = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      visible: false,
      linkElement: null,
      linkPosition: null
    }));
  }, []);

  // 获取链接信息（优化版本）
  const getLinkInfo = useCallback((element: HTMLElement) => {
    const href = element.getAttribute('href') || '';
    const text = element.textContent || '';
    return { url: href, text };
  }, []);

  // 获取链接在编辑器中的位置（优化版本）
  const getLinkPosition = useCallback((linkElement: HTMLElement): { from: number; to: number } | null => {
    const { state } = editor;
    const { doc } = state;
    const linkUrl = linkElement.getAttribute('href') || '';

    if (!linkUrl) return null;

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

  // 缓存菜单尺寸配置
  const menuDimensions = useMemo(() => ({
    default: { width: 280, height: 90 },
    editing: { width: 280, height: 200 }
  }), []);

  // 获取菜单的实际尺寸（动态测量）
  const getMenuDimensions = useCallback(() => {
    const currentMenuRef = isEditing ? editingMenuRef : menuRef;

    if (!currentMenuRef.current) {
      return isEditing ? menuDimensions.editing : menuDimensions.default;
    }

    const rect = currentMenuRef.current.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, [isEditing, menuDimensions]);

  // 缓存常用的计算常量
  const positionConstants = useMemo(() => ({
    padding: 10,
    gap: 8
  }), []);

  // 计算水平位置，处理左右边缘
  const calculateHorizontalPosition = useCallback((
    linkRect: DOMRect,
    wrapperRect: DOMRect,
    menuWidth: number,
    padding: number
  ) => {
    const relativeLinkLeft = linkRect.left - wrapperRect.left;
    const viewportWidth = window.innerWidth;

    let x = relativeLinkLeft + linkRect.width / 2;
    const menuAbsoluteLeft = wrapperRect.left + x - menuWidth / 2;

    if (menuAbsoluteLeft < padding) {
      x = padding - wrapperRect.left + menuWidth / 2;
    } else if (menuAbsoluteLeft + menuWidth > viewportWidth - padding) {
      x = (viewportWidth - padding) - wrapperRect.left - menuWidth / 2;
    }

    return x;
  }, []);

  // 计算垂直位置，处理上下边缘
  const calculateVerticalPosition = useCallback((
    linkRect: DOMRect,
    wrapperRect: DOMRect,
    menuHeight: number,
    padding: number,
    gap: number
  ) => {
    const relativeLinkTop = linkRect.top - wrapperRect.top;
    const viewportHeight = window.innerHeight;

    let y = relativeLinkTop + linkRect.height + gap;
    const menuAbsoluteBottom = wrapperRect.top + y + menuHeight;

    if (menuAbsoluteBottom > viewportHeight - padding) {
      y = relativeLinkTop - menuHeight - gap;

      const menuAbsoluteTop = wrapperRect.top + y;
      if (menuAbsoluteTop < padding) {
        const spaceBelow = viewportHeight - linkRect.bottom;
        const spaceAbove = linkRect.top;

        if (spaceBelow > spaceAbove) {
          y = relativeLinkTop + linkRect.height + gap;
          if (wrapperRect.top + y + menuHeight > viewportHeight - padding) {
            y = (viewportHeight - padding) - wrapperRect.top - menuHeight;
          }
        } else {
          y = padding - wrapperRect.top;
        }
      }
    }

    return y;
  }, []);

  // 计算菜单位置，处理边缘遮挡
  const calculateMenuPosition = useCallback((linkElement: HTMLElement) => {
    const editorWrapper = document.querySelector('.editor-wrapper');
    if (!editorWrapper) {
      return { x: 0, y: 0 };
    }

    const linkRect = linkElement.getBoundingClientRect();
    const wrapperRect = editorWrapper.getBoundingClientRect();
    const { width: menuWidth, height: menuHeight } = getMenuDimensions();

    const x = calculateHorizontalPosition(linkRect, wrapperRect, menuWidth, positionConstants.padding);
    const y = calculateVerticalPosition(linkRect, wrapperRect, menuHeight, positionConstants.padding, positionConstants.gap);

    return { x, y };
  }, [getMenuDimensions, calculateHorizontalPosition, calculateVerticalPosition, positionConstants]);

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
      console.error("Error showing menu:", error);
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
      resetMenuState();
      setIsEditing(false);
    }, 100);
  }, [isEditing, resetMenuState]);

  // 取消隐藏菜单
  const cancelHideMenu = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // 统一的菜单定位逻辑，避免多个 useLayoutEffect 冲突
  useLayoutEffect(() => {
    const currentMenuRef = isEditing ? editingMenuRef : menuRef;
    const shouldReposition = (needsRepositioning || isEditing) &&
                             menuState.visible &&
                             menuState.linkElement &&
                             currentMenuRef.current;

    if (shouldReposition) {
      const updatePosition = () => {
        try {
          if (menuState.linkElement && document.contains(menuState.linkElement) && currentMenuRef.current) {
            const { x, y } = calculateMenuPosition(menuState.linkElement);
            setMenuState(prev => ({
              ...prev,
              x,
              y
            }));
            setNeedsRepositioning(false);
          } else {
            resetMenuState();
            setNeedsRepositioning(false);
          }
        } catch {
          resetMenuState();
          setNeedsRepositioning(false);
        }
      };

      requestAnimationFrame(updatePosition);
    }
  }, [needsRepositioning, isEditing, menuState.visible, menuState.linkElement, calculateMenuPosition, resetMenuState]);

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
      setMenuState(INITIAL_MENU_STATE);
      setIsEditing(false);
      setNeedsRepositioning(false);

      // 恢复页面滚动
      document.body.classList.remove('no-scroll');
    };
  }, []);

  // 优化的菜单悬停处理
  const menuEventHandlers = useMemo(() => ({
    onMouseEnter: () => cancelHideMenu(),
    onMouseLeave: () => {
      if (!isEditing) {
        hideMenu();
      }
    }
  }), [cancelHideMenu, hideMenu, isEditing]);

  // 编辑链接
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditingUrl(menuState.linkUrl); // 初始化编辑URL
    setEditingText(menuState.linkText); // 初始化编辑文本
  }, [menuState.linkUrl, menuState.linkText]);

  // 复制链接
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(menuState.linkUrl);
      hideMenu();
    } catch {
      // 静默处理复制失败
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
    resetMenuState();
  }, [editor, menuState.linkPosition, resetMenuState]);

  // 保存编辑（现在主要用于关闭编辑模式）
  const handleSave = useCallback(() => {
    setIsEditing(false);

    ignoreHoverRef.current = true;
    resetMenuState();

    setTimeout(() => {
      ignoreHoverRef.current = false;
    }, 200);
  }, [resetMenuState]);

  // 优化的链接更新逻辑 - 避免选择和光标定位
  const updateLink = useCallback((newUrl: string, newText: string) => {
    if (!menuState.linkPosition) {
      return;
    }

    const { from, to } = menuState.linkPosition;

    // 使用 Transaction 直接更新，避免选择链接节点
    const tr = editor.state.tr;

    // 如果需要更新文本内容
    if (newText && newText !== menuState.linkText) {
      // 替换文本内容
      tr.replaceWith(from, to, editor.state.schema.text(newText));

      // 计算新的结束位置
      const finalTo = from + newText.length;

      // 更新链接标记
      if (newUrl) {
        tr.addMark(from, finalTo, editor.state.schema.marks.link.create({ href: newUrl }));
      }

      // 更新本地状态
      setMenuState(prev => ({
        ...prev,
        linkPosition: { from, to: finalTo },
        linkText: newText,
        linkUrl: newUrl
      }));
    } else {
      // 只更新 URL，不改变文本
      if (newUrl) {
        // 移除旧的链接标记并添加新的
        tr.removeMark(from, to, editor.state.schema.marks.link);
        tr.addMark(from, to, editor.state.schema.marks.link.create({ href: newUrl }));
      } else {
        // 移除链接标记
        tr.removeMark(from, to, editor.state.schema.marks.link);
      }

      // 更新本地状态
      setMenuState(prev => ({
        ...prev,
        linkUrl: newUrl
      }));
    }

    // 应用事务，不设置选择状态，让编辑器保持当前状态
    editor.view.dispatch(tr);
  }, [editor, menuState.linkPosition, menuState.linkText]);

  // 处理更新按钮点击
  const handleUpdate = useCallback(() => {
    updateLink(editingUrl, editingText);
    handleSave(); // 更新后关闭编辑模式
  }, [updateLink, editingUrl, editingText, handleSave]);

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
            zIndex: 1000, // 调整 z-index，使其低于编辑菜单
          }}
        />

        {/* 编辑模式：编辑菜单 */}
        <div
          ref={editingMenuRef}
          className={`link-hover-menu editing`}
          style={{
            position: 'absolute',
            left: menuState.x,
            top: menuState.y,
            transform: 'translateX(-50%)',
            zIndex: 1001,
            display: isEditing && menuState.visible ? 'block' : 'none', // 控制可见性
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
                value={editingUrl}
                onChange={(e) => setEditingUrl(e.target.value)}
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
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入链接显示文本"
                className="link-bubble-menu-input"
              />
            </div>
            <div className="link-bubble-menu-divider" />
            <div className="link-bubble-menu-item">
              <button
                onClick={handleUpdate} // 新增更新按钮
                className="link-bubble-menu-button"
              >
                更新
              </button>
            </div>
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

        {/* 非编辑模式：悬停菜单 */}
        <div
          ref={menuRef}
          className={`link-hover-menu`}
          style={{
            position: 'absolute',
            left: menuState.x,
            top: menuState.y,
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: !isEditing && menuState.visible ? 'block' : 'none',
          }}
          onMouseEnter={menuEventHandlers.onMouseEnter}
          onMouseLeave={menuEventHandlers.onMouseLeave}
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
    console.error("Error rendering LinkHoverMenu:", error); // 添加错误日志

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
