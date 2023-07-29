/* @jsx createElement */
/* @jsxFrag Fragment */

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  render,
  createElement,
  Fragment,
  type FC,
} from '@rkrupinski/react';

import { type Todo, type View } from './types';
import { isView } from './utils';
import { TodoInput } from './components/TodoInput';
import { ToggleAll } from './components/ToggleAll';
import { TodoList } from './components/TodoList';
import { TodoNav } from './components/TodoNav';

import 'todomvc-app-css/index.css';

const Todos: FC = () => {
  const [all, setAll] = useState(false);

  const [todos, setTodos] = useState<Todo[]>([]);

  const [currentView, setCurrentView] = useState<View>(() => {
    const candidate = window.location.hash.slice(1);

    if (isView(candidate)) return candidate;

    return 'all';
  });

  const active = useMemo(
    () => todos.filter(({ completed }) => !completed),
    [todos],
  );

  const completed = useMemo(
    () => todos.filter(({ completed }) => completed),
    [todos],
  );

  const visible = useMemo(() => {
    switch (currentView) {
      case 'all':
        return todos;
      case 'active':
        return active;
      case 'completed':
        return completed;
    }
  }, [currentView, todos, active, completed]);

  const handleAdd = useCallback(
    (text: string) => {
      if (!text.length) return;

      setTodos(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          body: text,
          completed: false,
        },
      ]);
    },
    [setTodos],
  );

  const handleToggle = useCallback(
    (todo: Todo) => {
      setTodos(prev =>
        prev.map(t =>
          t.id === todo.id ? { ...t, completed: !t.completed } : t,
        ),
      );
    },
    [setTodos],
  );

  const handleDestroy = useCallback(
    (todo: Todo) => {
      setTodos(prev => prev.filter(({ id }) => id !== todo.id));
    },
    [setTodos],
  );

  const handleClearCompleted = useCallback(() => {
    setTodos(active);
  }, [setTodos, active]);

  const handleToggleAll = useCallback(
    (all: boolean) => {
      setTodos(prev => prev.map(todo => ({ ...todo, completed: all })));
    },
    [setTodos],
  );

  useEffect(() => {
    setAll(!!todos.length && todos.length === completed.length);
  }, [todos, completed, setAll]);

  return (
    <>
      <section className="todoapp">
        <div>
          <header className="header">
            <h1>todos</h1>
            <TodoInput onNewTodo={handleAdd} />
          </header>
          <div className="main">
            <ToggleAll all={all} onToggle={handleToggleAll} />
            <TodoList
              todos={visible}
              onToggle={handleToggle}
              onDestroy={handleDestroy}
            />
          </div>
          {todos.length > 0 && (
            <footer className="footer">
              {active.length > 0 && (
                <span className="todo-count">
                  {active.length} {`item${active.length > 1 ? 's' : ''}`} left
                </span>
              )}
              <TodoNav current={currentView} onChange={setCurrentView} />
              {completed.length > 0 && (
                <button
                  className="clear-completed"
                  onClick={handleClearCompleted}
                >
                  Clear completed
                </button>
              )}
            </footer>
          )}
        </div>
      </section>

      <footer className="info">
        <p>
          <a href="https://github.com/rkrupinski/react/tree/master/packages/example">
            View source
          </a>
        </p>
      </footer>
    </>
  );
};

const root = document.querySelector('#root') as HTMLElement;

render(<Todos />, root);
