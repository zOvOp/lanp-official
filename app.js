// The kit owns navigation, hero copy and the single scroll moment.
// GSAP sequences only the brand letters, with a visible no-JS fallback.
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
function startBrandMotion() {
  if (media.matches || !window.gsap) return;
  const ctx = window.gsap.context(() => {
    const letters = document.querySelectorAll('.hero-wordmark');
    window.gsap.timeline({defaults:{duration:0.75,ease:'power3.out'}})
      .from(letters,{y:28,stagger:0.045,clearProps:'transform'},0.1);
  }, document.querySelector('.hero'));
  media.addEventListener('change', () => ctx.revert(), {once:true});
}
if (document.readyState === 'complete') startBrandMotion();
else window.addEventListener('load', startBrandMotion, {once:true});
const menuButton = document.querySelector('.nav__toggle');
new MutationObserver(() => {
  menuButton.setAttribute('aria-label',menuButton.getAttribute('aria-expanded') === 'true' ? '关闭导航菜单' : '打开导航菜单');
}).observe(menuButton,{attributes:true,attributeFilter:['aria-expanded']});
