const bucket = new WeakMap();
let effectStack = [];

function cleanUp(effectFn) {
  // 从每一个副作用函数集合中删除旧的effectFn
  effectFn.deps.forEach((depSet) => depSet.delete(effectFn));
  // 现在没有副作用函数集合收集着effectFn, 因此重置effectFn.deps
  effectFn.deps.length = 0;
}

function effect(fn, options = {}) {
  const effectFn = () => {
    // 删除旧的副作用函数
    cleanUp(effectFn);

    effectStack.push(effectFn);

    // 通知每个副作用函数集合收集最新的effectFn
    let res = fn();

    effectStack.pop();
    return res;
  };

  // 副作用函数配置项
  effectFn.options = options;

  // 收集所有包含着effectFn的副作用函数集合，放入一个列表中
  effectFn.deps = [];

  if (!options.lazy) {
    effectFn();
  }
  return effectFn;
}

function proxyObject(data) {
  const p = new Proxy(data, {
    // receiver: the proxy instance or an object that inherits from the proxy instance
    // receiver === p
    get(target, key, receiver) {
      // true false
      // console.log(receiver === p, receiver === target);
      track(target, key);

      // receiver === this
      return Reflect.get(target, key, receiver);
    },

    set(target, key, newVal) {
      target[key] = newVal;
      trigger(target, key);
      return true;
    },
  });
  return p;
}

function track(target, key) {
  let currEffect = effectStack[effectStack.length - 1];
  if (!currEffect) return;
  let depsMap = bucket.get(target);
  if (!depsMap) bucket.set(target, (depsMap = new Map()));
  let deps = depsMap.get(key);
  if (!deps) depsMap.set(key, (deps = new Set()));
  deps.add(currEffect);
  currEffect.deps.push(deps);
}

function trigger(target, key) {
  let depsMap = bucket.get(target);
  if (!depsMap) return;
  let deps = depsMap.get(key);
  if (!deps) return;
  let currEffect = effectStack[effectStack.length - 1];
  [...deps].forEach((effectFunc) => {
    // 如果当前的副作用函数和触发执行的副作用函数是同一个，则不执行
    if (effectFunc === currEffect) {
      return;
    }
    if (effectFunc.options.scheduler) {
      effectFunc.options.scheduler(effectFunc);
    } else {
      effectFunc();
    }
  });
}

module.exports = {
  bucket,
  effect,
  proxyObject,
  track,
  trigger,
};
