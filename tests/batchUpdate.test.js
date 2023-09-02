const { effect, proxyObject } = require("../src/effect");

test("batch update", () => {
  const data = { foo: 1 };
  const obj = proxyObject(data);

  // 对于一个副作用函数被同时调用多次，使用set去重
  let sameJobQueue = new Set();

  function runEffect(effectFunc) {
    sameJobQueue.add(effectFunc);
    // 微任务Promise.resolve().then只需要注册一次即可
    if (sameJobQueue.size > 1) return;
    // 微任务执行时，sameJobQueue中至少有一个effect
    Promise.resolve().then(() => {
      sameJobQueue.forEach((job) => job());
      sameJobQueue.clear();
    });
  }

  const fn = jest.fn(() => obj.foo);
  // const fn = () => console.log(obj.foo);

  effect(fn, {
    scheduler(effectFunc) {
      runEffect(effectFunc);
    },
  });

  obj.foo++;
  obj.foo++;

  setTimeout(() => {
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
