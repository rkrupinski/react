/* @jsx createElement */
/* @jsxFrag Fragment */

import { getByTestId, fireEvent } from '@testing-library/dom';

import {
  _doNotTouchOrYouWillBeFired,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Fragment,
  useState,
  useMemo,
  render,
  unmountAt,
  useCallback,
  useEffect,
  type FC,
} from '.';

const Input: FC<{ 'data-testid'?: string }> = ({
  'data-testid': testid = 'input',
}) => {
  const [value, setValue] = useState('a');

  return (
    <input
      data-testid={testid}
      value={value}
      onInput={(e: any) => {
        setValue(e.target.value);
      }}
    />
  );
};

export const Toggle: FC = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [, forceRender] = useState(0);

  return (
    <>
      {visible && children}
      <button
        data-testid="toggle"
        onClick={() => {
          setVisible(v => !v);
        }}
      />
      <button
        data-testid="force-render"
        onClick={() => {
          forceRender(r => r + 1);
        }}
      />
    </>
  );
};

describe('@rkrupinski/react', () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    _doNotTouchOrYouWillBeFired.setScheduler(fn => {
      fn({
        timeRemaining: () => 1,
        didTimeout: false,
      });
      return 1;
    });

    root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
  });

  afterEach(() => {
    unmountAt(root);
    document.body.removeChild(root);
  });

  it('should initialize state lazily', () => {
    const initSpy = jest.fn();

    const StateTest: FC = () => {
      const [count, setCount] = useState(() => {
        initSpy();
        return 1;
      });

      return (
        <div>
          <p data-testid="count">{count}</p>
          <button
            data-testid="inc"
            onClick={() => {
              setCount(c => c + 1);
            }}
          />
        </div>
      );
    };

    render(<StateTest />, root);

    expect(initSpy).toHaveBeenCalledTimes(1);

    expect(getByTestId(root, 'count')).toHaveTextContent('1');

    fireEvent.click(getByTestId(root, 'inc'));

    expect(initSpy).toHaveBeenCalledTimes(1);

    expect(getByTestId(root, 'count')).toHaveTextContent('2');
  });

  it('should handle basic state updates', () => {
    const StateTest: FC = () => {
      const [count, setCount] = useState(0);

      return (
        <div>
          <p data-testid="count">{count}</p>
          <button
            data-testid="inc"
            onClick={() => {
              setCount(c => c + 1);
            }}
          />
        </div>
      );
    };

    render(<StateTest />, root);

    expect(getByTestId(root, 'count')).toHaveTextContent('0');

    fireEvent.click(getByTestId(root, 'inc'));

    expect(getByTestId(root, 'count')).toHaveTextContent('1');
  });

  it('should handle text insertion', () => {
    const TextInsertionTest: FC = () => {
      const [visible, setVisible] = useState(false);

      return (
        <div>
          <p>{visible ? 'a' : null}</p>
          <p>{visible && 'b'}</p>
          {visible ? 'c' : null}
          {visible && 'd'}
          <button
            data-testid="toggle"
            onClick={() => {
              setVisible(v => !v);
            }}
          />
        </div>
      );
    };

    render(<TextInsertionTest />, root);

    expect(root.innerHTML).toMatchInlineSnapshot(
      `"<div><p></p><p></p><button data-testid="toggle"></button></div>"`,
    );

    fireEvent.click(getByTestId(root, 'toggle'));

    expect(root.innerHTML).toMatchInlineSnapshot(
      `"<div><p>a</p><p>b</p>cd<button data-testid="toggle"></button></div>"`,
    );
  });

  it('should reinsert upon key change', () => {
    const KeyTest: FC = () => {
      const [key, setKey] = useState(`${Math.random()}`);

      return (
        <>
          <Input key={key} />
          <button
            data-testid="reset"
            onClick={() => {
              setKey(`${Math.random()}`);
            }}
          >
            Reset
          </button>
        </>
      );
    };

    render(<KeyTest />, root);

    fireEvent.input(getByTestId(root, 'input'), { target: { value: 'abc' } });

    expect(root.innerHTML).toMatchInlineSnapshot(
      `"<input data-testid="input" value="abc"><button data-testid="reset">Reset</button>"`,
    );

    fireEvent.click(getByTestId(root, 'reset'));

    expect(root.innerHTML).toMatchInlineSnapshot(
      `"<input data-testid="input" value="a"><button data-testid="reset">Reset</button>"`,
    );
  });

  it('should preserve identity with keys', () => {
    const KeyTest: FC = () => {
      const [items, setItems] = useState(['a', 'b']);

      return (
        <ul>
          {items.map(item => (
            <li key={item}>
              <button
                data-testid={`remove-${item}`}
                onClick={() => {
                  setItems(prev => prev.filter(p => p !== item));
                }}
              >
                x
              </button>
              <Input data-testid={`input-${item}`} />
            </li>
          ))}
        </ul>
      );
    };

    render(<KeyTest />, root);

    fireEvent.input(getByTestId(root, 'input-a'), { target: { value: 'abc' } });
    fireEvent.input(getByTestId(root, 'input-b'), { target: { value: 'def' } });
    fireEvent.click(getByTestId(root, 'remove-a'));

    expect(root.innerHTML).toMatchInlineSnapshot(
      `"<ul><li><button data-testid="remove-b">x</button><input data-testid="input-b" value="def"></li></ul>"`,
    );
  });

  it('should handle arrays', () => {
    const ArrayTest: FC = () => {
      const [items, setItems] = useState<number[]>([]);

      return (
        <div>
          {items.map(item => (
            <div>{item}</div>
          ))}
          <Input />
          <button
            data-testid="new-item"
            onClick={() => {
              setItems(prev => [...prev, prev.length]);
            }}
          >
            +
          </button>
        </div>
      );
    };

    render(<ArrayTest />, root);

    fireEvent.input(getByTestId(root, 'input'), { target: { value: 'abc' } });
    fireEvent.click(getByTestId(root, 'new-item'));
    fireEvent.click(getByTestId(root, 'new-item'));

    expect(root.innerHTML).toMatchInlineSnapshot(
      `"<div><div>0</div><div>1</div><input data-testid="input" value="abc"><button data-testid="new-item">+</button></div>"`,
    );
  });

  it('should handle void', () => {
    const VoidTest: FC = () => {
      const [visible, setVisible] = useState(false);

      return (
        <div>
          {visible && <p>a</p>}
          {visible ? <p>b</p> : null}
          {visible ? <p>c</p> : undefined}
          <Input data-testid="i" />
          <button
            data-testid="t"
            onClick={() => {
              setVisible(v => !v);
            }}
          />
        </div>
      );
    };

    render(<VoidTest />, root);

    fireEvent.input(getByTestId(root, 'i'), { target: { value: 'abc' } });
    fireEvent.click(getByTestId(root, 't'));

    expect(root.innerHTML).toMatchInlineSnapshot(
      `"<div><p>a</p><p>b</p><p>c</p><input data-testid="i" value="abc"><button data-testid="t"></button></div>"`,
    );
  });

  it('should handle fragment insertion', () => {
    const FragmentTest: FC = () => {
      const [visible, setVisible] = useState(false);

      return (
        <>
          {visible && <div>🙂</div>}
          <button
            data-testid="insert"
            onClick={() => {
              setVisible(v => !v);
            }}
          />
        </>
      );
    };

    render(<FragmentTest />, root);
    fireEvent.click(getByTestId(root, 'insert'));

    expect(root.innerHTML).toMatchInlineSnapshot(
      `"<div>🙂</div><button data-testid="insert"></button>"`,
    );
  });

  it('should memoize values', () => {
    const computeSpy = jest.fn();

    const MemoTest: FC = () => {
      const [value, setValue] = useState(0);
      const [, setOtherValue] = useState(0);

      const double = useMemo(() => {
        computeSpy();
        return value * 2;
      }, [value]);

      return (
        <>
          <p data-testid="double">{double}</p>;
          <button
            data-testid="inc-value"
            onClick={() => {
              setValue(v => v + 1);
            }}
          />
          <button
            data-testid="inc-other-value"
            onClick={() => {
              setOtherValue(v => v + 1);
            }}
          />
        </>
      );
    };

    render(<MemoTest />, root);

    expect(computeSpy).toHaveBeenCalledTimes(1);
    expect(getByTestId(root, 'double')).toHaveTextContent('0');

    fireEvent.click(getByTestId(root, 'inc-value'));

    expect(computeSpy).toHaveBeenCalledTimes(2);
    expect(getByTestId(root, 'double')).toHaveTextContent('2');

    fireEvent.click(getByTestId(root, 'inc-other-value'));

    expect(computeSpy).toHaveBeenCalledTimes(2);
    expect(getByTestId(root, 'double')).toHaveTextContent('2');

    fireEvent.click(getByTestId(root, 'inc-value'));

    expect(computeSpy).toHaveBeenCalledTimes(3);
    expect(getByTestId(root, 'double')).toHaveTextContent('4');
  });

  it('should memoize callbacks', () => {
    const computeSpy = jest.fn();

    const CallbackTest: FC = () => {
      const [value, setValue] = useState(0);
      const [, setOtherValue] = useState(0);

      const cb = useCallback(() => {
        // 🤷‍♂️
      }, [value]);

      const _derived = useMemo(() => {
        computeSpy();
        return cb;
      }, [cb]);

      return (
        <>
          <button
            data-testid="inc-value"
            onClick={() => {
              setValue(v => v + 1);
            }}
          />
          <button
            data-testid="inc-other-value"
            onClick={() => {
              setOtherValue(v => v + 1);
            }}
          />
        </>
      );
    };

    render(<CallbackTest />, root);

    expect(computeSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(getByTestId(root, 'inc-value'));

    expect(computeSpy).toHaveBeenCalledTimes(2);

    fireEvent.click(getByTestId(root, 'inc-other-value'));

    expect(computeSpy).toHaveBeenCalledTimes(2);

    fireEvent.click(getByTestId(root, 'inc-value'));

    expect(computeSpy).toHaveBeenCalledTimes(3);
  });

  it('should only run effect on mount / unmount', () => {
    const effectSpy = jest.fn();

    const LifecycleTest: FC = () => {
      useEffect(() => {
        effectSpy('setup');

        return () => {
          effectSpy('cleanup');
        };
      }, []);

      return null;
    };

    const EffectTest: FC = () => (
      <Toggle>
        <LifecycleTest />
      </Toggle>
    );

    render(<EffectTest />, root);

    expect(effectSpy.mock.calls).toEqual([]);

    fireEvent.click(getByTestId(root, 'toggle'));

    expect(effectSpy.mock.calls).toEqual([['setup']]);

    fireEvent.click(getByTestId(root, 'force-render'));

    expect(effectSpy.mock.calls).toEqual([['setup']]);

    fireEvent.click(getByTestId(root, 'toggle'));

    expect(effectSpy.mock.calls).toEqual([['setup'], ['cleanup']]);
  });

  it('should constantly run effect', () => {
    const effectSpy = jest.fn();

    const LifecycleTest: FC = () => {
      useEffect(() => {
        effectSpy('setup');

        return () => {
          effectSpy('cleanup');
        };
      });

      return null;
    };

    const EffectTest: FC = () => (
      <Toggle>
        <LifecycleTest />
      </Toggle>
    );

    render(<EffectTest />, root);

    expect(effectSpy.mock.calls).toEqual([]);

    fireEvent.click(getByTestId(root, 'toggle'));

    expect(effectSpy.mock.calls).toEqual([['setup']]);

    fireEvent.click(getByTestId(root, 'force-render'));

    expect(effectSpy.mock.calls).toEqual([['setup'], ['cleanup'], ['setup']]);

    fireEvent.click(getByTestId(root, 'toggle'));

    expect(effectSpy.mock.calls).toEqual([
      ['setup'],
      ['cleanup'],
      ['setup'],
      ['cleanup'],
    ]);
  });

  it('should run effect when dependencies change', () => {
    const effectSpy = jest.fn();

    const LifecycleTest: FC = () => {
      const [state, setState] = useState(0);

      useEffect(() => {
        effectSpy('setup');

        return () => {
          effectSpy('cleanup');
        };
      }, [state]);

      return (
        <button
          data-testid="set-state"
          onClick={() => {
            setState(s => s + 1);
          }}
        />
      );
    };

    const EffectTest: FC = () => (
      <Toggle>
        <LifecycleTest />
      </Toggle>
    );

    render(<EffectTest />, root);

    expect(effectSpy.mock.calls).toEqual([]);

    fireEvent.click(getByTestId(root, 'toggle'));

    expect(effectSpy.mock.calls).toEqual([['setup']]);

    fireEvent.click(getByTestId(root, 'force-render'));

    expect(effectSpy.mock.calls).toEqual([['setup']]);

    fireEvent.click(getByTestId(root, 'set-state'));

    expect(effectSpy.mock.calls).toEqual([['setup'], ['cleanup'], ['setup']]);

    fireEvent.click(getByTestId(root, 'toggle'));

    expect(effectSpy.mock.calls).toEqual([
      ['setup'],
      ['cleanup'],
      ['setup'],
      ['cleanup'],
    ]);
  });
});
