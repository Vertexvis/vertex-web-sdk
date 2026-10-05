import { vi } from 'vitest';

vi.spyOn(console, 'debug').mockImplementation(() => undefined);
