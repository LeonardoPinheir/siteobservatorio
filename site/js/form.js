/* Formulários por e-mail: montam a mensagem e abrem o programa de e-mail da pessoa. */
(function () {
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = form.querySelector('.ok');
      var faltando = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (c) { return !c.value.trim(); });
      if (faltando.length) {
        faltando[0].focus();
        ok.textContent = 'Preencha os campos obrigatórios (' + faltando.map(function (c) { return form.querySelector('label[for="' + c.id + '"]').textContent.toLowerCase(); }).join(', ') + ').';
        ok.classList.add('mostrar'); return;
      }
      var tipo = form.dataset.form;
      var d = {}; new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
      var corpo, assunto;
      if (tipo === 'submissao') {
        assunto = 'Submissão de capítulo: ' + d.titulo;
        corpo = ['Nome: ' + d.nome, 'E-mail: ' + d.email, 'Instituição: ' + (d.instituicao || '-'), 'Título: ' + d.titulo, 'Tipo: ' + d.tipo, 'Área: ' + (d.area || '-'), '', 'Resumo:', d.resumo, '', '(Anexe o arquivo do capítulo a esta mensagem.)'].join('\n');
      } else {
        assunto = 'Contato pelo site: ' + d.nome;
        corpo = [d.mensagem, '', '—', d.nome, d.email].join('\n');
      }
      Obs.pronto.then(function (s) {
        ok.innerHTML = 'Abrimos seu programa de e-mail. Se nada abriu, escreva para <a href="mailto:' + Obs.esc(s.email) + '">' + Obs.esc(s.email) + '</a>.';
        ok.classList.add('mostrar');
        location.href = Obs.mailto(s.email, assunto, corpo);
      });
    });
  });
})();
