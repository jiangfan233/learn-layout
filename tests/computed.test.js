const { effect, proxyObject } = require("../src/effect");
const { computed } = require("../src/computed");

test("options.lazy test", () => {
  const data = { foo: 1 };
  const obj = proxyObject(data);

  const fn = jest.fn(() => obj.foo);

  const fooObj = computed(fn);

  // 测试options.lazy
  expect(fn).toHaveBeenCalledTimes(0);

  let foo = fooObj.value;
  expect(fn).toHaveBeenCalledTimes(1);
  expect(foo).toBe(1);

  // 测试computed缓存功能
  foo = fooObj.value;
  foo = fooObj.value;
  foo = fooObj.value;
  expect(fn).toHaveBeenCalledTimes(1);

  // 测试dirty功能，即obj.foo的值变化后计算属性仍能获取到新的值
  obj.foo++;
  foo = fooObj.value;
  expect(fn).toHaveBeenCalledTimes(2);
  expect(foo).toBe(2);

  // 测试在副作用函数中使用计算属性，该副作用函数能够被收集
  let val = 0;
  const fn2 = jest.fn(() => {
    val = fooObj.value;
  });
  effect(fn2);
  expect(val).toBe(2);
  expect(fn2).toHaveBeenCalledTimes(1);

  obj.foo++;
  expect(fn2).toHaveBeenCalledTimes(2);
  expect(val).toBe(3);
});
