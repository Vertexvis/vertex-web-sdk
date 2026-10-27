import { type Mock, vi } from 'vitest';

const draw = vi.fn();

const createShape = vi.fn(() => draw);

const mockShapeBuilder: Mock = vi.fn(() => ({
  createShape,
}));

export default mockShapeBuilder;
