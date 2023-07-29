# @rkrupinski/react

An experimental, lightweight [React](https://react.dev/) alternative.

- [Getting started](#getting-started)
- [Example](#example)

## Getting started

Install:

```
yarn add @rkrupinski/react
```

Make sure to set:

```json
{
  "jsx": "react"
}
```

in your `tsconfig.json` -> `"compilerOptions"`.

Now you're all set:

```tsx
/* @jsx createElement */
/* @jsxFrag Fragment */

import {
  render,
  useState,
  useEffect,
  createElement,
  Fragment,
  type FC,
} from "@rkrupinski/react";

const App: FC = () => {
  const [clicked, setClicked] = useState(0);

  useEffect(() => {
    console.log(`Clicked ${clicked} times`);
  }, [clicked]);

  return (
    <>
      <h1>Hello!</h1>
      <button
        onClick={() => {
          setClicked((c) => c + 1);
        }}
      >
        {clicked}
      </button>
    </>
  );
};

const root = document.querySelector("#root") as HTMLElement;

render(<App />, root);
```

## Example

- [Live](https://remarkable-rugelach-93aab7.netlify.app/)
- [Source code](https://github.com/rkrupinski/react/tree/master/packages/example)
