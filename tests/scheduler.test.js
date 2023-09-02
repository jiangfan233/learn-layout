const { effect, proxyObject } = require("../src/effect");

test("scheduler", () => {
  const data = { foo: 1 };
  const obj = proxyObject(data);

  const log = jest.fn(() => console.log("done"));

  const fn = jest.fn(() => obj.foo);
  effect(fn, {
    scheduler(f) {
      setTimeout(f);
    },
  });

  obj.foo++;

  log();
  expect(log).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledTimes(1);

  setTimeout(() => {
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
