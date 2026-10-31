import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  safeName,
  parsePageRange,
  parsePagesToDelete,
  calculateResize,
  calculatePasswordStrength,
  validateFileSelection
} from './pureLogic.ts';

test('formatBytes formats bytes, KB, and MB accurately', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024), '1.0 KB');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(1048576), '1.00 MB');
  assert.equal(formatBytes(5242880), '5.00 MB');
});

test('safeName creates sanitized file names with clean extensions', () => {
  const result = safeName('My Invoice (2024).pdf', 'pdf');
  assert.match(result, /^My_Invoice_2024_-\d+\.pdf$/);

  const imageResult = safeName('photo special #1.jpeg', 'webp');
  assert.match(imageResult, /^photo_special_1-\d+\.webp$/);
});

test('parsePageRange parses single pages and ranges correctly', () => {
  // Page numbers are 1-indexed in user input, converted to 0-indexed indices
  assert.deepEqual(parsePageRange('1', 5), [0]);
  assert.deepEqual(parsePageRange('1-3', 5), [0, 1, 2]);
  assert.deepEqual(parsePageRange('1, 3, 5', 5), [0, 2, 4]);
  assert.deepEqual(parsePageRange('1-2, 4-5', 5), [0, 1, 3, 4]);
  assert.deepEqual(parsePageRange('3, 1, 2', 5), [0, 1, 2]); // sorted & deduplicated
  assert.deepEqual(parsePageRange('2, 2, 2', 5), [1]); // deduplicated
});

test('parsePageRange throws descriptive error for out-of-bounds or invalid inputs', () => {
  assert.throws(() => parsePageRange('6', 5), /This PDF only has 5 pages/);
  assert.throws(() => parsePageRange('0', 5), /Page numbers start at 1/);
  assert.throws(() => parsePageRange('4-2', 5), /Invalid range: start page/);
  assert.throws(() => parsePageRange('abc', 5), /Invalid range format/);
  assert.throws(() => parsePageRange('', 5), /Please enter at least one page number/);
});

test('parsePagesToDelete correctly computes remaining page indices', () => {
  // Total 5 pages (indices 0, 1, 2, 3, 4). Deleting pages 2 and 4 (indices 1, 3):
  assert.deepEqual(parsePagesToDelete('2, 4', 5), [0, 2, 4]);
  // Deleting range 1-2 from 4 pages -> remaining pages 3 and 4 (indices 2, 3)
  assert.deepEqual(parsePagesToDelete('1-2', 4), [2, 3]);

  // Attempting to delete all pages should throw
  assert.throws(() => parsePagesToDelete('1-3', 3), /Cannot delete all 3 pages/);
});

test('calculateResize handles aspect ratio preservation and freeform sizing', () => {
  // Original 1000x500 (2:1 ratio)
  // Target width 500, keep ratio -> height should be 250
  const r1 = calculateResize(1000, 500, 500, 0, true);
  assert.deepEqual(r1, { width: 500, height: 250 });

  // Target height 100, keep ratio -> width should be 200
  const r2 = calculateResize(1000, 500, 0, 100, true);
  assert.deepEqual(r2, { width: 200, height: 100 });

  // Both width and height specified with keep ratio -> fit within bounds
  const r3 = calculateResize(1000, 500, 400, 400, true);
  assert.deepEqual(r3, { width: 400, height: 200 });

  // Freeform without keep ratio
  const r4 = calculateResize(1000, 500, 300, 300, false);
  assert.deepEqual(r4, { width: 300, height: 300 });
});

test('calculatePasswordStrength evaluates criteria and scores correctly', () => {
  const weak = calculatePasswordStrength('123');
  assert.equal(weak.label, 'Weak');
  assert.equal(weak.score, 1); // only number
  assert.ok(weak.feedback.length > 0);

  const medium = calculatePasswordStrength('Password1');
  assert.ok(medium.score >= 3);
  assert.ok(medium.label === 'Good' || medium.label === 'Strong');

  const strong = calculatePasswordStrength('P@ssw0rdSecure!2026');
  assert.equal(strong.score, 5);
  assert.equal(strong.label, 'Strong');
  assert.equal(strong.feedback.length, 0);
});

test('validateFileSelection checks size limits and file extensions', () => {
  const dummyPdf = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
  const dummyTxt = new File(['hello'], 'test.txt', { type: 'text/plain' });

  const valid = validateFileSelection([dummyPdf], 'merge', 50);
  assert.equal(valid.valid, true);

  const invalid = validateFileSelection([dummyTxt], 'merge', 50);
  assert.equal(invalid.valid, false);
  assert.match(invalid.error || '', /not a valid PDF file/);
});
