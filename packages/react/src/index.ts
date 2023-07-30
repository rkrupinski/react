type HostElementType = HTMLElement['nodeName'];

type FunctionComponent<T = unknown> = (props: Props<T>) => Element | null;

type Node = Element | string | number | boolean | null | undefined | Node[];

type Tag =
  | 'root'
  | 'hostText'
  | 'hostComponent'
  | 'functionComponent'
  | 'fragment'
  | 'void';

type EffectTag = 'add' | 'remove' | 'update';

type SetterOrUpdater<T> = (arg: T | ((prev: T) => T)) => void;

type StateHook<T = any> = {
  type: 'state';
  pending: Array<Parameters<SetterOrUpdater<T>>[0]>;
  value: T;
  dispatch: SetterOrUpdater<T>;
};

type MemoHook<T = any> = {
  type: 'memo';
  value: T;
  deps: any[];
};

type EffectHook = {
  type: 'effect';
  deps?: any[];
  depsChanged: boolean;
  setup: (() => VoidFunction) | VoidFunction;
  cleanup?: VoidFunction;
};

type Hook = StateHook | MemoHook | EffectHook;

type Props<T = unknown> = {
  key?: string;
  children?: Node[];
} & T;

type TextProps = {
  nodeValue: string;
};

export type Element = {
  type: HostElementType | FunctionComponent | typeof FRAGMENT;
  key: string | null;
  props: Props;
};

type Fiber = {
  key: string | null;
  tag: Tag;
  type:
    | Element['type']
    | typeof FRAGMENT
    | typeof TEXT
    | typeof ROOT
    | typeof VOID;
  props: Props;
  hooks: Hook[];
  index: number;
  visited: boolean;
  child: Fiber | null;
  sibling: Fiber | null;
  return: Fiber | null;
  dom: HTMLElement | Text | null;
  effectTag: EffectTag | null;
  nextEffect: Fiber | null;
  alternate: Fiber | null;
};

const VOID = Symbol('VOID');
const ROOT = Symbol('ROOT');
const TEXT = Symbol('TEXT');
const FRAGMENT = Symbol('FRAGMENT');

let scheduler: typeof requestIdleCallback =
  window.requestIdleCallback ??
  (cb => {
    // eslint-disable-next-line n/no-callback-literal
    cb({ timeRemaining: () => 1, didTimeout: false });
    return 1;
  });

let _nextUnitOfWork: Fiber | null;
let _currentRoot: Fiber | null = null;
let _wipRoot: Fiber | null = null;
let _firstEffect: Fiber | null = null;
let _lastEffect: Fiber | null = null;
let _hookIndex = -1;

const _isStateHook = <T>(hook: Hook): hook is StateHook<T> =>
  hook.type === 'state';

const _isMemoHook = <T>(hook: Hook): hook is MemoHook<T> =>
  hook.type === 'memo';

const _isEffectHook = (hook: Hook): hook is EffectHook =>
  hook.type === 'effect';

const _scheduleEffect = (fiber: Fiber) => {
  if (!_lastEffect) {
    _firstEffect = fiber;
    _lastEffect = _firstEffect;
  } else {
    _lastEffect.nextEffect = fiber;
    _lastEffect = fiber;
  }
};

const _propsEqual = (
  { children: _1, ...a }: Props<any>,
  { children: _2, ...b }: Props<any>,
) => {
  const aKeys = Object.keys(a);

  if (aKeys.length !== Object.keys(b).length) return false;

  return aKeys.every(key => a[key] === b[key]);
};

const _depsEqual = <T>(a: T[] = [], b: T[] = []) => {
  if (a.length !== b.length) return false;

  return a.every((val, i) => val === b[i]);
};

const _getEffects = (fiber: Fiber) =>
  fiber.hooks.filter(_isEffectHook).filter(({ depsChanged }) => depsChanged);

const _runCleanup = (fiber: Fiber) => {
  fiber.hooks.forEach(hook => {
    if (hook.type === 'effect') hook.cleanup?.();
  });
};

const createElement = (
  elementType: Element['type'],
  props: Props<any> | null,
  ...children: Node[]
): Element => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { __self, __source, key = null, ...otherProps } = props ?? {};

  return {
    type: elementType,
    key,
    props: {
      ...otherProps,
      children,
    },
  };
};

const _createFiber = (
  overrides: Pick<Fiber, 'tag' | 'type'> & Partial<Omit<Fiber, 'tag' | 'type'>>,
): Fiber => ({
  key: null,
  props: {},
  hooks: [],
  index: 0,
  visited: false,
  child: null,
  sibling: null,
  return: null,
  dom: null,
  effectTag: null,
  nextEffect: null,
  alternate: null,
  ...overrides,
});

const _toEventName = (prop: string) => prop.slice(2).toLowerCase();
const _isHandler = (prop: string) => prop.startsWith('on');
const _isProp = (prop: string) => !_isHandler(prop);

const _diffProps = (
  { children: _c1, key: _k1, ...prev }: Props<any>,
  { children: _c2, key: _k2, ...curr }: Props<any>,
) => {
  const prevKeys = Object.keys(prev);
  const currKeys = Object.keys(curr);
  const isAdded = (key: string) => !prev[key] || curr[key] !== prev[key];
  const isRemoved = (key: string) => !curr[key] || curr[key] !== prev[key];

  return {
    added: {
      props: currKeys.filter(_isProp).filter(isAdded),
      handlers: currKeys.filter(_isHandler).filter(isAdded),
    },
    removed: {
      props: prevKeys.filter(_isProp).filter(isRemoved),
      handlers: prevKeys.filter(_isHandler).filter(isRemoved),
    },
  };
};

const _getParentDom = (fiber: Fiber) => {
  let parentFiber = fiber.return;

  while (!parentFiber?.dom) {
    parentFiber = parentFiber?.return ?? null;
  }

  const parentDom: HTMLElement = parentFiber?.dom as any;

  return parentDom;
};

const _getFirstDom = (fiber: Fiber): Fiber['dom'] => {
  switch (fiber.tag) {
    case 'void':
      return null;
    case 'hostComponent':
    case 'hostText':
      return fiber.dom;
    case 'functionComponent':
    case 'fragment': {
      let child = fiber.child;
      while (child) {
        const dom = _getFirstDom(child);
        if (dom) return dom;
        child = child.sibling;
      }
      return null;
    }
    default:
      throw new Error('WAT');
  }
};

const _removeDom = (fiber: Fiber, domParent: HTMLElement) => {
  switch (fiber.tag) {
    case 'void':
      // 🤷‍♂️
      break;
    case 'hostComponent':
    case 'hostText':
      if (fiber.dom) domParent.removeChild(fiber.dom);
      break;
    case 'functionComponent':
      _runCleanup(fiber);
    // eslint-disable-next-line no-fallthrough
    case 'fragment': {
      let child = fiber.child;
      while (child) {
        _removeDom(child, domParent);
        child = child.sibling;
      }
      break;
    }
    default:
      throw new Error('WAT');
  }
};

const _getSiblingDom = (fiber: Fiber): Fiber['dom'] => {
  let sibling = fiber?.alternate?.sibling ?? null;

  while (sibling) {
    const dom = _getFirstDom(sibling);
    if (dom) return dom;
    sibling = sibling.sibling;
  }

  if (fiber.return && !fiber.return.dom) return _getSiblingDom(fiber.return);

  return null;
};

const _reorderSiblings = (fiber: Fiber, start: Fiber) => {
  let curr: Fiber | null = fiber;

  while (curr?.sibling) {
    if (curr.sibling.key === start.key) curr.sibling = curr.sibling.sibling;
    curr = curr.sibling;
  }

  start.sibling = fiber;

  return start;
};

const _createDom = (fiber: Fiber) => {
  if (fiber.type === TEXT)
    return document.createTextNode((fiber.props as TextProps).nodeValue);
  if (typeof fiber.type === 'string') return document.createElement(fiber.type);
  return null;
};

const _isArray = (el: Node): el is Node[] => Array.isArray(el);

const _isVoid = (el: Node): el is null | undefined | boolean =>
  el === null || typeof el === 'undefined' || typeof el === 'boolean';

const _isText = (el: Node): el is string | number =>
  typeof el === 'string' || typeof el === 'number';

const _isElement = (el: Node): el is Element =>
  !_isVoid(el) && !_isArray(el) && !_isText(el);

const _getKey = (el: Node) => {
  if (_isArray(el) || _isText(el) || _isVoid(el)) return null;
  return el.key;
};

const _getWorkTag = (el: Node): Tag => {
  if (_isArray(el)) return 'fragment';
  if (_isText(el)) return 'hostText';
  if (_isVoid(el)) return 'void';
  if (el.type === FRAGMENT) return 'fragment';
  if (typeof el.type === 'string') return 'hostComponent';
  if (typeof el.type === 'function') return 'functionComponent';
  return 'hostComponent';
};

const _getWorkType = (el: Node): Fiber['type'] => {
  if (_isArray(el)) return FRAGMENT;
  if (_isText(el)) return TEXT;
  if (_isVoid(el)) return VOID;
  return el.type;
};

const _getProps = (el: Node): Props<any> => {
  if (_isArray(el)) return { children: el };
  if (_isText(el)) return { nodeValue: el };
  if (_isVoid(el)) return {};
  return el.props;
};

const _updateFunctionComponent = (fiber: Fiber) => {
  _hookIndex = -1;

  fiber.props = {
    ...fiber.props,
    children: [(fiber.type as FunctionComponent)(fiber.props)],
  };
};

const _updateHostComponent = (fiber: Fiber) => {
  if (!fiber.dom) fiber.dom = _createDom(fiber);
};

const _updateDom = (
  el: HTMLElement,
  prevProps: Props<any>,
  props: Props<any>,
) => {
  const { removed, added } = _diffProps(prevProps, props);

  removed.props.forEach(p => {
    el.removeAttribute(p === 'className' ? 'class' : p);
  });

  removed.handlers.forEach(h => {
    el.removeEventListener(_toEventName(h), prevProps[h]);
  });

  added.props.forEach(p => {
    switch (p) {
      case 'className':
        el.className = props[p];
        break;
      case 'value':
      case 'checked':
        (el as any)[p] = props[p];
      // eslint-disable-next-line no-fallthrough
      default:
        el.setAttribute(p, props[p]);
        break;
    }
  });

  added.handlers.forEach(h => {
    el.addEventListener(_toEventName(h), props[h]);
  });
};

const _beginWork = (fiber: Fiber) => {
  if (fiber.visited) return null;

  fiber.visited = true;

  if (fiber.tag === 'root') {
    // 🤷‍♂️
  } else if (!fiber.alternate) {
    fiber.effectTag = 'add';
    _scheduleEffect(fiber);
  } else {
    let keyMismatch = false;

    if (fiber.key !== null && fiber.key !== fiber.alternate.key) {
      let alt: Fiber | null = fiber.alternate;

      while (alt && alt.key !== fiber.key) alt = alt.sibling;

      if (alt) {
        fiber.alternate = _reorderSiblings(fiber.alternate, alt);
        fiber.hooks = fiber.alternate.hooks;
        fiber.dom = fiber.alternate.dom;
      } else {
        keyMismatch = true;
      }
    }

    if (keyMismatch || fiber.type !== fiber.alternate.type) {
      const alt = fiber.alternate;

      fiber.hooks = [];
      fiber.dom = null;
      fiber.alternate = _createFiber({ ...alt, child: null });
      fiber.effectTag = 'add';
      _scheduleEffect(fiber);

      alt.effectTag = 'remove';
      _scheduleEffect(alt);
    } else if (!_propsEqual(fiber.alternate.props, fiber.props)) {
      fiber.effectTag = 'update';
      _scheduleEffect(fiber);
    }
  }

  switch (fiber.tag) {
    case 'functionComponent':
      _updateFunctionComponent(fiber);
      if (!fiber.effectTag && fiber.hooks.length) _scheduleEffect(fiber);
      break;
    case 'hostText':
    case 'hostComponent':
      _updateHostComponent(fiber);
      break;
    default:
      // 🤷‍♂️
      break;
  }

  const { children = [] } = fiber.props;

  if (children.length) {
    const c = children[0];
    const tag = _getWorkTag(c);

    const childFiber = _createFiber({
      tag,
      key: _getKey(c),
      type: _getWorkType(c),
      props: _getProps(c),
      hooks: tag === 'void' ? [] : fiber.alternate?.child?.hooks ?? [],
      dom: tag === 'void' ? null : fiber.alternate?.child?.dom ?? null,
      index: 0,
      return: fiber,
      alternate: fiber.alternate?.child ?? null,
    });

    fiber.child = childFiber;

    return childFiber;
  }

  let altChild = fiber.alternate?.child;

  while (altChild) {
    altChild.effectTag = 'remove';
    _scheduleEffect(altChild);
    altChild = altChild.sibling;
  }

  return null;
};

const _completeWork = (fiber: Fiber) => {
  const siblings = fiber.return?.props.children ?? [];
  const index = fiber.index + 1;

  if (index in siblings) {
    const s = siblings[index];
    const tag = _getWorkTag(s);

    const siblingFiber = _createFiber({
      tag,
      key: _getKey(s),
      type: _getWorkType(s),
      props: _getProps(s),
      hooks: tag === 'void' ? [] : fiber.alternate?.sibling?.hooks ?? [],
      dom: tag === 'void' ? null : fiber.alternate?.sibling?.dom ?? null,
      index,
      return: fiber.return,
      alternate: fiber.alternate?.sibling ?? null,
    });

    fiber.sibling = siblingFiber;

    return siblingFiber;
  }

  let altSibling = fiber.alternate?.sibling;

  while (altSibling) {
    altSibling.effectTag = 'remove';
    _scheduleEffect(altSibling);
    altSibling = altSibling.sibling;
  }

  return fiber.return;
};

const _performUnitOfWork = (fiber: Fiber) =>
  _beginWork(fiber) ?? _completeWork(fiber);

const _commitWork = (effectFiber: Fiber | null) => {
  const effects: EffectHook[] = [];
  let curr = effectFiber;

  while (curr) {
    switch (curr.effectTag) {
      case 'add':
        if (curr.dom instanceof HTMLElement)
          _updateDom(curr.dom, {}, curr.props);

        if (curr.dom)
          _getParentDom(curr).insertBefore(curr.dom, _getSiblingDom(curr));

        effects.push(..._getEffects(curr));
        break;

      case 'update':
        if (curr.dom instanceof Text) {
          curr.dom.nodeValue = (curr.props as TextProps).nodeValue;
        } else if (curr.dom instanceof HTMLElement) {
          _updateDom(curr.dom, curr.alternate?.props ?? {}, curr.props);
        }

        effects.push(..._getEffects(curr));
        break;

      case 'remove':
        _removeDom(curr, _getParentDom(curr));
        break;

      default:
        effects.push(..._getEffects(curr));
        break;
    }

    const tmp = curr;
    curr = curr.nextEffect;
    tmp.effectTag = null;
    tmp.nextEffect = null;
  }

  effects.forEach(effect => {
    effect.cleanup?.();
    effect.cleanup = effect.setup() ?? undefined;
  });
};

const _workLoop = (deadline: IdleDeadline) => {
  if (!_nextUnitOfWork && _wipRoot) {
    _currentRoot = _wipRoot;
    _wipRoot = null;
    _commitWork(_firstEffect);
    return;
  }

  while (_nextUnitOfWork && deadline.timeRemaining() > 0) {
    _nextUnitOfWork = _performUnitOfWork(_nextUnitOfWork);
  }

  scheduler(_workLoop);
};

const useState = <T>(initialValue: T | (() => T)): [T, SetterOrUpdater<T>] => {
  _hookIndex++;

  const fiber = _nextUnitOfWork;

  if (!fiber) throw new Error('WAT');

  if (!fiber.hooks[_hookIndex])
    fiber.hooks[_hookIndex] = {
      type: 'state',
      pending: [],
      value: initialValue instanceof Function ? initialValue() : initialValue,
      dispatch: (arg: Parameters<SetterOrUpdater<T>>[0]) => {
        (hook as StateHook<T>).pending.push(arg);

        _wipRoot = _createFiber({
          ..._currentRoot,
          tag: 'root',
          type: ROOT,
          visited: false,
          child: null,
          sibling: null,
          alternate: _currentRoot,
        });

        _nextUnitOfWork = _wipRoot;
        _firstEffect = null;
        _lastEffect = null;

        scheduler(_workLoop);
      },
    };

  const hook = fiber.hooks[_hookIndex];

  if (!_isStateHook<T>(hook)) throw new Error('WAT');

  hook.value = hook.pending.reduce<T>(
    (acc, curr) => (curr instanceof Function ? curr(acc) : curr),
    hook.value,
  );

  hook.pending = [];

  return [hook.value, hook.dispatch];
};

const useMemo = <T>(makeValue: () => T, deps: any[]) => {
  _hookIndex++;

  const fiber = _nextUnitOfWork;

  if (!fiber) throw new Error('WAT');

  if (!fiber.hooks[_hookIndex]) {
    fiber.hooks[_hookIndex] = {
      type: 'memo',
      value: makeValue(),
      deps,
    };
  }

  const hook = fiber.hooks[_hookIndex];

  if (!_isMemoHook<T>(hook)) throw new Error('WAT');

  if (!_depsEqual(hook.deps, deps)) {
    hook.value = makeValue();
    hook.deps = deps;
  }

  return hook.value;
};

const useCallback = <T extends (...args: any[]) => any>(cb: T, deps: any[]) =>
  useMemo<T>(() => cb, deps);

const useEffect = (
  setup: (() => VoidFunction) | VoidFunction,
  deps?: any[],
) => {
  _hookIndex++;

  const fiber = _nextUnitOfWork;

  if (!fiber) throw new Error('WAT');

  const prevHook = fiber.hooks[_hookIndex];

  if (!prevHook) {
    fiber.hooks[_hookIndex] = {
      type: 'effect',
      deps,
      depsChanged: true,
      setup,
    };

    return;
  }

  const hook = fiber.hooks[_hookIndex];

  if (!_isEffectHook(hook)) throw new Error('WAT');

  hook.depsChanged = !deps || !_depsEqual(hook.deps, deps);
  hook.deps = deps;
  hook.setup = setup;
};

const render = (el: Element, dom: HTMLElement) => {
  _wipRoot = _createFiber({
    key: el.key,
    tag: 'root',
    type: ROOT,
    props: { children: [el] },
    dom,
    alternate: _currentRoot,
  });

  _nextUnitOfWork = _wipRoot;

  scheduler(_workLoop);
};

const unmountAt = (dom: HTMLElement) => {
  dom.innerHTML = '';
  _nextUnitOfWork = null;
  _currentRoot = null;
  _wipRoot = null;
  _firstEffect = null;
  _lastEffect = null;
  _hookIndex = -1;
};

export const _doNotTouchOrYouWillBeFired = {
  setScheduler: (fn: typeof scheduler) => (scheduler = fn),
};

export {
  render,
  unmountAt,
  createElement,
  useState,
  useMemo,
  useCallback,
  useEffect,
  FRAGMENT as Fragment,
  type Node,
  type FunctionComponent,
  type FunctionComponent as FC,
};
