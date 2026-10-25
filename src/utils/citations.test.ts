import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAbntAuthorName,
  formatApaAuthorName,
  generateAbntBookCitation,
  generateApaBookCitation,
  generateAbntChapterCitation,
  generateBibtexBookCitation,
} from './citations.ts';

test('formatAbntAuthorName handles simple and compound names and suffixes', () => {
  assert.equal(formatAbntAuthorName('Leonardo Pinheiro'), 'PINHEIRO, Leonardo');
  assert.equal(formatAbntAuthorName('Maria Silva Santos'), 'SANTOS, Maria Silva');
  assert.equal(formatAbntAuthorName('João Silva Neto'), 'SILVA NETO, João');
});

test('formatApaAuthorName handles initials', () => {
  assert.equal(formatApaAuthorName('Leonardo Pinheiro'), 'Pinheiro, L.');
  assert.equal(formatApaAuthorName('Maria Silva Santos'), 'Santos, M. S.');
});

test('generateAbntBookCitation generates proper NBR 6023 reference', () => {
  const citation = generateAbntBookCitation({
    title: 'Jornalismo Regional e Inovação',
    subtitle: 'Perspectivas Contemporâneas',
    authors: 'Leonardo Pinheiro; Gilson Pires',
    edition: '1',
    publisher: 'Observatório Edições',
    city: 'Palmas',
    year: 2024,
    pages: 240,
    isbn: '978-65-00-12345-6',
    doi: '10.5281/zenodo.1234567',
  });

  assert.ok(citation.includes('PINHEIRO, Leonardo; PIRES, Gilson.'));
  assert.ok(citation.includes('Jornalismo Regional e Inovação: Perspectivas Contemporâneas.'));
  assert.ok(citation.includes('Palmas: Observatório Edições, 2024.'));
  assert.ok(citation.includes('240 p.'));
  assert.ok(citation.includes('ISBN 978-65-00-12345-6.'));
  assert.ok(citation.includes('DOI: https://doi.org/10.5281/zenodo.1234567.'));
});

test('generateApaBookCitation generates proper APA 7th reference', () => {
  const citation = generateApaBookCitation({
    title: 'Jornalismo Regional e Inovação',
    subtitle: 'Perspectivas Contemporâneas',
    authors: 'Leonardo Pinheiro; Gilson Pires',
    publisher: 'Observatório Edições',
    year: 2024,
    doi: '10.5281/zenodo.1234567',
  });

  assert.ok(citation.includes('Pinheiro, L., & Pires, G.'));
  assert.ok(citation.includes('(2024).'));
  assert.ok(citation.includes('Jornalismo Regional e Inovação: Perspectivas Contemporâneas.'));
  assert.ok(citation.includes('Observatório Edições.'));
  assert.ok(citation.includes('https://doi.org/10.5281/zenodo.1234567'));
});

test('generateAbntChapterCitation generates chapter in book citation', () => {
  const citation = generateAbntChapterCitation({
    chapterTitle: 'Metodologias Ativas no Ensino Superior',
    chapterAuthors: 'Maria Silva',
    startPage: 45,
    endPage: 68,
    chapterDoi: '10.5281/zenodo.9999999',
    book: {
      title: 'Práticas Pedagógicas Inovadoras',
      organizers: 'Leonardo Pinheiro',
      city: 'Palmas',
      publisher: 'Observatório Edições',
      year: 2024,
    },
  });

  assert.ok(citation.includes('SILVA, Maria. Metodologias Ativas no Ensino Superior.'));
  assert.ok(citation.includes('In: PINHEIRO, Leonardo (org.).'));
  assert.ok(citation.includes('Práticas Pedagógicas Inovadoras.'));
  assert.ok(citation.includes('p. 45-68.'));
});

test('generateBibtexBookCitation produces valid BibTeX', () => {
  const bibtex = generateBibtexBookCitation({
    title: 'Comunicação e Cidadania',
    authors: 'Leonardo Pinheiro',
    year: 2024,
    publisher: 'Observatório Edições',
    isbn: '978-65-00-00000-0',
  }, 'livro123');

  assert.ok(bibtex.startsWith('@book{observatorio_livro123'));
  assert.ok(bibtex.includes('title = {Comunicação e Cidadania}'));
  assert.ok(bibtex.includes('author = {Leonardo Pinheiro}'));
  assert.ok(bibtex.includes('year = {2024}'));
});
