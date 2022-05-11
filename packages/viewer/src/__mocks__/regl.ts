const frame = jest.fn((callback) => callback());

export default jest.fn(() => ({ frame }));
