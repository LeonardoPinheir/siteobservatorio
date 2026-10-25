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
    var lista = t.split(/[;]/).map(function (s) { return s.trim(); }).filter(Boolean);
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
    return '<a class="livro" href="/livro?id=' + encodeURIComponent(livro.id) + '">' + capaHtml(livro, i) +
      '<h3>' + esc(livro.titulo) + '</h3>' +
      '<p class="meta">' + esc(autoria(livro)) + '</p>' +
      '<p class="meta">' + esc([livro.area, livro.ano].filter(Boolean).join(' · ')) + '</p></a>';
  }

  function carregar(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' (' + r.status + ')');
      return r.json();
    });
  }

  var NAV = [
    ['/', 'Início'],
    ['/publicacoes', 'Publicações'],
    ['/submissoes', 'Submissões'],
    ['/#contato', 'Contato']
  ];

  function montarLayout(site) {
    var atual = location.pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';
    var itens = NAV.map(function (n) {
      var ativo = n[0] === atual || (n[0] === '/publicacoes' && atual === '/livro');
      return '<a href="' + n[0] + '"' + (ativo ? ' aria-current="page"' : '') + '>' + n[1] + '</a>';
    }).join('');
    var topo = document.getElementById('topo');
    if (topo) {
      topo.className = 'topo';
      topo.innerHTML = '<a class="pular" href="#conteudo">Ir para o conteúdo</a><div class="wrap">' +
        '<a class="marca" href="/" aria-label="Observatório Edições, página inicial"><img src="/img/logo.png" alt="Observatório Edições" width="132" height="75"></a>' +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menu</button>' +
        '<nav class="menu" id="menu" aria-label="Principal">' + itens + '<a class="cta" href="/submissoes#enviar">Enviar uma obra</a></nav></div>';
      var btn = topo.querySelector('.menu-btn'), menu = topo.querySelector('.menu');
      btn.addEventListener('click', function () {
        var aberto = menu.classList.toggle('aberto');
        btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      });
    }
    var rod = document.getElementById('rodape');
    if (rod) {
      rod.className = 'rodape';
      rod.innerHTML = '<div class="wrap"><div><img class="logo-rodape" src="/img/logo-claro.png" alt="Observatório Edições" width="190" height="108">' +
        '<p>' + esc(site.slogan) + '. Livros e coletâneas com revisão por pares, acesso aberto sempre que possível.</p></div>' +
        '<div><h4>Navegue</h4><ul><li><a href="/publicacoes">Catálogo de publicações</a></li><li><a href="/submissoes">Como submeter uma obra</a></li><li><a href="/modelo-submissao.txt" download>Modelo de submissão</a></li></ul></div>' +
        '<div><h4>Contato</h4><ul><li><a href="mailto:' + esc(site.email) + '">' + esc(site.email) + '</a></li>' +
        '<li><a href="tel:' + esc(site.telefone_link) + '">' + esc(site.telefone) + '</a></li><li>' + esc(site.endereco) + '</li></ul></div>' +
        '<div class="fim">© ' + new Date().getFullYear() + ' ' + esc(site.nome) + '. Todos os direitos reservados.</div></div>';
    }
  }

  window.Obs = { esc: esc, capaHtml: capaHtml, cartaoHtml: cartaoHtml, corDe: corDe, claro: claro, autoria: autoria, carregar: carregar };

  // Carrega dados do site e monta cabeçalho e rodapé; as páginas esperam por Obs.pronto.
  window.Obs.pronto = carregar('/data/site.json').then(function (site) {
    window.Obs.site = site;
    montarLayout(site);
    return site;
  });

  window.Obs.livros = function () {
    return carregar('/data/books.json').then(function (d) {
      return (d.livros || []).filter(function (l) { return l && l.id && l.titulo; })
        .sort(function (a, b) { return (b.ano || 0) - (a.ano || 0) || String(a.titulo).localeCompare(String(b.titulo), 'pt'); });
    });
  };

  // E-mail: abre o programa de e-mail da pessoa com a mensagem pronta.
  window.Obs.mailto = function (para, assunto, corpo) {
    return 'mailto:' + para + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
  };
})();
