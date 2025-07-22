import { useState, type RefObject } from 'react';
import type { Editor } from '@tiptap/react';
import { useToc } from './useToc';
import type { TocItem } from './useToc';
import './EnhancedTableOfContents.css';

interface EnhancedTableOfContentsProps {
  editor: Editor | null;
  scrollContainerRef: RefObject<HTMLElement | null>;
  onItemClick?: (id: string) => void;
  collapsible?: boolean;
  showNumbers?: boolean;
  maxLevel?: number;
}

export const EnhancedTableOfContents = ({
  editor,
  scrollContainerRef,
  onItemClick,
  collapsible = true,
  showNumbers = false,
  maxLevel = 6,
}: EnhancedTableOfContentsProps) => {
  const { tocItems, activeId } = useToc(editor, scrollContainerRef, maxLevel);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const scrollToHeading = (id: string) => {
    if (!editor) return;

    // Find the heading node in the document by its ID
    let targetPos: number | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading' && node.attrs.id === id) {
        targetPos = pos;
        return false; // Stop searching once found
      }
    });

    if (targetPos === null) return;

    // Set focus and selection
    editor.chain().focus().setTextSelection(targetPos + 1).run();

    // Use requestAnimationFrame for smoother scrolling and to avoid race conditions
    requestAnimationFrame(() => {
      const { view } = editor;
      const node = view.nodeDOM(targetPos as number);
      if (!(node instanceof HTMLElement)) return;

      // Find the scrollable container dynamically
      let scrollContainer: HTMLElement | null = view.dom;
      while (scrollContainer && scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
        scrollContainer = scrollContainer.parentElement;
      }
      scrollContainer = scrollContainer || view.dom; // Fallback to editor's main element

      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = node.getBoundingClientRect();

      const targetScrollTop = scrollContainer.scrollTop +
        (elementRect.top - containerRect.top) -
        (containerRect.height / 2) +
        (elementRect.height / 2);

      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    });

    onItemClick?.(id);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 过滤搜索结果
  const filterItems = (items: TocItem[], query: string): TocItem[] => {
    if (!query) return items;
    
    return items.reduce((filtered: TocItem[], item) => {
      const matchesQuery = item.text.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = item.children ? filterItems(item.children, query) : [];
      
      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...item,
          children: filteredChildren
        });
      }
      
      return filtered;
    }, []);
  };

  // 渲染目录项
  const renderTocItem = (item: TocItem, index: number, parentNumber = ''): React.ReactElement => {
    const isCollapsed = collapsedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const currentNumber = parentNumber ? `${parentNumber}.${index + 1}` : `${index + 1}`;
    
    return (
      <div key={item.id} className="toc-item-container">
        <button
          className={`toc-item toc-level-${item.level} ${
            activeId === item.id ? 'toc-active' : ''
          } ${hasChildren && collapsible ? 'has-children' : ''} ${
            isCollapsed ? 'collapsed' : ''
          }`}
          onClick={() => scrollToHeading(item.id)}
          title={item.text}
        >
          {hasChildren && collapsible && (
            <span 
              className="toc-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(item.id);
              }}
            >
              {isCollapsed ? '▶' : '▼'}
            </span>
          )}
          
          <span className="toc-content">
            {showNumbers && (
              <span className="toc-number">{currentNumber}</span>
            )}
            <span className="toc-text">{item.text}</span>
          </span>
        </button>
        
        {hasChildren && !isCollapsed && (
          <div className="toc-children">
            {item.children!.map((child, childIndex) => 
              renderTocItem(child, childIndex, showNumbers ? currentNumber : '')
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredItems = filterItems(tocItems, searchQuery);

  return (
    <div className="enhanced-table-of-contents">
      <div className="toc-header">
        <h3>目录</h3>
        <div className="toc-search">
          <input
            type="text"
            placeholder="搜索标题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="toc-search-input"
          />
        </div>
      </div>
      
      <nav className="toc-nav">
        {filteredItems.length === 0 ? (
          <div className="toc-empty">
            {searchQuery ? '未找到匹配的标题' : '暂无标题'}
          </div>
        ) : (
          filteredItems.map((item, index) => renderTocItem(item, index))
        )}
      </nav>
    </div>
  );
};
