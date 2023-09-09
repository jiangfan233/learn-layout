const { readOnly, shallowReadOnly, effect } = require("../src/effect");

test("deep read-only test", () => {

  const data = { foo: { bar: 1 } };

  const p = readOnly(data);

  const fn = jest.fn(() => console.log(p.foo.bar));
  effect(fn);
  
  expect(fn).toHaveBeenCalledTimes(1);

  p.foo.bar = 2;
  expect(p.foo.bar).toBe(1);
  expect(fn).toHaveBeenCalledTimes(1);

})

test("shallow read-only test", () => {
  const data = { foo: { bar: 1 } };

  const p = shallowReadOnly(data);

  const fn = jest.fn(() => console.log(p.foo));
  const fn2 = jest.fn(() => console.log(p.foo.bar));
  effect(fn);
  effect(fn2);

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);

  p.foo = undefined;
  expect(p.foo).not.toBe(undefined);
  expect(p.foo.bar).toBe(1);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);

  p.foo.bar ++;
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(p.foo.bar).toBe(2);

});