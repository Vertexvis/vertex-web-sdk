const draw = vi.fn();

const createShape = vi.fn(() => draw);

export default vi.fn(() => ({
  createShape,
}));
