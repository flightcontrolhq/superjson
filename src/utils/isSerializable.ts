import is from '@sindresorhus/is';
import { SerializableJSONValue } from '../types';

export const isSerializable = (value: any): value is SerializableJSONValue =>
  is.undefined(value) ||
  is.bigint(value) ||
  is.date(value) ||
  is.set(value) ||
  is.regExp(value);
