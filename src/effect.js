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

/**
 *
 * @param {object} data
 * @param {boolean} isShallow default: true
 * @returns a proxy instance that wraps data;
 */
function createReactive(data, isShallow = false, isReadOnly = false) {
  const p = new Proxy(data, {
    // receiver: the proxy instance or an object that inherits from the proxy instance
    // receiver === p, receiver默认是proxy实例
    get(target, key, receiver) {
      // 设置一个raw指针指向receiver的原始对象
      if (key === "raw") {
        return target;
      }

      // 如果一个函数是只读的，那就不能修改，也就没必要追踪副作用函数
      // console.log(receiver === p, receiver === target);   // true false
      // 避免追踪symbol
      if (!isReadOnly && typeof key !== "symbol") {
        track(target, key);
      }

      // receiver === this
      const value = Reflect.get(target, key, receiver);

      if (isShallow) {
        return value;
      }

      // 当value是一个对象，同样应该把value包装为响应式对象
      if (typeof value === "object" && value !== null) {
        return isReadOnly ? readOnly(value) : reactive(value);
      }
      return value;
    },

    // A trap for the in operator. key in obj
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },

    // for in 操作会调用 ownKeys
    // 当给对象添加新的属性的时候也会调用 ownKeys
    // 这里把 ITERATE_KEY 这个symbol对象作为追踪副作用函数的key
    // 如果target是一个数组，那么添加元素或者直接修改数组的length属性都会影响到数组的length属性
    ownKeys(target) {
      track(target, Array.isArray(target) ? "length" : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },

    set(target, key, newVal, receiver) {
      if (isReadOnly) {
        console.warn(`属性 ${key} 是只读的`);
        return true;
      }

      // 修改一个对象的属性、给一个对象新增属性
      // 都会触发set，因此这里要判断
      const type = Array.isArray(target)
        ? Number(key) < target.length
          ? TriggerType.SET
          : TriggerType.ADD
        : Object.prototype.hasOwnProperty.call(target, key)
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
        trigger(target, key, type, newVal);
      }
      return true;
    },

    deleteProperty(target, key) {
      if (isReadOnly) {
        console.warn(`属性 ${key} 是只读的`);
        return true;
      }

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

function reactive(data) {
  return createReactive(data);
}

function shallowReactive(data) {
  return createReactive(data, true);
}

function readOnly(data) {
  return createReactive(data, false, true);
}

function shallowReadOnly(data) {
  return createReactive(data, true, true);
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

function trigger(target, key, type, newVal) {
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

  // 如果数组新增了一个元素（数组长度变长），触发与 length 相关的副作用
  // arr = [0];
  // arr[1] = 1;
  if (type === TriggerType.ADD && Array.isArray(target) && key !== "length") {
    let lengthEffects = depsMap.get("length");
    if (lengthEffects) runners.push(...lengthEffects);
  }

  // 直接修改数组length属性
  // arr = [0, 1, 2, 3];
  // arr.length = 0;
  if (Array.isArray(target) && key === "length") {
    // 需要注意map的forEach写法
    // map.forEach((value, key) => ...)
    depsMap.forEach((set, key) => {
      if (key >= newVal) {
        if (set) runners.push(...set);
      }
    });
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
  createReactive,
  track,
  trigger,
  reactive,
  shallowReactive,
  proxyObject: reactive,
  readOnly,
  shallowReadOnly,
};
