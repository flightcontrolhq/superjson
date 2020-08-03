import { Registry } from './registry';
import { Class } from './types';

export const ClassRegistry = new Registry<Class>(c => c.name);
