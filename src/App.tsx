import Tiptap from './Tiptap';
import './App.css';

function App() {
  const initialMarkdown = `
# 欢迎使用编辑器

这是一个功能丰富的文本编辑器，支持 Markdown 语法和多种交互功能。

## 主要功能

### 文本格式化
- **粗体文本**
- *斜体文本*
- ~~删除线~~
- \`行内代码\`

### 列表支持
- 无序列表项 1
- 无序列表项 2
- 无序列表项 3

1. 有序列表项 1
2. 有序列表项 2
3. 有序列表项 3

### 引用块
> 这是一个引用块，可以用来突出显示重要内容。

### 代码块
\`\`\`javascript
function example() {
  return "Hello World!";
}
\`\`\`

### 链接
访问 [GitHub](https://github.com) 了解更多信息。

---

开始编辑您的内容吧！`;

  return (
    <div className="App">
      <Tiptap markdown={initialMarkdown} />
    </div>
  );
}

export default App;
