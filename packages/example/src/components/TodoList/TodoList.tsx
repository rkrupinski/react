/* @jsx createElement */

import { createElement, type FC } from '@rkrupinski/react';

import type { Todo } from '../../types';
import { TodoItem } from '../TodoItem';

export type TodoListProps = {
  todos: Todo[];
  onToggle: (todo: Todo) => void;
  onDestroy: (todo: Todo) => void;
};

export const TodoList: FC<TodoListProps> = ({ todos, onToggle, onDestroy }) => (
  <ul className="todo-list">
    {todos.map(todo => (
      <TodoItem
        key={todo.id}
        data={todo}
        onToggle={onToggle}
        onDestroy={onDestroy}
      />
    ))}
  </ul>
);
