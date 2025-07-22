import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { CommandsList } from './CommandsList';
import type { Editor } from '@tiptap/react';
import type { Range } from '@tiptap/core';
import type { CommandItem } from './SlashCommands';

// 配置建议选项
export const suggestionOptions = {
  items: ({ query }: { query: string }): CommandItem[] => {
    const commands: CommandItem[] = [
      {
        title: '标题 1',
        description: '大标题',
        icon: 'H1',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 1 })
            .run();
        },
      },
      {
        title: '标题 2',
        description: '中等标题',
        icon: 'H2',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 2 })
            .run();
        },
      },
      {
        title: '标题 3',
        description: '小标题',
        icon: 'H3',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode('heading', { level: 3 })
            .run();
        },
      },
      {
        title: '无序列表',
        description: '创建一个简单的无序列表',
        icon: '•',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .toggleBulletList()
            .run();
        },
      },
      {
        title: '有序列表',
        description: '创建一个带数字的列表',
        icon: '1.',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .toggleOrderedList()
            .run();
        },
      },
      {
        title: '引用',
        description: '捕获引用',
        icon: '"',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .toggleBlockquote()
            .run();
        },
      },
      {
        title: '代码块',
        description: '捕获代码片段',
        icon: '</>',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .toggleCodeBlock()
            .run();
        },
      },
      {
        title: '分割线',
        description: '在视觉上分割内容',
        icon: '—',
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHorizontalRule()
            .run();
        },
      },
    ];

    return commands.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
  },

  render: () => {
    let component: ReactRenderer;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CommandsList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        return (component.ref as any)?.onKeyDown?.(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
