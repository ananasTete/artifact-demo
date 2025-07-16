import { useState, useRef } from 'react';
import Tiptap from './Tiptap';
import { EnhancedTableOfContents } from './components/EnhancedTableOfContents';
import type { Editor } from '@tiptap/react';
import './App.css';

function App() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const initialMarkdown = `欢迎使用功能丰富的 Tiptap 编辑器！左侧的目录会自动提取文档中的标题，点击可以快速跳转。

## 编辑器功能概览

### 基础文本格式
支持多种文本格式化选项：
- **粗体文本** - 使用 **文本** 或 Ctrl+B
- *斜体文本* - 使用 *文本* 或 Ctrl+I
- ~~删除线~~ - 使用 ~~文本~~
- \`行内代码\` - 使用反引号包围

### 列表功能
#### 无序列表
- 第一个列表项
- 第二个列表项
  - 嵌套列表项
  - 另一个嵌套项
- 第三个列表项

#### 有序列表
1. 第一步操作
2. 第二步操作
3. 第三步操作

### 引用和代码
#### 引用块
> 这是一个引用块，可以用来突出显示重要内容或引用他人的话。
>
> 支持多行引用内容。

#### 代码块
\`\`\`javascript
// 这是一个 JavaScript 代码示例
function greetUser(name) {
  return \`Hello, \${name}! Welcome to our editor.\`;
}

console.log(greetUser("Developer"));
\`\`\`

## 高级交互功能

### 斜杠命令系统
在编辑器中输入 \`/\` 可以快速插入各种内容：
- 标题（H1-H3）
- 列表（有序/无序）
- 引用块
- 代码块
- 分割线

### AI 辅助编辑
#### 悬浮图标功能
- 鼠标悬浮在段落上会显示 "+" 图标
- 点击图标可以打开 AI 处理面板
- 支持智能内容生成和优化

#### 文本选择建议
- 选择文本后会出现 AI 建议按钮
- 支持单元素和跨元素选择
- 提供智能的内容改进建议

### 链接管理
#### 链接悬浮菜单
悬浮在链接上会显示管理菜单：
- 显示完整 URL
- 编辑链接文本和地址
- 复制链接地址
- 删除链接

示例链接：[访问 GitHub](https://github.com)

## 目录导航功能

### 实时目录生成
左侧的目录面板会：
- 自动提取文档中的所有标题
- 显示层级结构
- 实时更新内容变化
- 高亮当前编辑位置

### 搜索功能
- 在目录顶部的搜索框中输入关键词
- 实时过滤匹配的标题
- 支持模糊搜索

### 折叠展开
- 点击标题前的箭头可以折叠/展开子级
- 支持多级嵌套结构
- 保持折叠状态

## 技术特性

### 响应式设计
- 桌面端：目录固定在左侧
- 平板端：目录宽度自适应
- 移动端：目录折叠到顶部

### 性能优化
- 防抖处理避免频繁更新
- 虚拟滚动支持大文档
- 智能缓存机制

### 无障碍支持
- 键盘导航支持
- 屏幕阅读器友好
- 高对比度模式

---

## 开始使用

现在您可以：
1. 在编辑器中输入内容
2. 使用左侧目录快速导航
3. 尝试各种交互功能
4. 体验 AI 辅助编辑

祝您使用愉快！🎉`;

  const handleTocItemClick = (id: string) => {
    console.log('跳转到标题 ID:', id);
  };

  return (
    <div className="App">
      <div className="app-layout">
        <EnhancedTableOfContents
          editor={editor}
          scrollContainerRef={scrollContainerRef}
          onItemClick={handleTocItemClick}
          collapsible={true}
          showNumbers={false}
          maxLevel={6}
        />

        <div className="editor-container" ref={scrollContainerRef}>
          <Tiptap
            markdown={initialMarkdown}
            onEditorReady={setEditor}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
