/* menu.js — controla o menu hamburguer no mobile */
function toggleMenu() {
  const menu = document.getElementById('navMobile');
  const btn  = document.getElementById('navHamburguer');
  menu.classList.toggle('aberto');
  btn.classList.toggle('aberto');
}

// Fecha o menu ao clicar em qualquer link
document.querySelectorAll('.nav-mobile a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navMobile').classList.remove('aberto');
    document.getElementById('navHamburguer').classList.remove('aberto');
  });
});