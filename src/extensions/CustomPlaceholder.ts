import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface CustomPlaceholderOptions {
  emptyEditorClass: string;
  emptyNodeClass: string;
  placeholder: string | ((props: { node: any; pos: number; hasAnchor: boolean }) => string);
  showOnlyWhenEditable: boolean;
}

export const CustomPlaceholder = Extension.create<CustomPlaceholderOptions>({
  name: 'customPlaceholder',

  addOptions() {
    return {
      emptyEditorClass: 'is-editor-empty',
      emptyNodeClass: 'is-empty',
      placeholder: '输入内容...',
      showOnlyWhenEditable: true,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('customPlaceholder'),
        
        props: {
          decorations: ({ doc, selection }) => {
            const active = this.editor.isEditable || !this.options.showOnlyWhenEditable;
            const { anchor } = selection;
            const decorations: Decoration[] = [];

            if (!active) {
              return null;
            }

            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
              const isEmpty = !node.isLeaf && !node.childCount;

              if ((hasAnchor || (node.type.name === 'heading' && node.attrs.level === 1 && pos === 0)) && isEmpty) {
                const classes = [this.options.emptyNodeClass];
                
                if (pos === 0) {
                  classes.push(this.options.emptyEditorClass);
                }

                const placeholder = typeof this.options.placeholder === 'function'
                  ? this.options.placeholder({ node, pos, hasAnchor })
                  : this.options.placeholder;

                const decoration = Decoration.node(pos, pos + node.nodeSize, {
                  'class': classes.join(' '),
                  'data-placeholder': placeholder,
                });

                decorations.push(decoration);
              }

              return false;
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
