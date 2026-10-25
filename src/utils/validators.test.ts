import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidOrcid, formatOrcidUrl, isValidDoi, formatDoiUrl, isValidIsbn, extractZenodoId } from './validators.ts';

test('isValidOrcid validates correct ORCID formats', () => {
  assert.equal(isValidOrcid('0000-0002-1825-0097'), true);
  assert.equal(isValidOrcid('https://orcid.org/0000-0002-1825-0097'), true);
  assert.equal(isValidOrcid('0000-0001-5109-3700'), true);
  assert.equal(isValidOrcid('0000-0002-1694-233X'), true);
  // Invalid cases
  assert.equal(isValidOrcid('12345'), false);
  assert.equal(isValidOrcid('0000-0002-1825-009'), false);
  assert.equal(isValidOrcid(''), false);
});

test('formatOrcidUrl creates valid URL', () => {
  assert.equal(formatOrcidUrl('0000-0002-1825-0097'), 'https://orcid.org/0000-0002-1825-0097');
  assert.equal(formatOrcidUrl('https://orcid.org/0000-0002-1825-0097'), 'https://orcid.org/0000-0002-1825-0097');
});

test('isValidDoi validates standard DOIs', () => {
  assert.equal(isValidDoi('10.1000/182'), true);
  assert.equal(isValidDoi('https://doi.org/10.1000/182'), true);
  assert.equal(isValidDoi('10.5281/zenodo.1234567'), true);
  assert.equal(isValidDoi('invalid-doi'), false);
  assert.equal(isValidDoi(''), false);
});

test('formatDoiUrl returns canonical doi.org URL', () => {
  assert.equal(formatDoiUrl('10.1000/182'), 'https://doi.org/10.1000/182');
  assert.equal(formatDoiUrl('https://doi.org/10.1000/182'), 'https://doi.org/10.1000/182');
});

test('isValidIsbn validates ISBN-10 and ISBN-13', () => {
  assert.equal(isValidIsbn('978-65-00-12345-6'), true);
  assert.equal(isValidIsbn('9786500123456'), true);
  assert.equal(isValidIsbn('0-306-40615-2'), true);
  assert.equal(isValidIsbn('12345'), false);
});

test('extractZenodoId extracts record ID from various formats', () => {
  assert.equal(extractZenodoId('https://zenodo.org/records/1234567'), '1234567');
  assert.equal(extractZenodoId('https://zenodo.org/record/7654321'), '7654321');
  assert.equal(extractZenodoId('1234567'), '1234567');
  assert.equal(extractZenodoId(''), null);
});
