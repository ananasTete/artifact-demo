import Tiptap from './Tiptap';
import './App.css';

function App() {
  const initialMarkdown = `# 🎯 重构后的划词编辑功能测试

## 新功能特性

### 🔍 智能选择分析
重构后的系统能够智能区分两种选择类型：
1. **元素内划词**：在单个元素内选择文本
2. **跨元素划词**：选择跨越多个元素的内容

### 📊 数据结构优化
发送给 AI 的数据现在使用结构化格式：
\`\`\`json
{
  "suggestion": "用户的修改建议",
  "nodes": [
    {
      "from": 10,
      "to": 20,
      "content": "节点的完整内容"
    }
  ]
}
\`\`\`

### 测试用例

#### 1. 元素内划词测试
选中这个段落中的**部分文字**进行测试，系统会识别为元素内选择。

#### 2. 跨元素划词测试
从这个段落开始选择，一直拖拽到下面的列表项：

- 第一个列表项
- 第二个列表项
- 第三个列表项

系统会识别为跨元素选择，并发送每个涉及元素的完整内容。

#### 3. 复杂结构测试
这是一个包含**粗体**、*斜体*和[链接](https://github.com)的复杂段落。

#### 4. 列表项测试
- 选中单个列表项的部分内容
- 选中多个列表项
- 测试有序列表：

1. 第一项内容
2. 第二项内容
3. 第三项内容

---

## 原有功能

Visit [GitHub](https://github.com) to see more projects.

Try editing this text! Type "/" to see available commands.

### 测试段落 2
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### 测试段落 3
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

### 测试段落 4
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### 测试段落 5
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.

### 底部链接测试
这是页面底部的测试链接：[底部链接](https://bottom.example.com) 和 [另一个底部链接](https://bottom2.example.com)

**测试说明：**
- 悬停在底部链接上，菜单应该显示在链接上方
- 菜单不应该超出屏幕顶部
- 如果空间不足，菜单会自动调整到最佳位置`;

  return (
    <div className="App">
      <h1>Tiptap 编辑器 - 重构后的智能划词编辑</h1>
      <p>在编辑器中输入 <code>/</code> 来打开命令面板，选择要插入的内容类型。</p>
      <p><strong>🎯 重构亮点 - 智能选择分析：</strong>系统现在能够区分元素内划词和跨元素划词，并根据不同情况发送优化的数据结构给 AI。</p>
      <p><strong>📊 数据结构：</strong>元素内划词只发送选中内容；跨元素划词发送每个涉及元素的完整内容，确保 AI 能够理解完整的上下文。</p>
      <p><strong>🧪 测试 Markdown 粘贴：</strong>复制以下内容并粘贴到编辑器中：</p>

      <div style={{background: '#f5f5f5', padding: '10px', borderRadius: '4px', margin: '10px 0'}}>
        <strong>测试 1 - 基本语法：</strong>
        <pre style={{margin: '5px 0 0 0', fontFamily: 'monospace'}}>
{`# 测试标题

这是 **粗体** 和 *斜体* 文本。

- 列表项 1
- 列表项 2

> 这是引用`}
        </pre>
      </div>

      <div style={{background: '#e8f4fd', padding: '10px', borderRadius: '4px', margin: '10px 0'}}>
        <strong>测试 2 - 链接测试：</strong>
        <pre style={{margin: '5px 0 0 0', fontFamily: 'monospace'}}>
{`[这是一个链接](https://example.com)

访问 [GitHub](https://github.com) 查看更多内容。`}
        </pre>
      </div>
      <div style={{ height: 80, width: 120, overflow: 'scroll', border: '1px solid #ccc' }}>
        <div style={{ height: 30, marginBottom: 30, background: 'pink' }}></div>
        <div style={{ height: 30, marginBottom: 30, background: 'pink' }}></div>
        <div style={{ height: 30, marginBottom: 30, background: 'pink' }}></div>
        <div style={{ height: 30, marginBottom: 30, background: 'pink' }}></div>
        <div style={{ height: 30, marginBottom: 30, background: 'pink' }}></div>
      </div>
      <Tiptap markdown={initialMarkdown} />
    </div>
  );
}

export default App;
