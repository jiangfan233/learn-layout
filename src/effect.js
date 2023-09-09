const bucket = new WeakMap();
let effectStack = [];
const ITERATE_KEY = Symbol();

const TriggerType = {
  SET: "SET",
  ADD: "ADD",
  DELETE: "DELETE",
};

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
    // receiver === p, receiver默认是proxy实例
    get(target, key, receiver) {
      // 设置一个raw指针指向receiver的原始对象
      if (key === "raw") {
        return target;
      }

      // true false
      // console.log(receiver === p, receiver === target);
      track(target, key);

      // receiver === this
      return Reflect.get(target, key, receiver);
    },

    // A trap for the in operator. key in obj
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },

    // for in 操作会调用 ownKeys
    // 当给对象添加新的属性的时候也会调用 ownKeys
    // 这里把 ITERATE_KEY 这个symbol对象作为追踪副作用函数的key
    ownKeys(target) {
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },

    set(target, key, newVal, receiver) {
      // 修改一个对象的属性、给一个对象新增属性
      // 都会触发set，因此这里要判断
      const type = Object.prototype.hasOwnProperty.call(target, key)
        ? TriggerType.SET
        : TriggerType.ADD;

      let oldValue = target[key];
      Reflect.set(target, key, newVal, receiver);

      // receiver.raw === target 判断receiver的原始对象是否是target
      // NaN === NaN: false; NaN !== NaN: true
      // (newVal === newVal || oldValue === oldValue) 排除新旧值均为NaN的情况
      if (
        receiver.raw === target &&
        oldValue !== newVal &&
        (newVal === newVal || oldValue === oldValue)
      ) {
        trigger(target, key, type);
      }
      return true;
    },

    deleteProperty(target, key) {
      const hasKey = Object.prototype.hasOwnProperty.call(target, key);
      const isDeleted = Reflect.deleteProperty(target, key);

      if (hasKey && isDeleted) {
        trigger(target, key, "DELETE");
      }
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

function trigger(target, key, type) {
  let depsMap = bucket.get(target);
  if (!depsMap) return;
  //
  let deps = depsMap.get(key);

  let runners = [];
  if (deps) runners.push(...deps);

  // 当对象新增一个属性时，会触发 ownKeys 方法
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    let iterateEffects = depsMap.get(ITERATE_KEY);
    if (iterateEffects) runners.push(...iterateEffects);
  }

  let currEffect = effectStack[effectStack.length - 1];

  runners.forEach((effectFunc) => {
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
  reactive: proxyObject,
};
