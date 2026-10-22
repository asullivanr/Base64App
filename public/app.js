import { convert } from './conversion.js';

const byId = id => document.getElementById(id);
const input = byId('input'), output = byId('output'), mode = byId('mode'), variant = byId('variant');
const copy = byId('copy'), error = byId('error'), status = byId('status');
let revision = 0;

function invalidate() {
  revision++;
  output.value = '';
  error.textContent = '';
  status.textContent = '';
  input.removeAttribute('aria-invalid');
  copy.disabled = true;
}
function labels() {
  const encoding = mode.value === 'encode';
  byId('input-label').textContent = encoding ? 'Text to encode' : 'Base64 to decode';
  byId('output-label').textContent = encoding ? 'Base64 output' : 'Decoded text';
  byId('limit').textContent = encoding ? '1 MiB UTF-8 limit' : '2 MiB raw UTF-8 limit';
}
byId('converter').addEventListener('submit', event => {
  event.preventDefault();
  invalidate();
  try {
    output.value = convert(input.value, mode.value, variant.value);
    copy.disabled = output.value.length === 0;
    status.textContent = output.value.length ? 'Conversion complete.' : 'Conversion complete. The result is empty.';
  } catch (cause) {
    error.textContent = cause.message;
    input.setAttribute('aria-invalid', 'true');
  }
});
input.addEventListener('input', invalidate);
mode.addEventListener('change', () => { invalidate(); labels(); });
variant.addEventListener('change', invalidate);
byId('clear').addEventListener('click', () => { input.value = ''; invalidate(); input.focus(); });
copy.addEventListener('click', async () => {
  const current = revision;
  try {
    await navigator.clipboard.writeText(output.value);
    if (current === revision) status.textContent = 'Output copied.';
  } catch {
    if (current === revision) status.textContent = 'Copy failed. Select the output and copy it manually.';
  }
});
function resetPage() {
  input.value = '';
  mode.value = 'encode';
  variant.value = 'standard';
  invalidate();
  labels();
}
// Clear memory before history caching, and clear browser-restored form values.
window.addEventListener('pagehide', resetPage);
window.addEventListener('pageshow', resetPage);
resetPage();
