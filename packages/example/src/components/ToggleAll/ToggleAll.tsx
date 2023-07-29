/* @jsx createElement */
/* @jsxFrag Fragment */

import {
  createElement,
  Fragment,
  useCallback,
  type FC,
} from '@rkrupinski/react';

export type ToggleAllProps = {
  all: boolean;
  onToggle: (all: boolean) => void;
};

export const ToggleAll: FC<ToggleAllProps> = ({ all, onToggle }) => {
  const handleToggle = useCallback(
    (e: any) => {
      onToggle(e.target.checked);
    },
    [onToggle],
  );

  return (
    <>
      <input
        id="toggle-all"
        className="toggle-all"
        type="checkbox"
        checked={all}
        onChange={handleToggle}
      />
      <label for="toggle-all" />
    </>
  );
};
