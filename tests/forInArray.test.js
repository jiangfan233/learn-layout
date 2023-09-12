const { reactive, effect } = require("../src/effect")

test("test for in array", () => {
  const data = [0];

  const p = reactive(data);

  const fn = jest.fn(() => {
    for(let key in p) {
      console.log(key)
    }
  });

  effect(fn);

  expect(fn).toHaveBeenCalledTimes(1);

  p[100] = 100;

  expect(fn).toHaveBeenCalledTimes(2);

  p.length = 0;

  expect(fn).toHaveBeenCalledTimes(3);  


})