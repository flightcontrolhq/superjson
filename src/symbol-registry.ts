import { Registry } from './registry';

export const SymbolRegistry = new Registry<Symbol>(s => s.description ?? '');
