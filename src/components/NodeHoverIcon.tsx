import { useState, useEffect } from "react";
import { throttle } from "lodash";
import type { Editor } from "@tiptap/react";
import HoverNodeIcon from "../assets/hover-node.png";

interface NodeHoverIconProps {
  editor: Editor;
}

export const NodeHoverIcon = ({ editor }: NodeHoverIconProps) => {
  const [containerInfo, setContainerInfo] = useState<{
    top: number;
    left: number;
    height: number;
    pos: number; // <-- Add node position to state
  } | null>(null);
  const [overlayInfo, setOverlayInfo] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;
    const editorWrapper = editorElement.closest(
      ".editor-wrapper"
    ) as HTMLDivElement;

    const handleMouseOver = throttle((event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 查找最近的块级节点
      const blockNode = target.closest(
        "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, div[data-type]"
      ) as HTMLElement;
      if (!blockNode) return;

      // Get the node's document position from its DOM element
      const pos = editor.view.posAtDOM(blockNode, 0);
      if (pos === undefined) return;

      // 获取节点和编辑器包装器的位置信息
      const nodeRect = blockNode.getBoundingClientRect();
      const wrapperRect = editorWrapper.getBoundingClientRect();

      // 计算位置和尺寸信息
      const top = nodeRect.top - wrapperRect.top;
      const height = nodeRect.height;

      setContainerInfo({
        top,
        left: wrapperRect.width,
        height,
        pos, // <-- Store the position
      });
      setOverlayInfo({
        top,
        left: 0,
        width: wrapperRect.width,
        height,
      });
    }, 100);

    const handleMouseLeave = (event: MouseEvent) => {
      // 检查鼠标是否真的离开了编辑器区域
      const relatedTarget = event.relatedTarget as HTMLElement;

      // 如果鼠标移动到容器或其子元素，不隐藏
      if (
        relatedTarget &&
        (relatedTarget.closest(".node-hover-container") ||
          relatedTarget.classList.contains("node-hover-container"))
      ) {
        return;
      }

      // 延迟隐藏，给用户时间移动到容器
      setTimeout(() => {
        if (!isHovering) {
          setContainerInfo(null);
          setOverlayInfo(null);
        }
      }, 50);
    };

    // 添加事件监听器
    editorElement.addEventListener("mouseover", handleMouseOver);
    editorElement.addEventListener(
      "mouseleave",
      handleMouseLeave as EventListener
    );

    return () => {
      editorElement.removeEventListener("mouseover", handleMouseOver);
      editorElement.removeEventListener(
        "mouseleave",
        handleMouseLeave as EventListener
      );
      handleMouseOver.cancel();
    };
  }, [editor, isHovering]);

  const handleContainerMouseEnter = () => {
    setIsHovering(true);
  };

  const handleContainerMouseLeave = () => {
    setIsHovering(false);
    setContainerInfo(null);
    setOverlayInfo(null);
  };

  const handleClick = () => {
    if (!containerInfo) return;

    const { pos } = containerInfo;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;

    // Hide the icon and overlay
    setIsHovering(false);
    setContainerInfo(null);
    setOverlayInfo(null);

    // Calculate selection range and apply it
    const from = pos;
    const to = pos + node.nodeSize;
    editor.chain().focus().setTextSelection({ from, to }).run();
  };

  if (!containerInfo) return null;

  return (
    <>
      {/* 遮罩层 */}
      {isHovering && overlayInfo && (
        <div
          style={{
            position: "absolute",
            top: overlayInfo.top,
            left: overlayInfo.left,
            height: overlayInfo.height,
            width: overlayInfo.width,
            backgroundColor: "rgba(0, 123, 255, 0.2)",
            pointerEvents: "none",
            zIndex: 500, // 确保遮罩层在编辑器内容之上但在容器之下
            borderRadius: "4px",
          }}
        />
      )}

      {/* 容器元素 */}
      <div
        className="node-hover-container"
        style={{
          position: "absolute",
          top: containerInfo.top,
          left: containerInfo.left,
          width: "30px",
          height: containerInfo.height,
          cursor: "pointer",
          transition: "transform 0.2s ease-in-out",
          transform: isHovering ? "scale(1.1)" : "scale(1)",
        }}
        onMouseEnter={handleContainerMouseEnter}
        onMouseLeave={handleContainerMouseLeave}
        onClick={handleClick}
      >
        <img
          src={HoverNodeIcon}
          style={{
            marginTop: 2,
            width: 20,
            height: 20,
            float: "right",
          }}
        />
      </div>
    </>
  );
};
