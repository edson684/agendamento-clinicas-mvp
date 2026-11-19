export const toHex = (bytes) => [...new Uint8Array(bytes)].map((x) => x.toString(16).padStart(2, '0')).join('');
export const fromHex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
