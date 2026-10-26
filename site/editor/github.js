/* Editor do site: grava arquivos direto no repositório do GitHub (sem servidor, sem banco de dados).
   O "token" fica só neste navegador (localStorage). */
(function () {
  var CFG = { dono: 'LeonardoPinheir', repo: 'siteobservatorio', ramo: 'main', raiz: 'site/' };
  var CH = 'obs-gh-token', base = '/repos/' + CFG.dono + '/' + CFG.repo;
  function token() { try { return localStorage.getItem(CH) || ''; } catch (e) { return ''; } }
  function guardar(t) { try { if (t) localStorage.setItem(CH, t); else localStorage.removeItem(CH); } catch (e) {} }

  function api(caminho, o) {
    o = o || {};
    var h = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (token()) h.Authorization = 'Bearer ' + token();
    if (o.corpo) h['Content-Type'] = 'application/json';
    return fetch('https://api.github.com' + caminho, { method: o.metodo || 'GET', headers: h, body: o.corpo ? JSON.stringify(o.corpo) : undefined, cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.message || ('Erro ' + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function b64(bytes) { var s = '', i; for (i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function deB64(c) { var bin = atob(String(c).replace(/\s/g, '')), by = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) by[i] = bin.charCodeAt(i); return by; }

  // Lê um arquivo de texto do repositório (caminho relativo à pasta site/). Devolve { texto, sha }.
  function lerArquivo(caminho) {
    return api(base + '/contents/' + CFG.raiz + caminho + '?ref=' + CFG.ramo).then(function (j) {
      if (j.content) return { texto: new TextDecoder().decode(deB64(j.content)), sha: j.sha };
      return api(base + '/git/blobs/' + j.sha).then(function (b) { return { texto: new TextDecoder().decode(deB64(b.content)), sha: j.sha }; });
    });
  }
  // Grava vários arquivos em UM commit (uma única publicação na Vercel).
  // arquivos: [{ caminho, texto } ou { caminho, bytes }]
  function publicar(arquivos, mensagem) {
    var ref = base + '/git/ref/heads/' + CFG.ramo, topo, arvoreBase;
    return api(ref).then(function (r) { topo = r.object.sha; return api(base + '/git/commits/' + topo); })
      .then(function (c) {
        arvoreBase = c.tree.sha;
        return Promise.all(arquivos.map(function (a) {
          var bytes = a.bytes || new TextEncoder().encode(a.texto);
          return api(base + '/git/blobs', { metodo: 'POST', corpo: { content: b64(bytes), encoding: 'base64' } }).then(function (b) { return { path: CFG.raiz + a.caminho, mode: '100644', type: 'blob', sha: b.sha }; });
        }));
      })
      .then(function (itens) { return api(base + '/git/trees', { metodo: 'POST', corpo: { base_tree: arvoreBase, tree: itens } }); })
      .then(function (t) { return api(base + '/git/commits', { metodo: 'POST', corpo: { message: mensagem, tree: t.sha, parents: [topo] } }); })
      .then(function (c) { return api(base + '/git/refs/heads/' + CFG.ramo, { metodo: 'PATCH', corpo: { sha: c.sha } }); });
  }
  function traduzir(e) {
    if (e && e.status === 401) return 'O token é inválido ou expirou. Clique em "GitHub" e conecte de novo.';
    if (e && (e.status === 403 || e.status === 404)) return 'O token não tem permissão neste repositório. Confira se ele tem acesso ao repositório "' + CFG.repo + '" com permissão Contents: Read and write.';
    if (e && e.status === 422) return 'O GitHub recusou a gravação (alguém publicou ao mesmo tempo?). Tente publicar de novo.';
    return (e && e.message) || 'Não foi possível falar com o GitHub. Veja a conexão com a internet.';
  }

  /* ---------- janela de conexão ---------- */
  var dlg;
  function montarJanela() {
    if (dlg) return dlg;
    var st = document.createElement('style');
    st.textContent = '.gh-fundo{position:fixed;inset:0;background:rgba(8,44,71,.6);display:grid;place-items:center;z-index:80;padding:16px}.gh-fundo[hidden]{display:none}.gh-caixa{background:#fffdf8;color:#10304a;border-radius:14px;max-width:560px;width:100%;max-height:92vh;overflow:auto;padding:24px;box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}.gh-caixa h2{margin:0 0 8px;font:600 1.2rem Georgia,serif}.gh-caixa ol{padding-left:20px;margin:10px 0}.gh-caixa li{margin-bottom:6px}.gh-caixa input{width:100%;font:inherit;padding:10px;border:2px solid #dccfae;border-radius:8px;margin:6px 0}.gh-caixa .gh-linha{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.gh-msg{min-height:1.3em;font-weight:700;margin:6px 0 0}.gh-msg.erro{color:#b3261e}.gh-msg.ok{color:#0e8c82}.gh-aviso{background:#fff3cf;border-left:5px solid #fdb833;padding:8px 12px;border-radius:6px;font-size:.88rem;margin-top:12px}';
    document.head.appendChild(st);
    dlg = document.createElement('div'); dlg.className = 'gh-fundo'; dlg.hidden = true;
    dlg.innerHTML = '<div class="gh-caixa" role="dialog" aria-modal="true" aria-labelledby="gh-t"><h2 id="gh-t">Conectar ao GitHub</h2>' +
      '<p id="gh-estado" style="margin:0 0 6px"></p>' +
      '<p style="margin:0">Para publicar direto no site, crie uma chave de acesso (token) uma única vez:</p>' +
      '<ol><li>Abra <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> (entre com a conta que é dona do repositório).</li>' +
      '<li><b>Token name:</b> Editor do site. <b>Expiration:</b> o maior prazo possível.</li>' +
      '<li><b>Repository access:</b> "Only select repositories" e escolha <b>' + CFG.repo + '</b>.</li>' +
      '<li><b>Repository permissions</b> → <b>Contents: Read and write</b>.</li>' +
      '<li>Clique em <b>Generate token</b>, copie e cole abaixo.</li></ol>' +
      '<label for="gh-token" style="font-weight:700;font-size:.85rem">Token</label><input id="gh-token" type="password" autocomplete="off" placeholder="github_pat_...">' +
      '<p class="gh-msg" id="gh-msg" role="status"></p>' +
      '<div class="gh-linha"><button type="button" id="gh-salvar" style="font:700 .9rem inherit;padding:9px 14px;border-radius:8px;border:2px solid #10304a;background:#10304a;color:#fff;cursor:pointer">Conectar</button>' +
      '<button type="button" id="gh-sair" style="font:700 .9rem inherit;padding:9px 14px;border-radius:8px;border:2px solid #b3261e;background:transparent;color:#b3261e;cursor:pointer" hidden>Desconectar</button>' +
      '<button type="button" id="gh-fechar" style="font:700 .9rem inherit;padding:9px 14px;border-radius:8px;border:2px solid #10304a;background:transparent;color:#10304a;cursor:pointer">Fechar</button></div>' +
      '<p class="gh-aviso">O token fica guardado só neste navegador. Quem tiver o token consegue alterar o site: não compartilhe e, em computador de uso comum, clique em Desconectar ao terminar.</p></div>';
    document.body.appendChild(dlg);
    var $ = function (id) { return dlg.querySelector('#' + id); };
    dlg.addEventListener('click', function (e) { if (e.target === dlg) fechar(); });
    $('gh-fechar').addEventListener('click', fechar);
    $('gh-sair').addEventListener('click', function () { guardar(''); atualizar(); aviso(); $('gh-msg').textContent = 'Desconectado.'; $('gh-msg').className = 'gh-msg ok'; });
    $('gh-salvar').addEventListener('click', function () {
      var t = $('gh-token').value.trim(), m = $('gh-msg'); if (!t) { m.textContent = 'Cole o token.'; m.className = 'gh-msg erro'; return; }
      m.textContent = 'Conferindo…'; m.className = 'gh-msg'; var antigo = token(); guardar(t);
      api(base).then(function (r) {
        if (r.permissions && r.permissions.push === false) throw Object.assign(new Error('Esse token só consegue ler o repositório. Ele precisa de Contents: Read and write.'), { status: 0 });
        return api('/user').catch(function () { return { login: '' }; });
      }).then(function (u) { m.textContent = 'Conectado' + (u.login ? ' como ' + u.login : '') + '.'; m.className = 'gh-msg ok'; $('gh-token').value = ''; atualizar(); aviso(); setTimeout(fechar, 900); })
        .catch(function (e) { guardar(antigo); m.textContent = traduzir(e); m.className = 'gh-msg erro'; });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) fechar(); });
    return dlg;
  }
  function atualizar() {
    if (!dlg) return; var on = !!token();
    dlg.querySelector('#gh-estado').innerHTML = on ? '<b style="color:#0e8c82">Conectado.</b> Você pode publicar direto no site.' : '<b>Não conectado.</b>';
    dlg.querySelector('#gh-sair').hidden = !on;
  }
  function aviso() { document.querySelectorAll('[data-gh-chip]').forEach(function (c) { c.textContent = token() ? 'GitHub: conectado' : 'GitHub'; }); }
  function conectar() { montarJanela(); atualizar(); dlg.hidden = false; dlg.querySelector('#gh-token').focus(); }
  function fechar() { if (dlg) dlg.hidden = true; }

  window.GH = { token: token, conectar: conectar, lerArquivo: lerArquivo, publicar: publicar, traduzir: traduzir, atualizarChip: aviso };
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-gh-chip]').forEach(function (c) { c.addEventListener('click', conectar); });
    aviso();
  });
})();
