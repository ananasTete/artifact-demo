# 左侧侧边栏目录功能

## 概述

本项目实现了一个功能强大的左侧侧边栏目录，可以自动提取编辑器中的标题并生成分级目录，支持搜索、折叠、点击跳转和实时高亮当前位置。

## 功能特性

### 基础目录组件 (TableOfContents)
- ✅ 实时提取编辑器中的标题（H1-H6）
- ✅ 自动生成分级目录结构
- ✅ 点击标题跳转到对应位置
- ✅ 实时高亮当前编辑位置对应的标题
- ✅ 响应式设计，支持移动端
- ✅ 优雅的滚动条样式

### 增强目录组件 (EnhancedTableOfContents)
- ✅ 包含基础目录的所有功能
- ✅ 层级结构显示，支持折叠/展开
- ✅ 搜索功能，实时过滤标题
- ✅ 可选的编号显示
- ✅ 可配置的最大层级限制
- ✅ 更丰富的交互动画

## 技术实现

### 核心原理

1. **标题提取**: 使用 Tiptap 编辑器的 `doc.descendants` 方法遍历文档节点
2. **实时监听**: 监听编辑器的 `update` 和 `selectionUpdate` 事件
3. **位置跳转**: 使用 `editor.commands.setTextSelection` 设置光标位置
4. **层级构建**: 通过栈结构构建标题的层级关系

### 关键代码结构

```typescript
// 提取标题
const extractHeadings = () => {
  const headings = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        id: `heading-${counter}`,
        level: node.attrs.level,
        text: node.textContent,
        position: pos,
      });
    }
  });
  return headings;
};

// 跳转到标题
const scrollToHeading = (position: number) => {
  editor.commands.setTextSelection(position);
  editor.commands.focus();
};
```

## 使用方法

### 1. 基础目录

```tsx
import { TableOfContents } from './components/TableOfContents';

<TableOfContents 
  editor={editor}
  onItemClick={(position) => console.log('跳转到:', position)}
/>
```

### 2. 增强目录

```tsx
import { EnhancedTableOfContents } from './components/EnhancedTableOfContents';

<EnhancedTableOfContents 
  editor={editor}
  onItemClick={(position) => console.log('跳转到:', position)}
  collapsible={true}        // 是否支持折叠
  showNumbers={false}       // 是否显示编号
  maxLevel={6}             // 最大层级
/>
```

### 3. 在应用中集成

```tsx
function App() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showToc, setShowToc] = useState(true);

  return (
    <div className="app-layout">
      <div className="editor-container">
        <Tiptap onEditorReady={setEditor} />
      </div>
      
      {showToc && (
        <EnhancedTableOfContents editor={editor} />
      )}
    </div>
  );
}
```

## 样式定制

### CSS 变量

目录组件支持通过 CSS 变量进行主题定制：

```css
.enhanced-table-of-contents {
  --toc-bg-color: #fafafa;
  --toc-border-color: #e5e5e5;
  --toc-text-color: #666;
  --toc-active-color: #1976d2;
  --toc-hover-bg: #f0f0f0;
}
```

### 响应式断点

- `1400px`: 目录宽度调整为 280px
- `1200px`: 目录宽度调整为 240px  
- `768px`: 移动端隐藏目录

## 性能优化

1. **防抖处理**: 编辑器更新事件使用防抖避免频繁重新计算
2. **虚拟滚动**: 大量标题时可考虑实现虚拟滚动
3. **缓存机制**: 标题结构变化时才重新构建层级
4. **懒加载**: 折叠状态下不渲染子级内容

## 扩展功能

### 可能的增强方向

1. **拖拽排序**: 支持拖拽调整标题顺序
2. **导出功能**: 导出目录为 PDF 或其他格式
3. **书签功能**: 支持添加书签和注释
4. **同步滚动**: 编辑器滚动时同步高亮目录项
5. **快捷键**: 支持键盘快捷键导航

### 自定义渲染

```tsx
const CustomTocItem = ({ item, isActive, onClick }) => (
  <div className={`custom-toc-item ${isActive ? 'active' : ''}`}>
    <span className="toc-icon">📄</span>
    <span className="toc-text">{item.text}</span>
    <span className="toc-level">H{item.level}</span>
  </div>
);

<EnhancedTableOfContents 
  editor={editor}
  renderItem={CustomTocItem}
/>
```

## 最佳实践

1. **标题规范**: 建议使用规范的标题层级（H1 > H2 > H3）
2. **性能监控**: 大文档时监控目录更新性能
3. **用户体验**: 提供目录显示/隐藏切换功能
4. **无障碍**: 添加适当的 ARIA 标签支持屏幕阅读器

## 故障排除

### 常见问题

1. **目录不更新**: 检查编辑器事件监听是否正确设置
2. **跳转不准确**: 确认位置计算逻辑和 DOM 结构匹配
3. **样式冲突**: 检查 CSS 优先级和命名空间
4. **性能问题**: 考虑添加防抖和缓存机制

### 调试技巧

```typescript
// 开发环境下添加调试信息
if (import.meta.env.DEV) {
  console.log('目录项:', tocItems);
  console.log('当前位置:', editor.state.selection.from);
}
```
