# 段落悬浮图标功能实现

## 功能概述

在 Tiptap 编辑器中实现了段落悬浮图标功能，当用户将鼠标悬浮在任意段落上时，会在段落右侧显示一个加号图标。

## 实现原理

### 核心技术
1. **坐标转换**: 使用 ProseMirror 的 `posAtCoords()` 方法将鼠标屏幕坐标转换为文档位置
2. **节点检测**: 通过 `resolve()` 方法获取当前位置的节点信息，并检查是否为段落类型
3. **位置计算**: 使用 `coordsAtPos()` 方法获取段落起始位置的屏幕坐标
4. **事件处理**: 通过 Tiptap 的 `editorProps.handleDOMEvents` 监听鼠标移动事件
5. **性能优化**: 使用 `lodash.throttle` 对鼠标移动事件进行节流处理

### 关键代码位置
- **主要逻辑**: `src/Tiptap.tsx` - 包含鼠标事件处理和图标位置计算
- **样式定义**: `src/App.css` - 包含悬浮图标的样式和响应式设计
- **编辑器配置**: `src/Tiptap.tsx` 中的 `editorProps.handleDOMEvents`

## 功能特性

### 基础功能
- ✅ 鼠标悬浮在段落上时显示加号图标
- ✅ 图标位置与段落顶部对齐
- ✅ 鼠标移出编辑器区域时隐藏图标
- ✅ 只在段落类型节点上显示图标

### 用户体验优化
- ✅ 图标悬浮效果（颜色变化、背景色、缩放）
- ✅ 平滑的过渡动画
- ✅ 性能优化（100ms 节流）
- ✅ 响应式设计（移动端适配）
- ✅ 深色模式支持

### 样式特性
- 图标位置：段落右侧 30px 处
- 图标大小：24x24px（移动端 20x20px）
- 悬浮效果：颜色变深、背景色、1.1倍缩放
- 过渡动画：0.2s ease-in-out

## 技术实现细节

### 事件处理流程
1. 用户移动鼠标 → `mousemove` 事件触发
2. 节流函数限制处理频率（100ms）
3. 获取鼠标坐标并转换为文档位置
4. 检查当前节点是否为段落类型
5. 计算段落起始位置的屏幕坐标
6. 更新图标位置状态

### 坐标系转换
```typescript
// 鼠标坐标 → 文档位置
const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });

// 文档位置 → 段落起始位置
const resolvedPos = view.state.doc.resolve(pos.pos);
const nodeStartPos = resolvedPos.start(resolvedPos.depth);

// 段落起始位置 → 屏幕坐标
const nodeCoords = view.coordsAtPos(nodeStartPos);

// 相对于编辑器容器的位置
const top = nodeCoords.top - editorRect.top;
```

## 扩展可能性

### 当前点击功能
- 点击图标时在控制台输出日志

### 可扩展功能
- 显示段落操作菜单（复制、删除、移动等）
- 插入新段落
- 段落类型转换（标题、列表等）
- 段落拖拽重排
- 段落折叠/展开

## 浏览器兼容性

- ✅ 现代浏览器（Chrome, Firefox, Safari, Edge）
- ✅ 移动端浏览器
- ✅ 支持深色模式
- ✅ 响应式设计

## 使用方法

1. 启动开发服务器：`npm run dev`
2. 在浏览器中打开应用
3. 将鼠标悬浮在任意段落上
4. 观察右侧出现的加号图标
5. 点击图标查看控制台输出

## 注意事项

- 图标只在段落（`paragraph`）类型节点上显示
- 标题、列表等其他节点类型不会显示图标
- 鼠标移出编辑器区域时图标会立即隐藏
- 使用了节流优化，避免频繁的位置计算
