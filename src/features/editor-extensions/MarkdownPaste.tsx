import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DOMParser, Slice } from '@tiptap/pm/model';
import { marked } from 'marked';

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持换行符转换为 <br>
  gfm: true,    // 启用 GitHub Flavored Markdown
});

// 检查文本是否包含 markdown 语法的函数
function isMarkdownContent(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s/, // 标题
    /^\*\s/, // 无序列表
    /^\d+\.\s/, // 有序列表
    /^>\s/, // 引用
    /```/, // 代码块
    /`[^`]+`/, // 行内代码
    /\*\*[^*]+\*\*/, // 粗体
    /\*[^*]+\*/, // 斜体
    /\[[^\]]+\]\([^)]+\)/, // 链接
    /^---$/, // 分割线
    /^\s*[-*+]\s/, // 列表项
  ];

  const lines = text.split('\n');

  // 检查是否有任何行匹配 markdown 模式
  return lines.some(line =>
    markdownPatterns.some((pattern: RegExp) => pattern.test(line))
  );
}

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste: (view, event) => {
            // 获取粘贴的文本内容
            const text = event.clipboardData?.getData('text/plain');

            if (!text) {
              return false;
            }

            // 检查是否包含 markdown 语法
            const hasMarkdownSyntax = isMarkdownContent(text);

            if (!hasMarkdownSyntax) {
              return false; // 让默认的粘贴处理器处理
            }

            try {
              // 将 markdown 转换为 HTML (使用同步方式)
              let html: string;
              const result = marked(text);
              if (typeof result === 'string') {
                html = result;
              } else {
                // 如果是 Promise，我们需要等待它
                return false;
              }

              // 创建一个临时的 DOM 元素来解析 HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;

              // 使用编辑器的命令来插入 HTML 内容
              const { from, to } = view.state.selection;
              const tr = view.state.tr.deleteRange(from, to);

              // 使用 ProseMirror 的 DOMParser 将 HTML 转换为文档片段
              const parser = DOMParser.fromSchema(view.state.schema);
              const doc = parser.parse(tempDiv);
              const slice = new Slice(doc.content, 0, 0);

              tr.replaceSelection(slice);
              view.dispatch(tr);

              return true; // 阻止默认的粘贴行为
            } catch (error) {

              return false; // 如果解析失败，使用默认粘贴行为
            }
          },
        },
      }),
    ];
  },
});
