test("test Symbol.iterator", () => {
  const obj = {
    value: 0,
    [Symbol.iterator]() {
      return {
        next() {
          return {
            value: obj.value++,
            done: obj.value > 10,
          };
        },
      };
    },
  };

  const ite = obj[Symbol.iterator]();

  for (let i = 0; i < 20; i++) {
    const { value, done } = ite.next();
    if (!done) {
      expect(value).toBe(i);
    } else {
      expect(i).toBe(10);
      break;
    }
  }

  const arr = [0,1,2,3];
  console.log(arr.values().next());

});
