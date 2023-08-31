const bucket = new WeakMap();
let activeEffect;

const data = { ok: true, text: "hello world" };

function cleanUp(effectFn) {
  // 从每一个副作用函数集合中删除旧的effectFn
  effectFn.deps.forEach((depSet) => depSet.delete(effectFn));
  // 现在没有副作用函数集合收集着effectFn, 因此重置effectFn.deps
  effectFn.deps.length = 0;
}

function effect(fn) {
  const effectFn = () => {
    cleanUp(effectFn);
    activeEffect = effectFn;
    // 通知每个副作用函数集合收集最新的effectFn
    fn();
  };

  // 收集所有包含着effectFn的副作用函数集合，放入一个列表中
  effectFn.deps = [];
  effectFn();
}

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key);
    return target[key];
  },

  set(target, key, newVal) {
    target[key] = newVal;
    trigger(target, key);
    return true;
  },
});

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = bucket.get(target);
  if (!depsMap) bucket.set(target, (depsMap = new Map()));
  let deps = depsMap.get(key);
  if (!deps) depsMap.set(key, (deps = new Set()));
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target, key) {
  let depsMap = bucket.get(target);
  if (!depsMap) return;
  let deps = depsMap.get(key);
  if (!deps) return;
  [...deps].forEach((effectFunc) => effectFunc());
}

effect(() => {
  console.log("effect run", obj.ok);
  document.body.innerHTML = obj.ok ? obj.text : "null";
});

setTimeout(() => {
  obj.ok = false;
}, 1000);

setTimeout(() => {
  obj.text = "sdadw";
}, 2000);
