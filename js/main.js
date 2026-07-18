const photos = [
  {src:"images/img-01.jpg", cap:"回眸,把整顆星球收進髮梢之間。", time:"06.29 04:53", pos:"50%"},
  {src:"images/img-04.jpg", cap:"穿上喜歡的衣服,站在無人的月面上。", time:"06.29 05:08", pos:"39%"},
  {src:"images/img-05.jpg", cap:"把心事吹成泡泡,讓星星接住。", time:"06.29 05:10", pos:"21%"},
  {src:"images/img-06.jpg", cap:"氣泡水 × 泡泡水,月球限定的下午茶。", time:"06.29 05:11", pos:"31%"},
  {src:"images/img-07.jpg", cap:"趁泡泡還沒破掉之前,先拍一張。", time:"06.29 05:11", pos:"34%"},
  {src:"images/img-08.jpg", cap:"換上裙子,坐在月球邊緣發呆一下午。", time:"06.29 05:30", pos:"71%"},
  {src:"images/img-09.jpg", cap:"盯著星球發呆,是今天最重要的工作。", time:"06.29 05:32", pos:"79%"},
  {src:"images/img-02.jpg", cap:"瞳孔裡也住著一顆星球。", time:"06.29 05:32", pos:"67%"},
  {src:"images/img-10.jpg", cap:"噓——先讓我裝可愛三秒鐘。", time:"06.29 05:36", pos:"49%"},
  {src:"images/img-11.jpg", cap:"眨眼放電,瞄準鏡都鎖不住。", time:"06.29 05:36", pos:"49%"},
  {src:"images/img-12.jpg", cap:"舉起拍立得,按下快門的瞬間。", time:"06.29 05:39", pos:"75%"},
  {src:"images/img-13.jpg", cap:"等待顯影的時間,最適合發呆。", time:"06.29 05:39", pos:"71%"}
];

const grid = document.getElementById('galleryGrid');
const rotations = [-2.5, 1.8, -1.2, 2.3, -3, 1.4, -1.8, 2.8, -2.2, 1.6, -1.5, 2.1];

photos.forEach((p, i) => {
  const fig = document.createElement('figure');
  fig.className = 'polaroid';
  fig.style.setProperty('--rot', rotations[i % rotations.length] + 'deg');
  fig.style.transitionDelay = (i % 6) * 0.06 + 's';
  fig.innerHTML = `
    <div class="frame">
      <img src="${p.src}" alt="${p.cap}" loading="lazy" style="object-position:${p.pos || '50%'} center;">
      <div class="reticle-corner tl"></div>
      <div class="reticle-corner tr"></div>
      <div class="reticle-corner bl"></div>
      <div class="reticle-corner br"></div>
      <div class="scanline"></div>
    </div>
    <figcaption>
      <div class="cap-text">${p.cap}</div>
      <div class="cap-meta">${p.time}</div>
    </figcaption>`;
  fig.addEventListener('click', () => openLightbox(i));
  grid.appendChild(fig);
});

/* GSAP entrance + scroll reveal */
gsap.registerPlugin(ScrollTrigger);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* device safety limit for the dust-disintegration particle count: small screens and
   low core-count devices (typically weaker mobile hardware) get a much smaller burst */
const isSmallScreen = window.innerWidth < 768;
const isLowCore = (navigator.hardwareConcurrency || 4) <= 4;
const dustParticleLimit = (isSmallScreen || isLowCore) ? 1200 : 10000;

if(reduceMotion){
  gsap.set('.hero-content, .scroll-cue, .reveal', {opacity:1, y:0});
  gsap.set('.title-reveal', {clipPath:'inset(0 0% 0 -4px)'});
  gsap.set('.polaroid', {opacity:1, translate:'0px 0px'});
  document.querySelectorAll('.polaroid').forEach(el => el.classList.add('developed'));
} else {
  /* hero entrance timeline */
  gsap.timeline({delay:.2})
    .fromTo('.hero-content', {opacity:0, y:26}, {opacity:1, y:0, duration:1.1, ease:'power3.out'})
    .fromTo('.hero-content .title-reveal',
      {clipPath:'inset(0 100% 0 -4px)'},
      {clipPath:'inset(0 0% 0 -4px)', duration:.9, ease:'power3.inOut'}, '-=.6')
    .fromTo('.hero-content .tagline', {opacity:0, y:14}, {opacity:1, y:0, duration:.7, ease:'power3.out', onStart:startTypewriter}, '-=.3')
    .fromTo('.scroll-cue', {opacity:0}, {opacity:1, duration:.6}, '-=.2');

  /* about / divider / gallery text reveal on scroll */
  ScrollTrigger.batch('.reveal', {
    start:'top 85%',
    once:true,
    onEnter:(els) => gsap.to(els, {opacity:1, y:0, duration:.7, ease:'power3.out', stagger:.12, overwrite:true})
  });

  /* heading wipe reveal on scroll (excludes the hero title, handled above) */
  const scrollTitles = Array.from(document.querySelectorAll('.title-reveal')).filter(el => !el.closest('.hero-content'));
  ScrollTrigger.batch(scrollTitles, {
    start:'top 85%',
    once:true,
    onEnter:(els) => gsap.to(els, {clipPath:'inset(0 0% 0 -4px)', duration:.9, ease:'power3.inOut', stagger:.15, overwrite:true})
  });

  /* polaroid entrance — animates the standalone `translate` property so the
     CSS transform:rotate(--rot) tilt and hover effect stay untouched */
  ScrollTrigger.batch('.polaroid', {
    start:'top 90%',
    once:true,
    onEnter:(els) => {
      gsap.to(els, {opacity:1, translate:'0px 0px', duration:.7, ease:'power3.out', stagger:{amount:.4, from:'start'}, overwrite:true});
      els.forEach((el, i) => setTimeout(() => el.classList.add('developed'), 350 + i * 120));
    }
  });
}


/* ---------- typewriter (打字機) ---------- */
const TAGLINE_TEXT = "在月球的另一端,把瞄準鏡換成觀景窗——扣下快門的瞬間,是屬於語的座標。歡迎降落,認識一下這個拉拉肥的星空相簿。";
let typingStarted = false;
function startTypewriter(){
  if(typingStarted) return;
  typingStarted = true;
  const target = document.getElementById('typeTarget');
  const tagline = document.getElementById('tagline');
  let i = 0;
  (function tick(){
    target.textContent = TAGLINE_TEXT.slice(0, ++i);
    if(i < TAGLINE_TEXT.length){ setTimeout(tick, 55); }
    else{ tagline.classList.add('done'); }
  })();
}
if(reduceMotion){
  document.getElementById('typeTarget').textContent = TAGLINE_TEXT;
  document.getElementById('tagline').classList.add('done');
}

/* header solid on scroll */
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('solid', window.scrollY > 40);
});

/* lightbox */
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCap = document.getElementById('lbCap');
const lbMeta = document.getElementById('lbMeta');
let current = 0;

let lbTl;
function openLightbox(i){
  current = i;
  updateLightbox();
  lightbox.classList.add('active');
}
function updateLightbox(){
  const p = photos[current];
  lbImg.src = p.src; lbImg.alt = p.cap;
  lbCap.textContent = p.cap; lbMeta.textContent = p.time;
  playLightboxReveal();
}
function playLightboxReveal(){
  if(lbTl) lbTl.kill();
  if(reduceMotion){
    gsap.set([lbCap, lbMeta], {opacity:1, scale:1, y:0});
    gsap.set(lbImg, {opacity:1, scale:1, filter:'none'});
    return;
  }

  gsap.set(lbImg, {opacity:0, scale:.96, filter:'blur(18px) brightness(.45) saturate(.6)'});
  gsap.set([lbCap, lbMeta], {opacity:0, scale:.8, y:0});

  const reveal = () => {
    // lift the caption up so it sits centered over where the photo will appear
    const centerOffset = -(lbImg.getBoundingClientRect().height / 2 + lbCap.getBoundingClientRect().height / 2 + 14);

    lbTl = gsap.timeline()
      .to(lbCap, {opacity:1, scale:1.18, y:centerOffset, duration:.55, ease:'power3.out'})
      .to(lbMeta, {opacity:1, y:centerOffset, duration:.4, ease:'power3.out'}, '-=.3')
      .to(lbImg, {opacity:1, scale:1, filter:'blur(0px) brightness(1) saturate(1)', duration:1, ease:'power2.out'}, '-=.1')
      .to(lbCap, {scale:1, y:0, duration:.6, ease:'power3.inOut'}, '-=.3')
      .to(lbMeta, {y:0, duration:.6, ease:'power3.inOut'}, '<');
  };

  if(lbImg.complete) reveal(); else lbImg.onload = reveal;
}
let closing = false;
function closeLightbox(){
  if(closing || !lightbox.classList.contains('active')) return;
  if(lbTl) lbTl.kill();
  if(reduceMotion){
    lightbox.classList.remove('active');
    return;
  }
  closing = true;
  gsap.to([lbCap, lbMeta], {opacity:0, y:-10, scale:.92, duration:.25, ease:'power2.in'});
  disintegratePhoto(() => { lightbox.classList.remove('active'); closing = false; });
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => { current = (current - 1 + photos.length) % photos.length; updateLightbox(); });
document.getElementById('lbNext').addEventListener('click', () => { current = (current + 1) % photos.length; updateLightbox(); });
lightbox.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
window.addEventListener('keydown', (e) => {
  if(!lightbox.classList.contains('active')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowLeft'){ current = (current - 1 + photos.length) % photos.length; updateLightbox(); }
  if(e.key === 'ArrowRight'){ current = (current + 1) % photos.length; updateLightbox(); }
});
