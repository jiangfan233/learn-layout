const { effect, proxyObject, bucket } = require("../src/effect");

test("nested effects", () => {
  const data = {
    foo: true,
    bar: true,
  };

  const obj = proxyObject(data);

  let tmp1, tmp2;

  const fn2 = jest.fn(() => {
    tmp2 = obj.bar;
  });

  // 每次fn1运行，都会产生一个新的fn2
  const fn1 = jest.fn(() => {
    effect(fn2);

    tmp1 = obj.foo;
  });

  effect(fn1);
  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(1);
  expect(tmp1).toBe(true);
  expect(tmp2).toBe(true);

  obj.foo = false;
  expect(fn1).toHaveBeenCalledTimes(2);
  expect(fn2).toHaveBeenCalledTimes(2);
  expect(tmp1).toBe(false);

  obj.bar = false;
  expect(fn1).toHaveBeenCalledTimes(2);
  expect(fn2).toHaveBeenCalledTimes(4);
  expect(tmp2).toBe(false);
  expect(bucket.get(data).get("bar").size).toBe(2);
});
