/* @jsx createElement */

import {
  createElement,
  useState,
  useCallback,
  type FC,
} from '@rkrupinski/react';

export type TodoInputProps = {
  onNewTodo: (text: string) => void;
};

export const TodoInput: FC<TodoInputProps> = ({ onNewTodo }) => {
  const [text, setText] = useState('');

  const handleInput = useCallback(
    (e: any) => {
      setText(e.target.value);
    },
    [setText],
  );

  const handleKeyDown = useCallback(
    (e: any) => {
      if (e.keyCode !== 13) return;

      onNewTodo(e.target.value);
      setText('');
    },
    [onNewTodo, setText],
  );

  return (
    <input
      value={text}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className="new-todo"
      placeholder="What needs to be done?"
    />
  );
};
