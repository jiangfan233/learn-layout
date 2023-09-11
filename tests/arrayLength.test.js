const { reactive, effect } = require("../src/effect");

test("test add a new element to an array", () => {
  const data = [1];

  const p = reactive(data);

  const fn = jest.fn(() => p.length);

  effect(fn);

  expect(fn).toHaveBeenCalledTimes(1);

  p[1] = 2;

  expect(fn).toHaveBeenCalledTimes(2);
});

test("test modify the value of the length property of an array", () => {
  const data = [1];

  const p = reactive(data);

  const fn = jest.fn(() => p.length);

  effect(fn);

  expect(fn).toHaveBeenCalledTimes(1);

  p.length = 0;

  expect(fn).toHaveBeenCalledTimes(2);
});


test("test modify the value of the length property of an array 22222", () => {
  const data = [1, 2, 3];

  const p = reactive(data);

  const fn1 = jest.fn(() => p[0]);
  const fn2 = jest.fn(() => p[2]);

  effect(fn1);
  effect(fn2);

  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);

  p.length = 0;

  expect(fn1).toHaveBeenCalledTimes(2);
  expect(fn2).toHaveBeenCalledTimes(2);
});