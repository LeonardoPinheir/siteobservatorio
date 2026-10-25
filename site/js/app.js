/* Observatório Edições: código comum a todas as páginas (sem dependências). */
(function () {
  var CORES = ['#0b5a8c', '#0e8c82', '#e0a21b', '#1e90d1', '#10304a', '#b5532d'];

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function claro(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length !== 6) return false;
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150;
  }
  function corDe(livro, i) {
    return /^#[0-9a-f]{6}$/i.test(livro.cor || '') ? livro.cor : CORES[(i || 0) % CORES.length];
  }
  function autoria(livro) {
    var t = livro.autores || livro.organizadores || '';
    var lista = t.split(';').map(function (s) { return s.trim(); }).filter(Boolean);
    if (lista.length === 1 && t.indexOf(';') < 0 && t.split(',').length > 1) lista = t.split(',').map(function (s) { return s.trim(); });
    var txt = lista.join(', ');
    return livro.autores ? txt : (txt ? txt + (lista.length > 1 ? ' (orgs.)' : ' (org.)') : '');
  }
  function capaHtml(livro, i) {
    var cor = corDe(livro, i);
    if (livro.capa) {
      return '<div class="capa"><img src="' + esc(livro.capa) + '" alt="Capa do livro ' + esc(livro.titulo) + '" loading="lazy"></div>';
    }
    return '<div class="capa gerada p' + ((i || 0) % 4) + (claro(cor) ? ' escura' : '') + '" style="--cor:' + cor + '" aria-hidden="true">' +
      '<span class="c-area">' + esc(livro.area || 'Observatório Edições') + '</span>' +
      '<span class="c-titulo">' + esc(livro.titulo) + '</span>' +
      '<span class="c-aut">' + esc(autoria(livro)) + '</span></div>';
  }
  function cartaoHtml(livro, i) {
    return '<a class="livro" href="/livro?id=' + encodeURIComponent(livro.id) + '">' +
      (livro.link_acesso ? '<span class="selo">Acesso aberto</span>' : '') + capaHtml(livro, i) +
      '<div><h3>' + esc(livro.titulo) + '</h3>' +
      '<p class="meta">' + esc(autoria(livro)) + (livro.ano ? ' · ' + esc(livro.ano) : '') + '</p>' +
      (livro.area ? '<p class="meta area">' + esc(livro.area) + '</p>' : '') + '</div></a>';
  }
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  // Data de publicação em ISO (2024-12-03); livros antigos só têm o ano.
  function chaveData(l) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(l.data_publicacao || '')) return l.data_publicacao;
    return (l.ano ? String(l.ano) : '0000') + '-00-00';
  }
  // Número do volume lido do título ("vol. 7", "volume II"); 0 se não houver.
  function volume(l) {
    var m = /\bvol(?:ume|\.)?\s*(\d+|[ivxlc]+)\b/i.exec(l.titulo || '');
    if (!m) return 0;
    if (/^\d+$/.test(m[1])) return parseInt(m[1], 10);
    var v = { i: 1, v: 5, x: 10, l: 50, c: 100 }, t = 0, s = m[1].toLowerCase();
    for (var i = 0; i < s.length; i++) { var a = v[s[i]], b = v[s[i + 1]] || 0; t += a < b ? -a : a; }
    return t;
  }
  // Data de publicação e, na mesma data, o volume. dir = -1 (mais recentes primeiro) ou 1 (mais antigos).
  function comparar(a, b, dir) {
    var x = chaveData(a), y = chaveData(b);
    if (x !== y) return (x < y ? -1 : 1) * dir;
    return (volume(a) - volume(b)) * dir;
  }
  function dataExtenso(l) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(l.data_publicacao || '');
    if (!m) return l.ano ? String(l.ano) : '';
    return parseInt(m[3], 10) + ' de ' + MESES[parseInt(m[2], 10) - 1] + ' de ' + m[1];
  }
  // Texto simples -> HTML: parágrafos separados por linha em branco; linhas com "- " viram lista; links viram links.
  function textoHtml(t) {
    function inline(x) {
      return esc(x).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/([\w.+-]+@[\w-]+\.[\w.-]+[\w-])/g, '<a href="mailto:$1">$1</a>');
    }
    return String(t || '').replace(/\r/g, '').split(/\n{2,}/).map(function (b) {
      var ls = b.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      if (!ls.length) return '';
      var itens = ls.filter(function (x) { return /^[-•]\s+/.test(x); });
      if (itens.length === ls.length) return '<ul>' + ls.map(function (x) { return '<li>' + inline(x.replace(/^[-•]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      if (itens.length) {
        var i0 = ls.findIndex(function (x) { return /^[-•]\s+/.test(x); });
        return '<p>' + ls.slice(0, i0).map(inline).join('<br>') + '</p><ul>' + ls.slice(i0).map(function (x) { return '<li>' + inline(x.replace(/^[-•]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      }
      return '<p>' + ls.map(inline).join('<br>') + '</p>';
    }).join('');
  }
  var ORDEM_SIT = { 'aberta': 0, 'em breve': 1, 'encerrada': 2 };
  function chamadas() {
    return carregar('/data/chamadas.json').then(function (d) {
      var l = (d.chamadas || []).filter(function (c) { return c && c.id && c.titulo; });
      return l.map(function (c, i) { return { c: c, i: i }; }).sort(function (a, b) {
        var x = ORDEM_SIT[String(a.c.situacao || '').toLowerCase()], y = ORDEM_SIT[String(b.c.situacao || '').toLowerCase()];
        return ((x == null ? 3 : x) - (y == null ? 3 : y)) || a.i - b.i;
      }).map(function (o) { return o.c; });
    });
  }
  function cartaoChamadaHtml(c) {
    var sit = String(c.situacao || 'Aberta'), cls = sit.toLowerCase().replace(/\s+/g, '-');
    return '<a class="cc ' + esc(cls) + '" href="/chamada?id=' + encodeURIComponent(c.id) + '">' +
      '<div class="cc-img">' + (c.imagem ? '<img src="' + esc(c.imagem) + '" alt="" loading="lazy">' : '<span class="cc-gen" aria-hidden="true">' + esc(c.titulo) + '</span>') + '<span class="cc-st">' + esc(sit) + '</span></div>' +
      '<div class="cc-corpo"><h3>' + esc(c.titulo) + '</h3>' + (c.resumo ? '<p>' + esc(c.resumo) + '</p>' : '') +
      '<p class="cc-prazo"><strong>Prazo:</strong> ' + esc(c.prazo || 'A definir') + '</p><span class="cc-ler">Ler chamada →</span></div></a>';
  }
  function carregar(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' (' + r.status + ')');
      return r.json();
    });
  }

  var NAV = [['/', 'Início'], ['/publicacoes', 'Publicações'], ['/chamadas', 'Chamadas'], ['/submissoes', 'Submissões'], ['/#contato', 'Contato']];


  var PAGINAS = [['Início', '/', 'home inicio sobre editora'], ['Publicações', '/publicacoes', 'catalogo livros acervo'], ['Chamadas', '/chamadas', 'chamadas abertas editais fluxo continuo'], ['Submissões', '/submissoes', 'enviar capitulo submeter normas modelo'], ['Contato', '/#contato', 'contato email telefone endereco fale']];
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function iniciarBusca(btn) {
    var painel = document.createElement('div');
    painel.className = 'busca-painel'; painel.hidden = true;
    painel.innerHTML = '<div class="busca-caixa" role="dialog" aria-modal="true" aria-label="Buscar no site">' +
      '<div class="busca-campo"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>' +
      '<input type="search" id="busca-q" placeholder="Buscar livro, autor, tema ou página" autocomplete="off" aria-controls="busca-res" aria-label="Buscar"><button type="button" class="busca-x" aria-label="Fechar">Esc</button></div>' +
      '<div class="busca-res" id="busca-res" role="listbox" aria-live="polite"></div></div>';
    document.body.appendChild(painel);
    var inp = painel.querySelector('input'), res = painel.querySelector('.busca-res'), livros = null, cham = [], sel = -1, itens = [];

    function carregarLivros() {
      if (livros) return Promise.resolve(livros);
      return Promise.all([window.Obs.livros(), window.Obs.chamadas().catch(function () { return []; })]).then(function (r) {
        var l = r[0]; cham = r[1].map(function (c) { return { c: c, t: norm([c.titulo, c.resumo, c.texto].join(' ')) }; });
        livros = l.map(function (x) { return { l: x, t: norm([x.titulo, x.autores, x.organizadores, x.area, x.colecao, (x.palavras_chave || []).join(' ')].join(' ')) }; });
        return livros;
      }).catch(function () { livros = []; return livros; });
    }
    function marcar(i) {
      sel = i; itens.forEach(function (a, k) { a.classList.toggle('sel', k === i); a.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      if (itens[i]) itens[i].scrollIntoView({ block: 'nearest' });
    }
    function desenhar(q) {
      var termos = norm(q).split(/\s+/).filter(Boolean), h = '';
      if (!termos.length) { res.innerHTML = '<p class="busca-dica">Digite um título, nome de autor, tema ou palavra-chave. Atalhos: <kbd>/</kbd> abre a busca, <kbd>Esc</kbd> fecha.</p>'; itens = []; sel = -1; return; }
      var pags = PAGINAS.filter(function (p) { var t = norm(p[0] + ' ' + p[2]); return termos.every(function (x) { return t.indexOf(x) >= 0; }); });
      carregarLivros().then(function (base) {
        if (inp.value !== q) return;
        var achados = base.filter(function (b) { return termos.every(function (x) { return b.t.indexOf(x) >= 0; }); });
        var tn = norm(q);
        achados.sort(function (a, b) { return (norm(b.l.titulo).indexOf(tn) >= 0) - (norm(a.l.titulo).indexOf(tn) >= 0) || comparar(a.l, b.l, -1); });
        var chs = cham.filter(function (b) { return termos.every(function (x) { return b.t.indexOf(x) >= 0; }); }).slice(0, 4);
        var mostra = achados.slice(0, 8);
        if (chs.length) h += '<h4>Chamadas</h4>' + chs.map(function (b) { return '<a role="option" class="busca-item pag" href="/chamada?id=' + encodeURIComponent(b.c.id) + '"><span class="busca-mini">📣</span><span><b>' + esc(b.c.titulo) + '</b><small>' + esc(b.c.situacao || '') + (b.c.prazo ? ' · ' + esc(b.c.prazo) : '') + '</small></span></a>'; }).join('');
        if (pags.length) h += '<h4>Páginas</h4>' + pags.map(function (p) { return '<a role="option" class="busca-item pag" href="' + p[1] + '"><span class="busca-mini">→</span><span><b>' + esc(p[0]) + '</b></span></a>'; }).join('');
        if (mostra.length) {
          h += '<h4>Livros (' + achados.length + ')</h4>' + mostra.map(function (b) {
            var l = b.l;
            return '<a role="option" class="busca-item" href="/livro?id=' + encodeURIComponent(l.id) + '">' +
              (l.capa ? '<img src="' + esc(l.capa) + '" alt="" loading="lazy">' : '<span class="busca-mini">📖</span>') +
              '<span><b>' + esc(l.titulo) + '</b><small>' + esc(autoria(l)) + (l.ano ? ' · ' + esc(l.ano) : '') + '</small></span></a>';
          }).join('');
          if (achados.length > mostra.length) h += '<a role="option" class="busca-item mais" href="/publicacoes?q=' + encodeURIComponent(q) + '">Ver todos os ' + achados.length + ' resultados em Publicações →</a>';
        }
        if (!h) h = '<p class="busca-dica">Nada encontrado para “' + esc(q) + '”. Tente outra palavra ou veja o <a href="/publicacoes">catálogo completo</a>.</p>';
        res.innerHTML = h; itens = Array.prototype.slice.call(res.querySelectorAll('a.busca-item')); sel = -1;
        if (itens.length) marcar(0);
      });
    }
    function abrir() {
      painel.hidden = false; document.documentElement.classList.add('busca-aberta'); btn.setAttribute('aria-expanded', 'true');
      inp.value = ''; desenhar(''); inp.focus(); carregarLivros();
    }
    function fechar() { painel.hidden = true; document.documentElement.classList.remove('busca-aberta'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    btn.addEventListener('click', abrir);
    painel.addEventListener('click', function (e) { if (e.target === painel || e.target.closest('.busca-x')) fechar(); });
    inp.addEventListener('input', function () { desenhar(inp.value.trim()); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && itens.length) { e.preventDefault(); marcar((sel + 1) % itens.length); }
      else if (e.key === 'ArrowUp' && itens.length) { e.preventDefault(); marcar((sel - 1 + itens.length) % itens.length); }
      else if (e.key === 'Enter') { e.preventDefault(); if (itens[sel]) location.href = itens[sel].getAttribute('href'); else if (inp.value.trim()) location.href = '/publicacoes?q=' + encodeURIComponent(inp.value.trim()); }
    });
    document.addEventListener('keydown', function (e) {
      var alvo = e.target, digitando = alvo && (/^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable);
      if (!painel.hidden && e.key === 'Escape') { e.preventDefault(); fechar(); }
      else if (painel.hidden && ((e.key === '/' && !digitando) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'))) { e.preventDefault(); abrir(); }
    });
  }

  function montarLayout(site) {
    var atual = location.pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';
    var itens = NAV.map(function (n) {
      var ativo = n[0] === atual || (n[0] === '/publicacoes' && atual === '/livro') || (n[0] === '/chamadas' && atual === '/chamada');
      return '<a href="' + n[0] + '"' + (ativo ? ' aria-current="page"' : '') + '>' + n[1] + '</a>';
    }).join('');
    var topo = document.getElementById('topo');
    if (topo) {
      topo.className = 'topo';
      topo.innerHTML = '<a class="pular" href="#conteudo">Ir para o conteúdo</a><div class="wrap">' +
        '<a class="marca" href="/" aria-label="Observatório Edições, página inicial"><img src="/img/logo.png" alt="Observatório Edições" width="132" height="75"></a>' +
        '<button class="busca-btn" type="button" aria-label="Buscar no site" aria-haspopup="dialog"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><span>Buscar</span></button>' +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menu</button>' +
        '<nav class="menu" id="menu" aria-label="Principal">' + itens + '<a class="cta" href="/submissoes#enviar">Enviar capítulo</a></nav></div>';
      var btn = topo.querySelector('.menu-btn'), menu = topo.querySelector('.menu');
      btn.addEventListener('click', function () {
        var aberto = menu.classList.toggle('aberto');
        btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      });
      iniciarBusca(topo.querySelector('.busca-btn'));
      var onScroll = function () { topo.classList.toggle('rolou', window.scrollY > 24); };
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    }
    var rod = document.getElementById('rodape');
    if (rod) {
      rod.className = 'rodape';
      rod.innerHTML = '<div class="wrap"><div><img class="logo-rodape" src="/img/logo-claro.png" alt="Observatório Edições" width="190" height="108">' +
        '<p>' + esc(site.slogan) + '. Livros e coletâneas com revisão por pares, acesso aberto sempre que possível.</p></div>' +
        '<div><h4>Navegue</h4><ul><li><a href="/publicacoes">Catálogo de publicações</a></li><li><a href="/chamadas">Chamadas abertas</a></li><li><a href="/submissoes">Enviar um capítulo</a></li><li><a href="/modelo-submissao.docx" download>Modelo de submissão</a></li></ul></div>' +
        '<div><h4>Contato</h4><ul><li><a href="mailto:' + esc(site.email) + '">' + esc(site.email) + '</a></li>' +
        '<li><a href="tel:' + esc(site.telefone_link) + '">' + esc(site.telefone) + '</a></li><li>' + esc(site.endereco) + '</li></ul></div>' +
        '<div class="fim">© ' + new Date().getFullYear() + ' ' + esc(site.nome) + '. Todos os direitos reservados.</div></div>';
    }
  }

  window.Obs = { textoHtml: textoHtml, chamadas: chamadas, cartaoChamadaHtml: cartaoChamadaHtml, chaveData: chaveData, volume: volume, comparar: comparar, dataExtenso: dataExtenso, esc: esc, capaHtml: capaHtml, cartaoHtml: cartaoHtml, corDe: corDe, claro: claro, autoria: autoria, carregar: carregar };
  window.Obs.pronto = carregar('/data/site.json').then(function (site) {
    window.Obs.site = site; montarLayout(site); return site;
  });
  // A ordem do arquivo books.json é a ordem escolhida pela editora.
  window.Obs.livros = function () {
    return carregar('/data/books.json').then(function (d) {
      return (d.livros || []).filter(function (l) { return l && l.id && l.titulo; });
    });
  };
  window.Obs.mailto = function (para, assunto, corpo) {
    return 'mailto:' + para + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
  };
})();
