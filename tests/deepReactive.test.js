const { effect, reactive } = require("../src/effect");

test("Deep reactive test", () => {
  const obj = { data: { foo: 1 } };
  const p = reactive(obj);

  const fn = jest.fn(() => console.log("p.data.foo: ", p.data.foo));

  effect(fn);

  expect(fn).toHaveBeenCalledTimes(1);

  p.data.foo ++;

  expect(fn).toHaveBeenCalledTimes(2);
  expect(p.data.foo).toBe(2);

})