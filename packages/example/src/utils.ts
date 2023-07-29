import { view, type View } from './types';

export const isView = (candidate: any): candidate is View =>
  view.includes(candidate);
