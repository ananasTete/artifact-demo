import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { suggestionOptions } from './suggestionOptions';
import type { Editor } from '@tiptap/react';
import type { Range } from '@tiptap/core';

// TODO 鼠标下移时窗口不会跟随滚动
// TODO 搜索功能异常
// TODO 空格后退出正常，但是删除空格后就又触发了，我希望空格后 / 就作为普通文本对待

export interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: CommandItem }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        ...suggestionOptions,
      }),
    ];
  },
});


