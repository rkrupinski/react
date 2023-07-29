export type Todo = {
  id: string;
  body: string;
  completed: boolean;
};

export const view = ['all', 'active', 'completed'] as const;

export type View = (typeof view)[number];
