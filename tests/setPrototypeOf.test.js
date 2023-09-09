const { reactive, effect } = require("../src/effect");

test("test setPrototypeOf to proxy", () => {
  const obj = {};
  const proto = { bar: 1 };

  const child = reactive(obj);
  const parent = reactive(proto);

  Object.setPrototypeOf(child, parent);

  const fn = jest.fn(() => console.log(child.bar));
  effect(fn);

  expect(fn).toHaveBeenCalledTimes(1);

  child.bar = 22;

  expect(fn).toHaveBeenCalledTimes(2);
});

test("target would change", () => {
  const checkSame = jest.fn((target, obj) => {
    let res = obj === target;
    console.log("checkSame:", res);
    expect(res).toBe(true);
  });

  function getProxy(obj) {
    return new Proxy(obj, {
      get(target, key, receiver) {
        if (key === "raw") return target;
        return Reflect.get(target, key, receiver);
      },
      set(target, key, newValue, receiver) {
        wouldBeDifferent(() => {
          expect(obj).not.toBe(undefined);
          expect(proto).not.toBe(undefined);
          return { target, receiver };
        });
        return Reflect.set(target, key, newValue, receiver);
      },
    });
  }

  const obj = {};
  const proto = { bar: 1 };

  const child = getProxy(obj);
  const parent = getProxy(proto);

  Object.setPrototypeOf(child, parent);

  const wouldBeDifferent = jest
    .fn()
    .mockImplementationOnce((cb) => {
      const { target, receiver } = cb();
      expect(target === obj && receiver.raw === obj).toBe(true);
      console.log("first call done!")
    })
    .mockImplementationOnce((cb) => {
      const { target, receiver } = cb();
      expect(target === proto && receiver.raw === obj).toBe(true);
      console.log("second call done!");
    })
    .mockImplementationOnce(cb => console.log("this should not be called!!!"))


  child.bar = 11111;
});
