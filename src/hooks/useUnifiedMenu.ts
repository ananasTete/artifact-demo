import { useState, useCallback, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
import {
  MenuState,
  TriggerSource
} from '../types/unifiedMenu';
import type {
  UnifiedMenuState,
  MenuLayout,
  SelectionInfo,
  NodeInfo
} from '../types/unifiedMenu';

// 初始菜单状态
const initialMenuState: UnifiedMenuState = {
  isVisible: false,
  currentState: MenuState.HIDDEN,
  triggerSource: null,
  layout: {
    mainMenu: { top: 0, left: 0 },
    aiInputMenu: { top: 0, left: 0 },
    aiCommandMenu: { top: 0, left: 0 },
  },
  userInput: '',
  isLoading: false,
};

export const useUnifiedMenu = (editor?: Editor) => {
  const [menuState, setMenuState] = useState<UnifiedMenuState>(initialMenuState);
  const [currentSelection, setCurrentSelection] = useState<SelectionInfo | null>(null);
  const [currentNode, setCurrentNode] = useState<NodeInfo | null>(null);

  // 计算菜单位置
  const calculateMenuLayout = useCallback((
    triggerSource: TriggerSource,
    basePosition: { top: number; left: number }
  ): MenuLayout => {
    const { top, left } = basePosition;
    
    if (triggerSource === TriggerSource.TEXT_SELECTION) {
      // 划词触发：菜单在选择区域上方
      return {
        mainMenu: { top: top - 60, left },
        aiInputMenu: { top: top - 60, left },
        aiCommandMenu: { top: top - 10, left }, // AI指令菜单在选择区域下方
      };
    } else {
      // 节点icon触发：菜单在icon右侧
      return {
        mainMenu: { top, left: left + 40 },
        aiInputMenu: { top, left: left + 40 },
        aiCommandMenu: { top: top + 50, left: left + 40 }, // AI指令菜单在输入菜单下方
      };
    }
  }, []);

  // 计算文本选择的位置
  const calculateSelectionPosition = useCallback(() => {
    if (!editor?.view) return null;

    const { state, view } = editor;
    const { selection } = state;
    
    if (selection.empty) return null;

    try {
      const { from, to } = selection;
      const startCoords = view.coordsAtPos(from);
      const endCoords = view.coordsAtPos(to);
      
      // 计算选择区域的中心位置
      const centerX = (startCoords.left + endCoords.right) / 2;
      const centerY = startCoords.top;
      
      // 获取编辑器容器的位置
      const editorWrapper = view.dom.closest('.editor-wrapper');
      if (editorWrapper) {
        const editorRect = editorWrapper.getBoundingClientRect();
        return {
          left: centerX - editorRect.left,
          top: centerY - editorRect.top,
        };
      }
    } catch (error) {
      console.error('计算选择位置时出错:', error);
    }
    
    return null;
  }, [editor]);

  // 显示主菜单（划词触发）
  const showMenuForSelection = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;

    if (selection.empty) return;

    const position = calculateSelectionPosition();
    if (!position) return;

    const selectionInfo: SelectionInfo = {
      from: selection.from,
      to: selection.to,
      text: state.doc.textBetween(selection.from, selection.to),
      isEmpty: selection.empty,
    };

    const layout = calculateMenuLayout(TriggerSource.TEXT_SELECTION, position);

    setCurrentSelection(selectionInfo);
    setCurrentNode(null);
    setMenuState({
      isVisible: true,
      currentState: MenuState.MAIN,
      triggerSource: TriggerSource.TEXT_SELECTION,
      layout,
      userInput: '',
      isLoading: false,
    });
  }, [editor, calculateSelectionPosition, calculateMenuLayout]);

  // 显示主菜单（节点icon触发）
  const showMenuForNode = useCallback((nodeInfo: NodeInfo, position: { top: number; left: number }) => {
    const layout = calculateMenuLayout(TriggerSource.NODE_ICON, position);

    setCurrentNode(nodeInfo);
    setCurrentSelection(null);
    setMenuState({
      isVisible: true,
      currentState: MenuState.MAIN,
      triggerSource: TriggerSource.NODE_ICON,
      layout,
      userInput: '',
      isLoading: false,
    });
  }, [calculateMenuLayout]);

  // 切换到AI模式
  const switchToAIMode = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      currentState: MenuState.AI_MODE,
      userInput: '',
    }));
  }, []);

  // 返回主菜单
  const backToMainMenu = useCallback(() => {
    setMenuState(prev => ({
      ...prev,
      currentState: MenuState.MAIN,
      userInput: '',
      isLoading: false,
    }));
  }, []);

  // 关闭菜单
  const closeMenu = useCallback(() => {
    setMenuState(initialMenuState);
    setCurrentSelection(null);
    setCurrentNode(null);
  }, []);

  // 更新用户输入
  const updateUserInput = useCallback((input: string) => {
    setMenuState(prev => ({
      ...prev,
      userInput: input,
    }));
  }, []);

  // 设置加载状态
  const setLoading = useCallback((loading: boolean) => {
    setMenuState(prev => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  // 监听编辑器选择变化
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { state } = editor;
      const { selection } = state;

      // 如果当前菜单是由划词触发的，检查选择是否仍然有效
      if (menuState.triggerSource === TriggerSource.TEXT_SELECTION) {
        if (selection.empty) {
          // 选择被清除，关闭菜单
          closeMenu();
        } else if (menuState.currentState === MenuState.MAIN) {
          // 选择发生变化，更新菜单位置
          const position = calculateSelectionPosition();
          if (position) {
            const layout = calculateMenuLayout(TriggerSource.TEXT_SELECTION, position);
            setMenuState(prev => ({
              ...prev,
              layout,
            }));
          }
        }
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, menuState.triggerSource, menuState.currentState, closeMenu, calculateSelectionPosition, calculateMenuLayout]);

  return {
    // 状态
    menuState,
    currentSelection,
    currentNode,
    
    // 操作方法
    showMenuForSelection,
    showMenuForNode,
    switchToAIMode,
    backToMainMenu,
    closeMenu,
    updateUserInput,
    setLoading,
  };
};
