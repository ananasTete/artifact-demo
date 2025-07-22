# 增强型目录 (Enhanced Table of Contents) 需求文档

## 1. 概述

为了提升用户在浏览和编辑长文档时的体验，我们需要一个功能强大的侧边栏目录（TOC）。该目录应能够实时反映文档中的标题结构，并提供快速导航、搜索和交互功能。

## 2. 功能需求

### 2.1. 目录生成与更新

- **FR1.1 - 动态生成:** 目录必须根据编辑器内容中的标题（H1, H2, H3, H4, H5, H6）==动态==生成。
- **FR1.2 - 层级结构:** 目录需要正确地反映标题之间的层级关系。例如，一个 H3 标题应该被视为其上方最近的 H2 标题的子项。
- **FR1.3 - 实时更新:** 当用户在编辑器中添加、删除或修改任何标题时，目录必须自动、实时地更新以反映这些变化，无需手动刷新。

### 2.2. 交互功能

- **FR2.1 - 点击跳转:** 用户点击目录中的任意一项时，编辑器视口应平滑地滚动到文档中对应的标题位置。
- **FR2.2 - 激活项高亮:** 当用户滚动编辑器时，目录中对应当前视口区域的标题项应被高亮显示，以明确指示用户当前所在的文档位置。
- **FR2.3 - 折叠与展开:**
    - 拥有子标题的目录项应显示一个切换图标（如 ▶/▼）。
    - 用户可以点击该图标来展开或折叠该项下的所有子标题。
    - 组件应能记录并维持各项的折叠状态。
- **FR2.4 - 搜索过滤:**
    - 目录顶部应提供一个搜索框。
    - 用户输入关键词时，目录应实时过滤，仅显示文本内容匹配该关键词的标题项。
    - 为了保持上下文，匹配项的所有父级标题也应一并显示。
    - 当搜索框清空时，恢复显示完整的目录。

### 2.3. 可配置性

- **FR3.1 - 可选编号:** 组件应提供一个选项（如 `showNumbers` prop），允许调用者决定是否在每个目录项前显示层级编号（例如 "1.", "1.1.", "2.1.3."）。
- **FR3.2 - 最大深度:** 组件应提供一个选项（如 `maxLevel` prop），允许调用者限制目录展示的标题深度（例如，只显示到 H3）。
- **FR3.3 - 折叠功能开关:** 组件应提供一个选项（如 `collapsible` prop），允许调用者完全启用或禁用目录的折叠功能。

---

## 3. 技术实现设计

### 3.1. 架构概览

整体架构分为以下几个核心模块：

```
EnhancedTableOfContents (主组件)
├── useToc (自定义Hook - 数据层)
├── TocItem (目录项组件)
├── TocSearch (搜索组件)
└── utils (工具函数)
    ├── buildHierarchy (层级构建)
    ├── filterItems (搜索过滤)
    └── generateNumbers (编号生成)
```

### 3.2. 核心组件设计

#### 3.2.1 EnhancedTableOfContents 主组件

**职责：**
- 作为目录功能的入口组件
- 管理组件状态（折叠状态、搜索状态）
- 协调子组件交互
- 处理用户配置选项

**Props 接口：**
```typescript
interface EnhancedTableOfContentsProps {
  editor: Editor | null;                    // Tiptap 编辑器实例
  scrollContainerRef: RefObject<HTMLElement>; // 滚动容器引用
  onItemClick?: (id: string) => void;       // 点击回调
  collapsible?: boolean;                    // 是否启用折叠功能
  showNumbers?: boolean;                    // 是否显示编号
  maxLevel?: number;                        // 最大显示层级
}
```

**状态管理：**
```typescript
const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
const [searchQuery, setSearchQuery] = useState('');
```

#### 3.2.2 useToc 自定义Hook

**职责：**
- 从 Tiptap 编辑器提取标题数据
- 构建层级结构
- 监听编辑器变化并实时更新
- 跟踪当前激活的标题

**核心逻辑：**
```typescript
export const useToc = (
  editor: Editor | null,
  scrollContainerRef: RefObject<HTMLElement>,
  maxLevel: number = 6
) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // 提取标题并构建层级结构
  const extractHeadings = useCallback(() => {
    if (!editor) return [];

    const headings: Omit<TocItem, 'children'>[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading' &&
          node.attrs.level <= maxLevel &&
          node.textContent.trim()) {
        headings.push({
          id: node.attrs.id,
          level: node.attrs.level,
          text: node.textContent.trim(),
          position: pos,
        });
      }
    });

    return buildHierarchy(headings);
  }, [editor, maxLevel]);

  // 监听编辑器更新
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setTocItems(extractHeadings());
    };

    editor.on('update', handleUpdate);
    handleUpdate();

    return () => editor.off('update', handleUpdate);
  }, [editor, extractHeadings]);

  // 监听滚动并更新激活项
  useEffect(() => {
    // 滚动监听逻辑...
  }, [editor, scrollContainerRef, tocItems]);

  return { tocItems, activeId };
};
```

### 3.3. 数据结构设计

#### 3.3.1 TocItem 接口

```typescript
interface TocItem {
  id: string;           // 标题的唯一ID（由CustomHeading扩展自动生成）
  level: number;        // 标题级别 (1-6)
  text: string;         // 标题文本内容
  position: number;     // 在文档中的位置
  children?: TocItem[]; // 子标题数组
}
```

#### 3.3.2 层级构建算法

```typescript
const buildHierarchy = (headings: Omit<TocItem, 'children'>[]): TocItem[] => {
  const result: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of headings) {
    const item: TocItem = { ...heading, children: [] };

    // 找到合适的父级
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(item);
    } else {
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(item);
    }

    stack.push(item);
  }

  return result;
};
```

### 3.4. 核心功能实现

#### 3.4.1 实时更新机制

利用 Tiptap 的事件系统监听文档变化：

```typescript
// 在 useToc Hook 中
useEffect(() => {
  if (!editor) return;

  const handleUpdate = () => {
    const newTocItems = extractHeadings();
    setTocItems(newTocItems);
  };

  // 监听编辑器更新事件
  editor.on('update', handleUpdate);
  handleUpdate(); // 初始化

  return () => {
    editor.off('update', handleUpdate);
  };
}, [editor, extractHeadings]);
```

#### 3.4.2 点击跳转功能

```typescript
const scrollToHeading = (id: string) => {
  if (!editor) return;

  // 在文档中查找对应的标题节点
  let targetPos: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading' && node.attrs.id === id) {
      targetPos = pos;
      return false; // 停止搜索
    }
  });

  if (targetPos !== null) {
    // 设置光标位置
    editor.commands.setTextSelection(targetPos);

    // 滚动到目标位置
    const headingElement = editor.view.dom.querySelector(`#${id}`);
    if (headingElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementTop = headingElement.offsetTop;
      const offset = 20; // 顶部偏移量

      container.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  }
};
```

#### 3.4.3 激活项高亮

使用节流函数优化滚动性能：

```typescript
const handleScroll = throttle(() => {
  let currentActiveId = '';
  const containerRect = scrollContainer.getBoundingClientRect();
  const viewportCenter = containerRect.top + containerRect.height / 2;

  // 遍历所有标题元素
  const headings = Array.from(
    editor.view.dom.querySelectorAll('h1, h2, h3, h4, h5, h6')
  );

  for (const heading of headings) {
    const { top } = heading.getBoundingClientRect();
    if (top <= viewportCenter) {
      currentActiveId = heading.id;
    } else {
      break; // 标题是有序的，可以提前退出
    }
  }

  setActiveId(currentActiveId);
}, 100); // 100ms 节流
```

#### 3.4.4 搜索过滤功能

```typescript
const filterItems = (items: TocItem[], query: string): TocItem[] => {
  if (!query.trim()) return items;

  const filtered: TocItem[] = [];
  const lowerQuery = query.toLowerCase();

  const processItem = (item: TocItem, ancestors: TocItem[] = []): void => {
    const matches = item.text.toLowerCase().includes(lowerQuery);
    const hasMatchingChildren = item.children?.some(child =>
      checkItemOrDescendants(child, lowerQuery)
    );

    if (matches || hasMatchingChildren) {
      // 添加所有祖先节点以保持上下文
      let currentLevel = filtered;
      for (const ancestor of ancestors) {
        let existingAncestor = currentLevel.find(i => i.id === ancestor.id);
        if (!existingAncestor) {
          existingAncestor = { ...ancestor, children: [] };
          currentLevel.push(existingAncestor);
        }
        currentLevel = existingAncestor.children!;
      }

      // 添加当前项
      const filteredItem: TocItem = { ...item, children: [] };
      currentLevel.push(filteredItem);

      // 递归处理子项
      if (item.children) {
        item.children.forEach(child =>
          processItem(child, [...ancestors, item])
        );
      }
    }
  };

  items.forEach(item => processItem(item));
  return filtered;
};
```

#### 3.4.5 折叠展开功能

```typescript
const toggleCollapse = (itemId: string) => {
  setCollapsedItems(prev => {
    const newSet = new Set(prev);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    return newSet;
  });
};

// 在渲染中判断折叠状态
const isCollapsed = collapsible && collapsedItems.has(item.id);
const hasChildren = item.children && item.children.length > 0;
```

#### 3.4.6 编号生成功能

```typescript
const generateNumbers = (items: TocItem[], prefix = ''): string[] => {
  const numbers: string[] = [];

  items.forEach((item, index) => {
    const currentNumber = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
    numbers.push(currentNumber);

    if (item.children && item.children.length > 0) {
      const childNumbers = generateNumbers(item.children, currentNumber);
      numbers.push(...childNumbers);
    }
  });

  return numbers;
};
```

### 3.5. 样式设计

#### 3.5.1 响应式布局

```css
.enhanced-table-of-contents {
  width: 320px;
  height: 100vh;
  background: #1a1a1a;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* 响应式断点 */
@media (max-width: 1400px) {
  .enhanced-table-of-contents { width: 280px; }
}

@media (max-width: 1200px) {
  .enhanced-table-of-contents { width: 240px; }
}

@media (max-width: 768px) {
  .enhanced-table-of-contents { display: none; }
}
```

#### 3.5.2 层级视觉效果

```css
/* 不同层级的缩进和样式 */
.toc-level-1 { padding-left: 16px; font-weight: 500; font-size: 15px; }
.toc-level-2 { padding-left: 20px; font-size: 14px; }
.toc-level-3 { padding-left: 24px; font-size: 13px; color: #888; }
.toc-level-4 { padding-left: 28px; font-size: 13px; color: #888; }
.toc-level-5 { padding-left: 32px; font-size: 12px; color: #999; }
.toc-level-6 { padding-left: 36px; font-size: 12px; color: #999; }

/* 子级连接线 */
.toc-children {
  margin-left: 16px;
  border-left: 1px solid #444;
}
```

#### 3.5.3 交互状态

```css
.toc-item {
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.toc-item:hover {
  background: #333;
  color: #fff;
}

.toc-item.toc-active {
  background: #555;
  color: #fff;
  font-weight: 500;
}

/* 折叠图标动画 */
.toc-toggle {
  transition: transform 0.2s ease;
}

.toc-item.collapsed .toc-toggle {
  transform: rotate(-90deg);
}
```

### 3.6. 性能优化

#### 3.6.1 节流和防抖

```typescript
// 滚动事件节流
const handleScroll = throttle(() => {
  // 滚动处理逻辑
}, 100);

// 搜索输入防抖
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setSearchQuery(query);
  }, 300),
  []
);
```

#### 3.6.2 虚拟化（可选）

对于超长文档，可以考虑实现虚拟滚动：

```typescript
// 使用 react-window 或类似库
import { FixedSizeList as List } from 'react-window';

const VirtualizedTocList = ({ items, height }) => (
  <List
    height={height}
    itemCount={items.length}
    itemSize={32}
    itemData={items}
  >
    {TocItemRenderer}
  </List>
);
```

### 3.7. 测试策略

#### 3.7.1 单元测试

```typescript
// useToc Hook 测试
describe('useToc', () => {
  it('should extract headings correctly', () => {
    // 测试标题提取逻辑
  });

  it('should build hierarchy correctly', () => {
    // 测试层级构建
  });

  it('should update when editor content changes', () => {
    // 测试实时更新
  });
});

// 搜索功能测试
describe('filterItems', () => {
  it('should filter items by query', () => {
    // 测试搜索过滤
  });

  it('should include parent items for context', () => {
    // 测试上下文保持
  });
});
```

#### 3.7.2 集成测试

```typescript
describe('EnhancedTableOfContents Integration', () => {
  it('should scroll to heading when item clicked', () => {
    // 测试点击跳转
  });

  it('should highlight active item on scroll', () => {
    // 测试激活项高亮
  });

  it('should toggle collapse state', () => {
    // 测试折叠展开
  });
});
```

### 3.8. 扩展性考虑

#### 3.8.1 插件化架构

```typescript
interface TocPlugin {
  name: string;
  beforeRender?: (items: TocItem[]) => TocItem[];
  afterRender?: (element: HTMLElement) => void;
  onItemClick?: (item: TocItem) => boolean; // 返回 false 阻止默认行为
}

// 插件注册
const plugins: TocPlugin[] = [
  {
    name: 'analytics',
    onItemClick: (item) => {
      analytics.track('toc_item_clicked', { headingId: item.id });
      return true;
    }
  }
];
```

#### 3.8.2 主题定制

```typescript
interface TocTheme {
  colors: {
    background: string;
    text: string;
    activeText: string;
    border: string;
  };
  spacing: {
    itemPadding: number;
    levelIndent: number;
  };
  typography: {
    fontSize: Record<number, number>;
    fontWeight: Record<number, number>;
  };
}
```

### 3.9. 无障碍性 (Accessibility)

#### 3.9.1 ARIA 属性

```typescript
// 在组件中添加适当的 ARIA 属性
<nav
  role="navigation"
  aria-label="文档目录"
  className="toc-nav"
>
  <button
    role="treeitem"
    aria-expanded={!isCollapsed}
    aria-level={item.level}
    aria-label={`${item.text} - 第${item.level}级标题`}
  >
    {item.text}
  </button>
</nav>
```

#### 3.9.2 键盘导航

```typescript
const handleKeyDown = (e: KeyboardEvent, item: TocItem) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      scrollToHeading(item.id);
      break;
    case 'ArrowRight':
      if (hasChildren && isCollapsed) {
        toggleCollapse(item.id);
      }
      break;
    case 'ArrowLeft':
      if (hasChildren && !isCollapsed) {
        toggleCollapse(item.id);
      }
      break;
  }
};
```

这个实现设计涵盖了需求文档中的所有功能要求，并提供了完整的技术实现方案。代码结构清晰，具有良好的可维护性和扩展性。
