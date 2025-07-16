import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { Editor } from '@tiptap/react';
import { throttle } from 'lodash';

export interface TocItem {
  id: string;
  level: number;
  text: string;
  position: number;
  children?: TocItem[];
}

// Helper function to build hierarchy from a flat list of items
const buildHierarchy = (flatItems: Omit<TocItem, 'children'>[]): TocItem[] => {
  const result: TocItem[] = [];
  const stack: TocItem[] = [];

  flatItems.forEach(item => {
    const newItem: TocItem = { ...item, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= newItem.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(newItem);
    } else {
      stack[stack.length - 1].children!.push(newItem);
    }

    stack.push(newItem);
  });

  return result;
};

export const useToc = (
  editor: Editor | null,
  scrollContainerRef: RefObject<HTMLElement | null>,
  maxLevel: number = 6,
) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  const extractHeadings = useCallback(() => {
    if (!editor) return [];

    const headings: Omit<TocItem, 'children'>[] = [];
    const doc = editor.state.doc;

    doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const level = node.attrs.level || 1;
        const text = node.textContent;
        const id = node.attrs.id;

        if (text.trim() && id && level <= maxLevel) {
          headings.push({
            id,
            level,
            text: text.trim(),
            position: pos,
          });
        }
      }
    });

    return buildHierarchy(headings);
  }, [editor, maxLevel]);

  // Effect to update the entire Table of Contents when the document changes
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const newTocItems = extractHeadings();
      setTocItems(newTocItems);
    };

    editor.on('update', handleUpdate);
    handleUpdate(); // Initial population

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, extractHeadings]);

  // Effect to update active heading based on scroll position
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!editor || !scrollContainer) return;

    const handleScroll = throttle(() => {
      let currentActiveId = '';
      const editorTop = scrollContainer.getBoundingClientRect().top;

      // Iterate through all headings to find the one closest to the top of the viewport
      const headings = Array.from(
        editor.view.dom.querySelectorAll('h1, h2, h3, h4, h5, h6'),
      );

      for (const heading of headings) {
        const { top } = heading.getBoundingClientRect();
        // Check if the heading is at or above the top of the scroll container
        if (top <= editorTop + scrollContainer.clientHeight / 2) {
          // +20 for a small offset
          currentActiveId = heading.id;
        } else {
          // Since headings are ordered, we can break early
          break;
        }
      }

      setActiveId(currentActiveId);
    }, 100); // Throttle to 100ms

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      handleScroll.cancel(); // Cancel any pending throttled calls
    };
  }, [editor, scrollContainerRef, tocItems]); // Rerun when tocItems changes

  return { tocItems, activeId };
};
