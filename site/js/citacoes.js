/* Citações: ABNT NBR 6023, APA 7 e BibTeX. Funciona no navegador e no Node (testes). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Citacoes = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var SUFIXOS = ['filho', 'junior', 'júnior', 'neto', 'sobrinho', 'segundo', 'terceiro'];

  function nomes(texto) {
    if (!texto) return [];
    var sep = texto.indexOf(';') >= 0 ? ';' : ',';
    return texto.split(sep).map(function (n) { return n.trim(); }).filter(Boolean);
  }

  function abntNome(nome) {
    var p = nome.trim().split(/\s+/);
    if (p.length === 1) return p[0].toUpperCase();
    var ultimo = p[p.length - 1];
    var sobrenome = ultimo.toUpperCase();
    var prenomes = p.slice(0, -1).join(' ');
    if (p.length > 2 && SUFIXOS.indexOf(ultimo.toLowerCase()) >= 0) {
      sobrenome = (p[p.length - 2] + ' ' + ultimo).toUpperCase();
      prenomes = p.slice(0, -2).join(' ');
    }
    return sobrenome + ', ' + prenomes;
  }

  function apaNome(nome) {
    var p = nome.trim().split(/\s+/);
    if (p.length === 1) return p[0];
    var iniciais = p.slice(0, -1).map(function (x) { return x.charAt(0).toUpperCase() + '.'; }).join(' ');
    return p[p.length - 1] + ', ' + iniciais;
  }

  function limparDoi(doi) {
    return doi ? String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim() : '';
  }

  function autoria(livro) {
    var organizada = !livro.autores && !!livro.organizadores;
    return { organizada: organizada, lista: nomes(organizada ? livro.organizadores : livro.autores) };
  }

  function abnt(livro) {
    var a = autoria(livro);
    var autores = '';
    if (a.lista.length) {
      autores = a.lista.map(abntNome).join('; ');
      autores += a.organizada ? (a.lista.length > 1 ? ' (orgs.).' : ' (org.).') : '.';
    }
    var titulo = livro.subtitulo ? livro.titulo + ': ' + livro.subtitulo + '.' : livro.titulo + '.';
    var numEd = livro.edicao ? String(livro.edicao).replace(/[^0-9]/g, '') || String(livro.edicao) : '';
    var edicao = numEd ? numEd + '. ed.' : '';
    var ano = livro.ano || new Date().getFullYear();
    var imprenta = (livro.cidade || 'Palmas') + ': ' + (livro.editora || 'Observatório Edições') + ', ' + ano + '.';
    var paginas = livro.paginas ? livro.paginas + ' p.' : '';
    var isbn = livro.isbn ? 'ISBN ' + livro.isbn + '.' : '';
    var doi = limparDoi(livro.doi);
    var doiTxt = doi ? 'DOI: https://doi.org/' + doi + '.' : '';
    return [autores, titulo, edicao, imprenta, paginas, isbn, doiTxt].filter(Boolean).join(' ');
  }

  function apa(livro) {
    var a = autoria(livro);
    var autores = '';
    if (a.lista.length === 1) {
      autores = apaNome(a.lista[0]) + (a.organizada ? ' (Org.).' : '');
    } else if (a.lista.length > 1) {
      var f = a.lista.map(apaNome);
      autores = f.slice(0, -1).join(', ') + ', & ' + f[f.length - 1] + (a.organizada ? ' (Orgs.).' : '');
    }
    var ano = '(' + (livro.ano || new Date().getFullYear()) + ').';
    var titulo = livro.subtitulo ? livro.titulo + ': ' + livro.subtitulo : livro.titulo;
    if (livro.edicao) {
      var n = String(livro.edicao).replace(/[^0-9]/g, '') || String(livro.edicao);
      titulo += ' (' + n + '. ed.)';
    }
    titulo += '.';
    var editora = (livro.editora || 'Observatório Edições') + '.';
    var doi = limparDoi(livro.doi);
    var link = doi ? 'https://doi.org/' + doi : (livro.link_acesso || '');
    return [autores, ano, titulo, editora, link].filter(Boolean).join(' ');
  }

  function bibtex(livro) {
    var a = autoria(livro);
    var autores = a.lista.join(' and ');
    var ano = livro.ano || new Date().getFullYear();
    var doi = limparDoi(livro.doi);
    var chave = String(livro.id || 'obra').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'obra';
    var campos = [
      '  title = {' + livro.titulo + (livro.subtitulo ? ': ' + livro.subtitulo : '') + '}',
      '  ' + (a.organizada ? 'editor' : 'author') + ' = {' + autores + '}',
      '  year = {' + ano + '}',
      '  publisher = {' + (livro.editora || 'Observatório Edições') + '}',
      '  address = {' + (livro.cidade || 'Palmas') + '}'
    ];
    if (livro.isbn) campos.push('  isbn = {' + livro.isbn + '}');
    if (doi) campos.push('  doi = {' + doi + '}');
    return '@book{obs_' + chave + ',\n' + campos.join(',\n') + '\n}';
  }

  return { abnt: abnt, apa: apa, bibtex: bibtex, abntNome: abntNome, apaNome: apaNome };
});
