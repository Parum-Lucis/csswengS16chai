import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as any;
}

if (typeof global.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as any;
}

export {};

declare global {
  interface FormData {
    entries(): IterableIterator<[string, FormDataEntryValue]>;
  }
}