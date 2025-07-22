import type { Editor } from '@tiptap/react';
import type { Range } from '@tiptap/core';

export interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}
