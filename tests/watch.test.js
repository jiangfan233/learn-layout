const { watch } = require("../src/watch");
const { proxyObject } = require("../src/effect");

test("watch test", () => {
  const data = { foo: 1 };
  const obj = proxyObject(data);

  const fn = jest.fn((curr, prev) => {
    obj.foo;
    expect(curr).toBe(obj.foo);
    expect(curr).toBe(2);
    expect(prev).toBe(curr > 1 ? curr - 1 : undefined);
  });
  watch(() => obj.foo, fn);

  expect(fn).toHaveBeenCalledTimes(0);

  obj.foo++;

  expect(fn).toHaveBeenCalledTimes(1);
});

test("test watch immediate option", () => {
  const data = { foo: 1 };
  const obj = proxyObject(data);

  const fn = jest.fn((curr, prev) => {
    obj.foo;
    expect(curr).toBe(obj.foo);
    expect(prev).toBe(curr > 1 ? curr - 1 : undefined);
  });
  watch(() => obj.foo, fn, { immediate: true });

  expect(fn).toHaveBeenCalledTimes(1);

  obj.foo++;

  expect(fn).toHaveBeenCalledTimes(2);
});

test("test watch flush option", () => {
  const data = { foo: 1 };
  const obj = proxyObject(data);

  const fn = jest.fn((curr, prev) => {
    obj.foo;
    expect(curr).toBe(obj.foo);
    expect(prev).toBe(curr > 1 ? curr - 1 : undefined);
  });
  watch(() => obj.foo, fn, { flush: "post" });

  expect(fn).toHaveBeenCalledTimes(0);

  obj.foo++;

  expect(fn).toHaveBeenCalledTimes(0);

  setTimeout(() => {
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

jest.useFakeTimers();
jest.spyOn(global, "setTimeout");

test("test watch onInvalidate argument", () => {
  const data = { foo: 1 };
  const obj = proxyObject(data);

  let n = 3;
  let id;
  let res;
  const once = jest.fn(() => {
    res = n;
  });

  const func = () => {
    id = setTimeout(once, n-- * 1000);
  };

  const clear = jest.fn(() => {
    expect(id).toBeTruthy();
    clearTimeout(id);
  });

  const fn = jest.fn((curr, prev, onInvalidate) => {
    func();
    onInvalidate(clear);
  });

  watch(() => obj.foo, fn);

  expect(fn).toHaveBeenCalledTimes(0);

  obj.foo++;

  // Fast-forward until all timers have been executed
  jest.advanceTimersByTime(4000);

  expect(fn).toHaveBeenCalledTimes(1);
  expect(clear).toHaveBeenCalledTimes(0);

  obj.foo++;

  expect(fn).toHaveBeenCalledTimes(2);
  expect(clear).toHaveBeenCalledTimes(1);
  expect(res).toBe(2);
  expect(once).toHaveBeenCalledTimes(1);
});

test("test watch onInvalidate argument 2222", () => {
  const data = { foo: 1 };
  const obj = proxyObject(data);

  let n = 1;
  let id;
  let res;
  const once = jest.fn(() => {
    res = n;
  });

  const clear = jest.fn(() => {
    expect(id).toBeTruthy();
    clearTimeout(id);
  });

  const fn = jest.fn((curr, prev, onInvalidate) => {
    id = setTimeout(once, n++ * 1000);
    onInvalidate(clear);
  });

  watch(() => obj.foo, fn);

  expect(fn).toHaveBeenCalledTimes(0);

  obj.foo++;

  // Fast-forward until all timers have been executed
  jest.advanceTimersByTime(4000);

  expect(fn).toHaveBeenCalledTimes(1);
  expect(clear).toHaveBeenCalledTimes(0);

  obj.foo++;

  expect(fn).toHaveBeenCalledTimes(2);
  expect(clear).toHaveBeenCalledTimes(1);
  expect(res).toBe(2);
  expect(once).toHaveBeenCalledTimes(1);
});
