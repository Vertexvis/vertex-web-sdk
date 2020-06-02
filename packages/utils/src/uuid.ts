import { v1 as uuid } from 'uuid';

export type UUID = string;

export const create = (): UUID => uuid();
