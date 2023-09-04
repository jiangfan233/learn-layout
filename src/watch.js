const { effect } = require("../src/effect");

function watch(source, cb, options = {}) {
  let getter;
  if (typeof source === "function") {
    getter = source;
  } else {
    getter = () => traverse(source);
  }

  let oldValue;
  let newValue;

  // 当副作用函数为一个异步函数时，返回的结果不一定是根据最新的状态得到的
  // 这是需要使用 onInvalidate 控制
  // 当cb执行时这里才会注册一个cleanUp函数
  // 之后每次在cb执行前都会运行一下cleanUp函数
  let cleanUp;
  function onInvalidate(fn) {
    cleanUp = fn;
  }

  const job = () => {
    // 在scheduler中拿到新值
    // 这里运用了js的变量提升
    newValue = effectFn();
    if (cleanUp) cleanUp();
    cb(newValue, oldValue, onInvalidate);
    oldValue = newValue;
  };

  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler() {
      // 表示在组件更新后执行副作用函数
      // 也就是在UI更新后执行副作用函数
      if (options.flush === "post") {
        Promise.resolve().then(job);
      } else {
        // options.flush === "sync"
        job();

        // options.flush === "pre": 表示在组件更新前执行副作用函数
      }
    },
  });

  if (options.immediate) {
    job();
  } else {
    // 直接执行一次effectFn拿到旧值
    oldValue = effectFn();
  }
}

function traverse(value, seen = new Set()) {
  if (typeof value !== "object" || value === null || seen.has(value)) return;
  seen.add(value);
  for (let k in value) {
    traverse(value[k], seen);
  }
  return value;
}

module.exports = {
  watch,
};
