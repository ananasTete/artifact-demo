// 统一气泡菜单系统的类型定义

// 菜单状态枚举
export enum MenuState {
  HIDDEN = 'hidden',
  MAIN = 'main',
  AI_MODE = 'ai_mode' // AI输入菜单和AI指令菜单同时显示
}

// 触发源类型
export enum TriggerSource {
  TEXT_SELECTION = 'text_selection',
  NODE_ICON = 'node_icon'
}

// 菜单位置
export interface MenuPosition {
  top: number;
  left: number;
}

// 菜单布局（包含多个菜单的位置）
export interface MenuLayout {
  mainMenu: MenuPosition;
  aiInputMenu: MenuPosition;  // AI输入菜单位置
  aiCommandMenu: MenuPosition; // AI指令菜单位置
}

// 统一菜单状态
export interface UnifiedMenuState {
  isVisible: boolean;
  currentState: MenuState;
  triggerSource: TriggerSource | null;
  layout: MenuLayout;
  userInput: string; // AI输入菜单的用户输入
  isLoading: boolean; // AI处理状态
}

// 节点类型转换选项
export interface NodeTypeOption {
  id: string;
  label: string;
  icon: string;
  command: string;
  level?: number; // 用于标题级别
}

// AI指令选项
export interface AICommandOption {
  id: string;
  label: string;
  description?: string;
  category: 'writing' | 'tools'; // 智写 | AI工具
}

// 格式化选项
export interface FormatOption {
  id: string;
  label: string;
  icon: string;
  command: string;
}

// 菜单配置
export interface MenuConfig {
  nodeTypes: NodeTypeOption[];
  formatOptions: FormatOption[];
  aiCommands: AICommandOption[];
}

// 菜单事件处理器
export interface MenuEventHandlers {
  onFormatClick: (format: string) => void;
  onNodeTypeClick: (nodeType: string, level?: number) => void;
  onAIClick: () => void;
  onAIInputSubmit: (input: string) => void;
  onAICommandClick: (command: string) => void;
  onBack: () => void;
  onClose: () => void;
}

// 选择信息（用于划词触发）
export interface SelectionInfo {
  from: number;
  to: number;
  text: string;
  isEmpty: boolean;
}

// 节点信息（用于节点icon触发）
export interface NodeInfo {
  startPos: number;
  endPos: number;
  nodeType: string;
  level?: number;
}

// 默认菜单配置
export const DEFAULT_MENU_CONFIG: MenuConfig = {
  nodeTypes: [
    { id: 'heading1', label: 'H1', icon: 'H1', command: 'heading', level: 1 },
    { id: 'heading2', label: 'H2', icon: 'H2', command: 'heading', level: 2 },
    { id: 'heading3', label: 'H3', icon: 'H3', command: 'heading', level: 3 },
    { id: 'paragraph', label: 'P', icon: 'P', command: 'paragraph' },
    { id: 'bulletList', label: '•', icon: '•', command: 'bulletList' },
    { id: 'orderedList', label: '1.', icon: '1.', command: 'orderedList' },
    { id: 'blockquote', label: '"', icon: '"', command: 'blockquote' },
  ],
  formatOptions: [
    { id: 'bold', label: 'B', icon: 'B', command: 'bold' },
    { id: 'italic', label: 'I', icon: 'I', command: 'italic' },
    { id: 'strike', label: 'S', icon: 'S', command: 'strike' },
  ],
  aiCommands: [
    // 智写组
    { id: 'polish', label: '润色', category: 'writing' },
    { id: 'expand', label: '扩写', category: 'writing' },
    { id: 'simplify', label: '简写', category: 'writing' },
    { id: 'continue', label: '续写', category: 'writing' },
    // AI工具组
    { id: 'imitate', label: '仿写', category: 'tools' },
    { id: 'rewrite', label: '改写', category: 'tools' },
    { id: 'analyze', label: '解析内容', category: 'tools' },
  ],
};
