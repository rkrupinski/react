# @rkrupinski/react

An experimental, lightweight [React](https://react.dev/) alternative.

![Build status](https://github.com/rkrupinski/react/workflows/CI/badge.svg)
[![minified + gzip](https://badgen.net/bundlephobia/minzip/@rkrupinski/react)](https://bundlephobia.com/package/@rkrupinski/react)

Table of contents:

- [Getting started](#getting-started)
- [Example](#example)
- [API](#api)
  - [JSX](#jsx)
  - [Top-level API](#top-level-api)
  - [Hooks](#hooks)

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

## API

Read about [React](https://react.dev/reference) first, then come back here 🙏.

### JSX

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>React</th>
      <th>Caveats</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>createElement</code></td>
      <td>
        <a href="https://react.dev/reference/react/createElement" target="_blank">createElement</a>
      </td>
      <td>
        <ul>
          <li>Requires custom <a href="https://www.typescriptlang.org/tsconfig#jsxFactory" target="_blank">pragma</a> (<code>/* @jsx createElement */</code>).</li>
          <li>Limited to <abbr title="HyperText Markup Language">HTML</abbr> elements (for the time being).</li>
          <li>Weakly (<code>any</code>) typed host elements (for the time being).</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><code>Fragment</code></td>
      <td>
        <a href="https://react.dev/reference/react/Fragment" target="_blank">Fragment</a>
      </td>
      <td>
        <ul>
          <li>Requires custom <a href="https://www.typescriptlang.org/tsconfig#jsxFactory" target="_blank">pragma</a> (<code>/* @jsxFrag Fragment */</code>).</li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

### Top-level API

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>React</th>
      <th>Caveats</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>render</code></td>
      <td>
        <a href="https://react.dev/reference/react-dom/render" target="_blank">render</a>
      </td>
      <td>
        <ul>
          <li>No third argument (<code>callback</code>)</li>
          <li>No concurrent mode</li>
          <li>One root/app at a time (for the time being).</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><code>unmountAt</code></td>
      <td>
        <a href="https://react.dev/reference/react-dom/unmountComponentAtNode" target="_blank">unmountComponentAtNode</a>
      </td>
      <td>-</td>
    </tr>
  </tbody>
</table>

### Hooks

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>React</th>
      <th>Caveats</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>useState</code></td>
      <td>
        <a href="https://react.dev/reference/react/useState" target="_blank">useState</a>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td><code>useMemo</code></td>
      <td>
        <a href="https://react.dev/reference/react/useMemo" target="_blank">useMemo</a>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td><code>useCallback</code></td>
      <td>
        <a href="https://react.dev/reference/react/useCallback" target="_blank">useCallback</a>
      </td>
      <td>-</td>
    </tr>
    <tr>
      <td><code>useEffect</code></td>
      <td>
        <a href="https://react.dev/reference/react/useEffect" target="_blank">useEffect</a>
      </td>
      <td>-</td>
    </tr>
  </tbody>
</table>
