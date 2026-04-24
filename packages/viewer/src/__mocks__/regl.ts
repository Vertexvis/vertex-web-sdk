const cancel = jest.fn();
const frame = jest.fn((callback) => {
  callback();
  return { cancel };
});
const destroy = jest.fn();

export default jest.fn(() => ({ frame, destroy }));
