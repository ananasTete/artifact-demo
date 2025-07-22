import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { suggestionOptions } from './suggestionOptions';
import type { Editor } from '@tiptap/react';
import type { Range } from '@tiptap/core';



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


