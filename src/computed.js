const { effect, track, trigger } = require("../src/effect");

function computed(getter) {
  // 缓存上一次计算的值
  let value;
  // dirty 为true说明需要重新计算
  let dirty = true;

  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      if (!dirty) {
        dirty = true;
        // 利用js的变量提升功能
        // “手动”调用trigger触发计算属性的effect
        trigger(obj, "value");
      }
    },
  });

  let obj = {
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }

      // 当计算属性computed放用另一个副作用函数outerEffect中时，
      // outerEffect和computed内部的effect会形成effect嵌套，计算属性的effect位于内部，
      // 计算属性内部的响应式数据变化无法引起outerEffect执行
      // “手动”调用track追踪
      track(obj, "value");

      return value;
    },
  };
  return obj;
}

module.exports = {
  computed,
};
