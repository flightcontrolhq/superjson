import { Registry } from './registry';

export type TypedArrayConstructor =
    | Int8ArrayConstructor
    | Uint8ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Int16ArrayConstructor
    | Uint16ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor

export type TypedArray = InstanceType<TypedArrayConstructor>;

export const TypedArrayRegistry = new Registry<TypedArrayConstructor>(a => a.name);

TypedArrayRegistry.register(Int8Array)
TypedArrayRegistry.register(Uint8Array)
TypedArrayRegistry.register(Uint8ClampedArray)
TypedArrayRegistry.register(Int16Array)
TypedArrayRegistry.register(Uint16Array)
TypedArrayRegistry.register(Int32Array)
TypedArrayRegistry.register(Uint32Array)
TypedArrayRegistry.register(Float32Array)
TypedArrayRegistry.register(Float64Array)