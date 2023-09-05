const { proxyObject, effect } = require("../src/effect");

test("will not track", () => {
  const original = {
    foo: 1,
    get bar() {
      return this.foo;
    },
  };

  const p = proxyObject(original);

  const fn = jest.fn(() => console.log(p.bar));

  effect(fn);

  expect(fn).toHaveBeenCalledTimes(1);

  p.foo++;

  expect(fn).toHaveBeenCalledTimes(2);
});
