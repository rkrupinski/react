/* @jsx createElement */

import { createElement, type FC } from '@rkrupinski/react';

import type { Todo } from '../../types';

export type TodoItemProps = {
  data: Todo;
  onToggle: (todo: Todo) => void;
  onDestroy: (todo: Todo) => void;
};

export const TodoItem: FC<TodoItemProps> = ({ data, onToggle, onDestroy }) => (
  <li className={data.completed ? 'completed' : ''}>
    <div className="view">
      <input
        className="toggle"
        type="checkbox"
        checked={data.completed}
        onChange={() => onToggle(data)}
      />
      <label>{data.body}</label>
      <button className="destroy" onClick={() => onDestroy(data)} />
    </div>
  </li>
);
