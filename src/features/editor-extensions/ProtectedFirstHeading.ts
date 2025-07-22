import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export const ProtectedFirstHeading = Extension.create({
  name: 'protectedFirstHeading',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('protectedFirstHeading'),

        filterTransaction: (transaction, state) => {
          const firstNode = state.doc.firstChild;

          // 只有当第一个节点是一级标题时才进行保护
          if (!firstNode || firstNode.type.name !== 'heading' || firstNode.attrs.level !== 1) {
            return true;
          }

          // 检查每个步骤
          for (const step of transaction.steps) {
            const stepData = step as any;

            // 允许的操作类型
            if (step.jsonID === 'setNodeMarkup') {
              // 允许设置节点属性（如添加 ID）
              // 但确保不会改变节点类型或级别
              if (stepData.pos === 0) { // 第一个节点
                const newAttrs = stepData.attrs || {};
                const newNodeType = stepData.nodeType;

                // 如果改变了节点类型，阻止
                if (newNodeType && newNodeType.name !== 'heading') {
                  return false;
                }

                // 如果改变了标题级别，阻止
                if (newAttrs.level !== undefined && newAttrs.level !== 1) {
                  return false;
                }
              }
              continue;
            }

            if (step.jsonID === 'replace') {
              // 检查是否影响第一个节点
              if (stepData.from !== undefined && stepData.to !== undefined) {
                const affectsFirstNode = stepData.from <= 0 && stepData.to > 0;

                if (affectsFirstNode) {
                  // 如果是完全删除第一个节点（没有替换内容或替换为空）
                  if (stepData.from === 0 &&
                      stepData.to >= firstNode.nodeSize &&
                      (!stepData.slice || stepData.slice.content.size === 0)) {
                    return false; // 阻止完全删除
                  }

                  // 如果替换的内容不是以一级标题开头
                  if (stepData.from === 0 && stepData.slice && stepData.slice.content.size > 0) {
                    const firstReplacementNode = stepData.slice.content.firstChild;
                    if (firstReplacementNode &&
                        (firstReplacementNode.type.name !== 'heading' ||
                         firstReplacementNode.attrs.level !== 1)) {
                      return false; // 阻止替换为非一级标题
                    }
                  }
                }
              }
              continue;
            }

            // 其他操作类型（如 addMark, removeMark 等）通常是安全的
            // 允许通过
          }

          return true;
        },

        appendTransaction: (transactions, oldState, newState) => {
          // 只在文档发生变化时处理
          if (!transactions.some(tr => tr.docChanged)) {
            return null;
          }

          const firstNode = newState.doc.firstChild;
          const oldFirstNode = oldState.doc.firstChild;

          // 如果文档为空，插入一级标题
          if (!firstNode) {
            const tr = newState.tr;
            const headingType = newState.schema.nodes.heading;

            if (headingType) {
              const heading = headingType.create({ level: 1 });
              tr.insert(0, heading);
              return tr;
            }
          }

          // 如果第一个节点不是一级标题，在前面插入一个
          if (firstNode && (firstNode.type.name !== 'heading' || firstNode.attrs.level !== 1)) {
            const tr = newState.tr;
            const headingType = newState.schema.nodes.heading;

            if (headingType) {
              const heading = headingType.create({ level: 1 });
              tr.insert(0, heading);
              return tr;
            }
          }

          // 如果第一个标题被删除了，恢复它
          if (oldFirstNode &&
              oldFirstNode.type.name === 'heading' &&
              oldFirstNode.attrs.level === 1 &&
              (!firstNode || firstNode.type.name !== 'heading' || firstNode.attrs.level !== 1)) {

            const tr = newState.tr;
            const headingType = newState.schema.nodes.heading;

            if (headingType) {
              // 保留原来的内容和属性
              const heading = headingType.create(
                { level: 1, id: oldFirstNode.attrs.id },
                oldFirstNode.content
              );

              if (!firstNode) {
                tr.insert(0, heading);
              } else {
                tr.insert(0, heading);
              }

              return tr;
            }
          }

          return null;
        },

        // 添加键盘快捷键处理，防止删除第一个标题
        props: {
          handleKeyDown: (view, event) => {
            const { state } = view;
            const { selection } = state;
            const firstNode = state.doc.firstChild;

            // 如果第一个节点是一级标题
            if (firstNode &&
                firstNode.type.name === 'heading' &&
                firstNode.attrs.level === 1) {

              // 检查光标是否在第一个标题内
              const isInFirstHeading = selection.from >= 0 && selection.from <= firstNode.nodeSize;

              if (isInFirstHeading && event.key === 'Backspace') {
                // 如果光标在标题开头，阻止 backspace
                if (selection.from === 0) {
                  return true;
                }

                // 如果选择了整个标题内容，阻止删除
                if (selection.from === 0 && selection.to >= firstNode.nodeSize - 1) {
                  return true;
                }

                // 如果标题为空且光标在标题内，阻止可能导致节点删除的操作
                if (firstNode.textContent === '' && selection.from <= 1) {
                  return true;
                }
              }

              if (isInFirstHeading && event.key === 'Delete') {
                // 如果选择了整个标题，阻止删除
                if (selection.from === 0 && selection.to >= firstNode.nodeSize - 1) {
                  return true;
                }
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});
