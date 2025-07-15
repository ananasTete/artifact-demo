import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface FixedTitleOptions {
  HTMLAttributes: Record<string, any>;
  placeholder: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fixedTitle: {
      /**
       * Insert a fixed title node
       */
      insertFixedTitle: () => ReturnType;
    };
  }
}

export const FixedTitleNode = Node.create<FixedTitleOptions>({
  name: 'fixedTitle',

  priority: 1000, // 高优先级，确保在heading之前处理

  addOptions() {
    return {
      HTMLAttributes: {},
      placeholder: '标题',
    };
  },

  content: 'text*',

  group: 'block',

  defining: true,

  addAttributes() {
    return {
      level: {
        default: 1,
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'h1[data-fixed-title="true"]',
        attrs: { level: 1 },
        priority: 100, // 高优先级，确保在标准heading之前匹配
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'h1',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 'data-fixed-title': 'true' }
      ),
      0,
    ];
  },

  addCommands() {
    return {
      insertFixedTitle:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { level: 1 },
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      // Placeholder 插件
      new Plugin({
        key: new PluginKey('fixedTitlePlaceholder'),
        props: {
          decorations: (state) => {
            // 查找第一个固定标题节点
            let fixedTitlePos = null;
            let fixedTitleNode = null;

            state.doc.descendants((node: any, pos: number) => {
              if (node.type.name === 'fixedTitle') {
                fixedTitlePos = pos;
                fixedTitleNode = node;
                return false; // 停止遍历
              }
            });

            if (fixedTitlePos === null || !fixedTitleNode || fixedTitleNode.textContent.length > 0) {
              return DecorationSet.empty;
            }

            const decoration = Decoration.node(
              fixedTitlePos,
              fixedTitlePos + fixedTitleNode.nodeSize,
              {
                class: 'fixed-title-placeholder',
                'data-placeholder': this.options.placeholder,
              }
            );

            return DecorationSet.create(state.doc, [decoration]);
          },
        },
      }),

      // 防止删除固定标题节点的插件
      new Plugin({
        key: new PluginKey('fixedTitleProtection'),
        filterTransaction: (transaction, state) => {
          const firstNode = state.doc.firstChild;
          if (!firstNode || firstNode.type.name !== 'fixedTitle') {
            return true; // 如果第一个节点不是固定标题，允许所有操作
          }

          let shouldBlock = false;

          transaction.steps.forEach((step) => {
            if (step.jsonID === 'replace') {
              const stepData = step as any;
              const from = stepData.from;
              const to = stepData.to;

              // 阻止删除整个固定标题节点
              if (from <= 0 && to >= firstNode.nodeSize) {
                shouldBlock = true;
              }

              // 阻止删除固定标题节点的开始部分
              if (from === 0 && to > 0) {
                shouldBlock = true;
              }

              // 阻止任何涉及位置0的删除操作
              if (from === 0 && stepData.slice && stepData.slice.size === 0) {
                shouldBlock = true;
              }
            }

            // 阻止其他可能删除节点的操作
            if (step.jsonID === 'replaceAround' || step.jsonID === 'addMark' || step.jsonID === 'removeMark') {
              const stepData = step as any;
              if (stepData.from !== undefined && stepData.from <= 0) {
                shouldBlock = true;
              }
            }
          });

          // 检查事务是否会导致固定标题消失
          if (!shouldBlock) {
            const newDoc = transaction.doc;
            const newFirstNode = newDoc.firstChild;
            if (!newFirstNode || newFirstNode.type.name !== 'fixedTitle') {
              shouldBlock = true;
            }
          }

          return !shouldBlock;
        },

        // 添加键盘事件处理
        props: {
          handleKeyDown: (view, event) => {
            const { state } = view;
            const { selection } = state;
            const firstNode = state.doc.firstChild;

            if (!firstNode || firstNode.type.name !== 'fixedTitle') {
              return false;
            }

            // 阻止在固定标题开头使用退格键
            if (event.key === 'Backspace') {
              // 如果光标在固定标题的最开始（位置0或1）
              if (selection.from <= 1 && selection.to <= 1) {
                return true; // 阻止事件
              }
              // 如果选择范围包含固定标题的开始
              if (selection.from === 0) {
                return true; // 阻止事件
              }
            }

            // 阻止删除整个固定标题节点
            if (event.key === 'Delete' || event.key === 'Backspace') {
              // 如果选择了整个固定标题或包含固定标题的开始
              if (selection.from <= 0 && selection.to >= firstNode.nodeSize) {
                return true; // 阻止事件
              }
            }

            // 阻止Ctrl+A然后删除（全选删除）
            if ((event.key === 'Delete' || event.key === 'Backspace') &&
                selection.from === 0 && selection.to === state.doc.content.size) {
              return true; // 阻止事件
            }

            return false;
          },
        },
      }),

      // 确保固定标题始终存在的插件
      new Plugin({
        key: new PluginKey('ensureFixedTitle'),
        appendTransaction: (transactions, oldState, newState) => {
          const firstNode = newState.doc.firstChild;

          // 如果第一个节点不是固定标题，插入一个
          if (!firstNode || firstNode.type.name !== 'fixedTitle') {
            const tr = newState.tr;
            const fixedTitleNode = this.type.create({ level: 1 });
            tr.insert(0, fixedTitleNode);
            return tr;
          }

          return null;
        },
      }),
    ];
  },
});
