const { effect, proxyObject } = require("../src/effect");


test("test cleanUp", () => {
  const data = { ok: true, text: "hello world" };

  const obj = proxyObject(data);

  let tmp1;

  const fn = jest.fn(() => {
    tmp1 = obj.ok ? obj.text : "null";
  });

  effect(fn);

  expect(tmp1).toBe("hello world");
  expect(fn).toHaveBeenCalledTimes(1);

  obj.ok = false;

  expect(tmp1).toBe("null");
  expect(fn).toHaveBeenCalledTimes(2);

  obj.text = "modified";

  expect(fn).toHaveBeenCalledTimes(2);

  console.log("test done");
});
