export const LIMITS = { encode: 1024 * 1024, decode: 2 * 1024 * 1024 };

function checkSize(text, limit) {
  // Count without allocating a byte buffer for oversized input.
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
    if (bytes > limit) throw new Error(`Input exceeds the ${limit / 1024 / 1024} MiB UTF-8 limit. Shorten the input and try again.`);
  }
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let start = 0; start < bytes.length; start += 8192) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  }
  return btoa(binary);
}

export function convert(text, mode = 'encode', variant = 'standard') {
  if (!['encode', 'decode'].includes(mode) || !['standard', 'url-safe'].includes(variant)) {
    throw new Error('Choose a valid mode and Base64 variant.');
  }
  checkSize(text, LIMITS[mode]);
  if (mode === 'encode') {
    const encoded = bytesToBase64(new TextEncoder().encode(text));
    return variant === 'url-safe' ? encoded.replace(/\+/g, '-').replace(/\//g, '_') : encoded;
  }
  const clean = text.replace(/[ \t\r\n\f\v]/g, '');
  const wrongVariant = variant === 'standard' ? /[-_]/ : /[+/]/;
  if (wrongVariant.test(clean)) throw new Error(`This input uses characters outside the ${variant} alphabet. Check the variant selector.`);
  const standard = clean.replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(standard) || standard.length % 4 === 1 ||
      (standard.includes('=') && standard.length % 4 !== 0)) {
    throw new Error('Invalid Base64. Check the characters and trailing padding.');
  }
  const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, '=');
  let binary;
  try { binary = atob(padded); } catch {
    throw new Error('Invalid Base64. Check the characters and trailing padding.');
  }
  if (btoa(binary) !== padded) throw new Error('Invalid Base64: unused padding bits must be zero. Check the final characters.');
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); } catch {
    throw new Error('The decoded data is not valid UTF-8 text. Only text conversion is supported.');
  }
}
