const { effect, proxyObject, bucket } = require("../src/effect");

test("avoid calling itself", () => {
  const data = { age: 1 };
  const obj = proxyObject(data);

  const fn = jest.fn(() => obj.age++);

  effect(fn);

  expect(fn).toHaveBeenCalledTimes(1);
  expect(obj.age).toBe(2);
});
