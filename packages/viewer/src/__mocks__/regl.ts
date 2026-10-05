const frame = vi.fn((callback) => callback());

export default vi.fn(() => ({ frame }));
