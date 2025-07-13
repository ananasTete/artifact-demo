import Tiptap from './Tiptap';
import './App.css';

function App() {
  const initialMarkdown = `

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
      <Tiptap markdown={initialMarkdown} />
    </div>
  );
}

export default App;
