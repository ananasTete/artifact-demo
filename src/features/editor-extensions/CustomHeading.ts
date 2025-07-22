import { Heading } from '@tiptap/extension-heading';
import type { HeadingOptions } from '@tiptap/extension-heading';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { Plugin, Transaction } from 'prosemirror-state';
import { nanoid } from 'nanoid';

// Function to find all headings in the document
const findHeadings = (doc: ProsemirrorNode) => {
  const headings: { node: ProsemirrorNode; pos: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({ node, pos });
    }
  });
  return headings;
};

// Function to check for duplicate IDs and generate a new one if needed
const proccessHeadings = (tr: Transaction, doc: ProsemirrorNode) => {
  const headings = findHeadings(doc);
  const ids = new Set<string>();

  headings.forEach(({ node, pos }) => {
    if (node.attrs.id && ids.has(node.attrs.id)) {
      // If ID is duplicated, generate a new one
      const newId = nanoid(8);
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: newId });
    } else if (node.attrs.id) {
      // If ID is unique, add it to the set
      ids.add(node.attrs.id);
    } else {
      // If ID is missing, generate a new one
      const newId = nanoid(8);
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, id: newId });
    }
  });

  return tr;
};

export const CustomHeading = Heading.extend<HeadingOptions>({
  addAttributes() {
    return {
      // We are keeping the level attribute from the parent,
      // and adding our own id attribute.
      ...this.parent?.(),
      id: {
        default: undefined,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          // We are only adding the id attribute to the DOM if it exists.
          if (!attributes.id) {
            return {};
          }

          return {
            id: attributes.id,
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        view: (editorView) => {
          // When the editor is initialized, we proccess the headings
          // to make sure they all have an ID.
          const tr = editorView.state.tr;
          proccessHeadings(tr, editorView.state.doc);

          if (tr.docChanged) {
            editorView.dispatch(tr);
          }

          return {};
        },
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some(transaction => transaction.docChanged)) {
            return;
          }

          const tr = newState.tr;
          proccessHeadings(tr, newState.doc);

          if (tr.steps.length > 0) {
            return tr;
          }
        },
      }),
    ];
  },
});
