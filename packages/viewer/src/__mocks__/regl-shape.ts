const draw = jest.fn();

const createShape = jest.fn(() => draw);

export default jest.fn(() => ({
  createShape,
}));
