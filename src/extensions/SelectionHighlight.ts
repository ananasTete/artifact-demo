import { Mark } from '@tiptap/core';

export interface SelectionHighlightOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    selectionHighlight: {
      /**
       * Set a selection highlight mark
       */
      setSelectionHighlight: (attributes?: { 'data-selection-id'?: string }) => ReturnType;
      /**
       * Toggle a selection highlight mark
       */
      toggleSelectionHighlight: (attributes?: { 'data-selection-id'?: string }) => ReturnType;
      /**
       * Unset a selection highlight mark
       */
      unsetSelectionHighlight: () => ReturnType;
    };
  }
}

export const SelectionHighlight = Mark.create<SelectionHighlightOptions>({
  name: 'selectionHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      'data-selection-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-selection-id'),
        renderHTML: attributes => {
          if (!attributes['data-selection-id']) {
            return {};
          }
          return {
            'data-selection-id': attributes['data-selection-id'],
          };
        },
      },
      class: {
        default: 'text-selection-highlight',
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          return {
            class: attributes.class || 'text-selection-highlight',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-selection-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...this.options.HTMLAttributes, ...HTMLAttributes }, 0];
  },

  addCommands() {
    return {
      setSelectionHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleSelectionHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetSelectionHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
