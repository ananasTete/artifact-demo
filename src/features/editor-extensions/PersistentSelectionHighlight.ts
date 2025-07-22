import { Extension } from '@tiptap/core';
import type { RawCommands, CommandProps } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// 1. Define the state interface for our plugin
export interface PersistentHighlightState {
  isActive: boolean;
  from: number | null;
  to: number | null;
}

// 2. Create a PluginKey for our plugin
export const persistentHighlightPluginKey = new PluginKey<PersistentHighlightState>('persistentHighlight');

// Add new types for our commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    persistentSelectionHighlight: {
      setPersistentSelection: () => ReturnType;
      clearPersistentSelection: () => ReturnType;
    };
  }
}

// 3. Define the Extension
export const PersistentSelectionHighlight = Extension.create({
  name: 'persistentSelectionHighlight',

  // 4. Add commands to control the highlight
  addCommands(): Partial<RawCommands> {
    return {
      setPersistentSelection: () => ({ editor, dispatch }: CommandProps) => {
        const { from, to } = editor.state.selection;
        if (from === to) return false; // Don't do anything for cursor selections

        if (dispatch) {
          editor.view.dispatch(
            editor.view.state.tr.setMeta(persistentHighlightPluginKey, {
              action: 'set',
              from,
              to,
            })
          );
        }
        return true;
      },
      clearPersistentSelection: () => ({ editor, dispatch }: CommandProps) => {
        if (dispatch) {
          editor.view.dispatch(
            editor.view.state.tr.setMeta(persistentHighlightPluginKey, {
              action: 'clear',
            })
          );
        }
        return true;
      },
    };
  },

  // 5. The core logic: the Prosemirror Plugin
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: persistentHighlightPluginKey,

        // a. The plugin's state
        state: {
          init(): PersistentHighlightState {
            return { isActive: false, from: null, to: null };
          },
          apply(tr, value): PersistentHighlightState {
            const meta = tr.getMeta(persistentHighlightPluginKey);
            if (meta?.action === 'set') {
              return { isActive: true, from: meta.from, to: meta.to };
            }
            if (meta?.action === 'clear') {
              return { isActive: false, from: null, to: null };
            }
            // If the document changes, clear the highlight to avoid incorrect positioning
            if (tr.docChanged) {
                return { isActive: false, from: null, to: null };
            }
            return value;
          },
        },

        // b. The plugin's props, where we create the decoration
        props: {
          decorations(state) {
            const pluginState = persistentHighlightPluginKey.getState(state);
            if (!pluginState?.isActive || pluginState.from === null || pluginState.to === null) {
              return DecorationSet.empty;
            }

            // Create an inline decoration with our CSS class
            return DecorationSet.create(state.doc, [
              Decoration.inline(pluginState.from, pluginState.to, { class: 'persistent-highlight' }),
            ]);
          },
        },
      }),
    ];
  },
});
