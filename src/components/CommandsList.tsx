import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { CommandItem } from '../extensions/SlashCommands';
import './CommandsList.css';

interface CommandsListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export const CommandsList = forwardRef<any, CommandsListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="commands-list">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`command-item ${index === selectedIndex ? 'is-selected' : ''}`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="command-icon">{item.icon}</div>
            <div className="command-content">
              <div className="command-title">{item.title}</div>
              <div className="command-description">{item.description}</div>
            </div>
          </button>
        ))
      ) : (
        <div className="command-item">没有找到结果</div>
      )}
    </div>
  );
});

CommandsList.displayName = 'CommandsList';
