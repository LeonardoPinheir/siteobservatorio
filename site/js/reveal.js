/* Revela seções ao rolar a página (some se o visitante prefere menos movimento). */
(function () {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var alvos = document.querySelectorAll('.secao .wrap > *, .chamada-final .wrap > *');
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }); }, { threshold: .12 });
  alvos.forEach(function (el) { el.classList.add('rev'); io.observe(el); });
})();
