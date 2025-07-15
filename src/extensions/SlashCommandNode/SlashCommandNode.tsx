import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SlashCommandComponent } from './SlashCommandComponent.tsx';

export interface SlashCommandOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    slashCommandNode: {
      insertSlashCommand: () => ReturnType;
    };
  }
}

export const SlashCommandNode = Node.create<SlashCommandOptions>({
  name: 'slashCommandNode',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      query: {
        default: '',
        parseHTML: element => element.getAttribute('data-query'),
        renderHTML: attributes => {
          if (!attributes.query) {
            return {};
          }
          return {
            'data-query': attributes.query,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="slash-command"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'slash-command' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SlashCommandComponent);
  },

  addCommands() {
    return {
      insertSlashCommand:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;
          const { from } = selection;

          // 插入节点但不移动光标
          const node = this.type.create({
            query: '',
          });

          if (dispatch) {
            const tr = state.tr.insert(from, node);
            // 不设置新的选择位置，让组件自己处理焦点
            dispatch(tr);
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      '/': () => {
        // 检查当前位置是否在行首或前面是空格
        const { selection } = this.editor.state;
        const { $from } = selection;
        
        // 获取当前行的文本
        const currentLineText = $from.parent.textContent;
        const cursorPos = $from.parentOffset;
        
        // 检查光标前的字符
        const charBefore = cursorPos > 0 ? currentLineText[cursorPos - 1] : '';
        
        // 只有在行首或前面是空格时才插入斜杠命令节点
        if (cursorPos === 0 || charBefore === ' ' || charBefore === '\n') {
          return this.editor.commands.insertSlashCommand();
        }
        
        return false;
      },
    };
  },
});
