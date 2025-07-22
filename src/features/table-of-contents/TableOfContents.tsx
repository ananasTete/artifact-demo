import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import './TableOfContents.css';

interface TocItem {
  id: string;
  level: number;
  text: string;
  position: number;
}

interface TableOfContentsProps {
  editor: Editor | null;
  onItemClick?: (position: number) => void;
}

export const TableOfContents = ({ editor, onItemClick }: TableOfContentsProps) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // 提取标题并生成目录
  const extractHeadings = () => {
    if (!editor) return [];

    const headings: TocItem[] = [];
    let headingCounter = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level || 1;
        const text = node.textContent;

        if (text.trim()) {
          headingCounter++;
          headings.push({
            id: `heading-${headingCounter}`,
            level,
            text: text.trim(),
            position: pos,
          });
        }
      }
    });

    return headings;
  };

  // 监听编辑器内容变化
  useEffect(() => {
    if (!editor) return;

    const updateToc = () => {
      const headings = extractHeadings();
      setTocItems(headings);
    };

    // 初始化
    updateToc();

    // 监听编辑器更新
    const handleUpdate = () => {
      updateToc();
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);

  // 滚动到指定位置
  const scrollToHeading = (position: number) => {
    if (!editor) return;

    // 先设置光标位置，但不立即聚焦
    editor.commands.setTextSelection(position);

    // 立即计算滚动位置并执行滚动
    const editorElement = editor.view.dom;
    const selection = editor.state.selection;
    const resolvedPos = editor.state.doc.resolve(selection.from);

    // 找到对应的 DOM 元素
    const domPos = editor.view.domAtPos(resolvedPos.pos);
    if (domPos.node) {
      const element = domPos.node.nodeType === Node.TEXT_NODE
        ? domPos.node.parentElement
        : domPos.node as Element;

      if (element) {
        // 找到编辑器容器（具有滚动能力的父容器）
        const editorContainer = editorElement.closest('.editor-container') as HTMLElement;

        if (editorContainer) {
          // 计算元素相对于编辑器容器的位置
          const elementRect = element.getBoundingClientRect();
          const containerRect = editorContainer.getBoundingClientRect();

          // 计算需要滚动的距离，确保元素在容器顶部附近显示
          const targetScrollTop = editorContainer.scrollTop + (elementRect.top - containerRect.top) - 20;

          // 确保滚动位置不会超出范围
          const maxScrollTop = editorContainer.scrollHeight - editorContainer.clientHeight;
          const scrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

          // 平滑滚动到目标位置
          editorContainer.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          });

          // 滚动完成后再聚焦编辑器，避免焦点变化导致的额外滚动
          setTimeout(() => {
            editor.commands.focus();
          }, 300); // 等待滚动动画完成
        } else {
          // 如果找不到编辑器容器，使用默认的 scrollIntoView
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });

          // 延迟聚焦
          setTimeout(() => {
            editor.commands.focus();
          }, 300);
        }
      }
    }

    onItemClick?.(position);
  };

  // 检测当前激活的标题
  useEffect(() => {
    if (!editor || tocItems.length === 0) return;

    const handleSelectionUpdate = () => {
      const { from } = editor.state.selection;
      
      // 找到当前光标位置对应的标题
      let currentHeading = '';
      for (let i = tocItems.length - 1; i >= 0; i--) {
        if (from >= tocItems[i].position) {
          currentHeading = tocItems[i].id;
          break;
        }
      }
      
      setActiveId(currentHeading);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    handleSelectionUpdate(); // 初始化

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, tocItems]);

  if (tocItems.length === 0) {
    return (
      <div className="table-of-contents">
        <div className="toc-header">目录</div>
        <div className="toc-empty">暂无标题</div>
      </div>
    );
  }

  return (
    <div className="table-of-contents">
      <div className="toc-header">目录</div>
      <nav className="toc-nav">
        {tocItems.map((item) => (
          <button
            key={item.id}
            className={`toc-item toc-level-${item.level} ${
              activeId === item.id ? 'toc-active' : ''
            }`}
            onClick={() => scrollToHeading(item.position)}
            title={item.text}
          >
            <span className="toc-text">{item.text}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
