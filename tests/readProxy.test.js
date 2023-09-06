const { effect, proxyObject } = require("../src/effect");

test("test in operator", () => {
  const data = { foo: 1 };
  const p = proxyObject(data);

  const fn = jest.fn(() => console.log("foo" in p));

  effect(fn);

  expect(fn).toHaveBeenCalledTimes(1);

  p.foo++;

  expect(fn).toHaveBeenCalledTimes(2);
});

test("test for-in operator", () => {
  const data = { foo: 1 };
  const p = proxyObject(data);

  const fn1 = jest.fn(() => {
    for (let key in p) {
      console.log(key, "--------");
    }
  });

  effect(fn1);
  expect(fn1).toHaveBeenCalledTimes(1);

  p.bar = "hello";

  expect(fn1).toHaveBeenCalledTimes(2);
});


test("test delete operate", () => {
  const data = { foo: 1 };
  const p = proxyObject(data);

  const fn1 = jest.fn(() => {
    for (let key in p) {
      console.log(key, "--------");
    }
  });

  effect(fn1);
  expect(fn1).toHaveBeenCalledTimes(1);

  delete p.foo;

  expect(fn1).toHaveBeenCalledTimes(2);
});
