/* @jsx createElement */

import { createElement, type FC } from '@rkrupinski/react';

import { view, type View } from '../../types';

export type TodoNavProps = {
  current: View;
  onChange: (newView: View) => void;
};

export const TodoNav: FC<TodoNavProps> = ({ current, onChange }) => (
  <ul className="filters">
    {view.map(v => (
      <li key={v}>
        <a
          className={v === current ? 'selected' : ''}
          href={`#${v}`}
          onClick={() => onChange(v)}
        >
          {v}
        </a>
      </li>
    ))}
  </ul>
);
