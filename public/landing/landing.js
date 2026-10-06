(function(){

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const goReady = () => requestAnimationFrame(() => document.body.classList.add('ready'));
if (document.readyState === 'complete') goReady(); else addEventListener('load', goReady);
addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 20), { passive: true });

// the three hero phones play real app screens
const S = (src, hold) => ({ src, hold: hold || 3600 });
const TL = (src) => ({ src, tall: true, nav: true });
Phone.mount($('#hA'), [TL('/landing/screens/my-team-tall.png'), S('/landing/screens/chips.png')], { pips: false });
setTimeout(() => Phone.mount($('#hB'), [TL('/landing/screens/match-tall.png'), S('/landing/screens/lineup.png')], { pips: false }), 700);
setTimeout(() => Phone.mount($('#hC'), [TL('/landing/screens/league-tall.png'), S('/landing/screens/standings.png')], { pips: false }), 1400);

// glass reflection + a little tilt that follow the pointer
if (!reduce) {
  $$('.iph').forEach((d) => {
    const base = d.classList.contains('l') ? 7 : d.classList.contains('r') ? -7 : 0;
    d.style.setProperty('--ry', base + 'deg');
    const host = d.closest('#trio, .sticky') || d;
    host.addEventListener('pointermove', (e) => {
      const r = d.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      d.style.setProperty('--gx', (x * 100) + '%'); d.style.setProperty('--gy', (y * 100) + '%');
      d.style.setProperty('--ry', (base + (x - .5) * 10) + 'deg'); d.style.setProperty('--rx', ((.5 - y) * 6) + 'deg');
    });
    host.addEventListener('pointerleave', () => { d.style.setProperty('--ry', base + 'deg'); d.style.setProperty('--rx', '0deg'); });
  });
} else { $$('.iph').forEach((d) => d.style.setProperty('--ry', '0deg')); }

// belt
const evs = [["12'", 'Goal', 'Eze', '+4'], ["34'", 'Penalty saved', 'Musa', '+5'], ["51'", 'Yellow card', 'Duru', '−1'], ["68'", 'Clean sheet', 'Okon', '+4'], ["75'", 'Assist', 'Bello', '+3'], ["90'", 'Man of the Match', 'Eze', '+3']];
const tk = evs.map((e) => `<div class="tk"><span class="m">${e[0]}</span><b>${e[1]}</b><span>${e[2]}</span><i class="${e[3].startsWith('−') ? 'neg' : ''}">${e[3]}</i></div>`).join('');
$('#track').innerHTML = tk + tk + tk + tk;

// story: the phone stays fixed and plays a tour of the real app for each step
const Tp = '/landing/screens/tour/';
const frames = {
  home: { src: Tp + 's1-home.png' }, team: { src: Tp + 's1-teamfull-T.png', tall: true, h: 1155, nav: true }, player: { src: Tp + 's1-player.png' },
  capToast: { src: Tp + 's1-captain-toast.png' }, teamC: { src: Tp + 's1-captain-team-T.png', tall: true, h: 1155, nav: true },
  chips: { src: Tp + 's2-chips.png' }, tc: { src: Tp + 's2-tcdetail.png' }, active: { src: Tp + 's2-active.png' }, banner: { src: Tp + 's2-banner.png' },
  fixtures: { src: Tp + 's3-fixtures.png' }, match: { src: Tp + 's3-match-T.png', tall: true, h: 1222, nav: true },
  homeTall: { src: '/landing/screens/fantasy-home-tall.png', tall: true, h: 3196, nav: true }, league: { src: Tp + 's4-league.png' },
};
const tour = Tour.mount($('#storySc'), { frames, steps: [
  [{ show: 'home' }, { wait: 900 }, { tap: [103, 113] }, { go: 'team', how: 'slide' }, { wait: 700 }, { reveal: [56, 754], ms: 1700 }, { wait: 300 }, { tap: [56, 754] }, { go: 'player', how: 'up' }, { wait: 2600 }],
  [{ show: 'teamC' }, { reveal: [56, 754], ms: 1200 }, { wait: 300 }, { tap: [56, 754] }, { go: 'player', how: 'up' }, { wait: 900 }, { tap: [81, 817] }, { go: 'capToast', how: 'fade', ms: 250 }, { wait: 1300 },
   { go: 'teamC', how: 'fade' }, { reveal: [313, 1103], ms: 1500 }, { wait: 300 }, { tap: [313, 1103] }, { go: 'chips', how: 'up' }, { wait: 800 }, { tap: [195, 739] }, { go: 'tc', how: 'slide' }, { wait: 900 },
   { tap: [195, 784] }, { go: 'active', how: 'fade', ms: 250 }, { wait: 1300 }, { tap: [348, 148] }, { go: 'banner', how: 'fade' }, { wait: 2200 }],
  [{ show: 'home' }, { wait: 900 }, { tap: [179, 113] }, { go: 'fixtures', how: 'slide' }, { wait: 900 }, { tap: [195, 306] }, { go: 'match', how: 'slide' }, { wait: 900 }, { scroll: 9999, ms: 5200 }, { wait: 600 }],
  [{ show: 'homeTall' }, { wait: 800 }, { scroll: 2150, ms: 3600 }, { wait: 900 }, { tap: [242, 813] }, { go: 'league', how: 'slide' }, { wait: 2600 }],
] });
const steps = $$('.step'), rail = $('#rail');
function setStep(i) {
  steps.forEach((s) => s.classList.toggle('on', +s.dataset.i === i));
  const last = steps[i], host = $('#steps');
  rail.style.height = (last.offsetTop + last.offsetHeight / 2 - rail.offsetTop) + 'px';
  tour.play(i);
}
const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setStep(+e.target.dataset.i); }), { rootMargin: '-45% 0px -45% 0px' });
steps.forEach((s) => so.observe(s));

// spotlight on step panels and chip cards
$$('.chipc').forEach((c) => c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--x', (e.clientX - r.left) + 'px'); c.style.setProperty('--y', (e.clientY - r.top) + 'px'); }));

// the main button leans toward the pointer
const mag = $('#mag');
if (!reduce) { mag.addEventListener('pointermove', (e) => { const r = mag.getBoundingClientRect(); mag.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .14}px,${(e.clientY - r.top - r.height / 2) * .22}px)`; }); mag.addEventListener('pointerleave', () => mag.style.transform = ''); }

// organisers
new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } }), { threshold: .3 }).observe($('#ck'));
const ol = $('#orgLog'); let oi = 0;
const oev = [["12'", 'Goal', 'Eze', '+4'], ["21'", 'Save', 'Musa', ''], ["34'", 'Penalty saved', 'Musa', '+5'], ["51'", 'Yellow card', 'Duru', '−1'], ["68'", 'Clean sheet', 'Okon', '+4'], ["90'", 'Man of the Match', 'Eze', '+3']];
function addO() { const e = oev[oi++ % oev.length]; const d = document.createElement('div'); d.className = 'ev'; d.innerHTML = `<b>${e[0]}</b><span>${e[1]}, ${e[2]}</span><i class="${e[3].startsWith('−') ? 'neg' : ''}">${e[3]}</i>`; ol.prepend(d); while (ol.children.length > 5) ol.lastChild.remove(); }
for (let i = 0; i < 4; i++) addO(); if (!reduce) setInterval(addO, 2400);

// scoring scoreboard
const data = {
  GK: [['Goal', '10'], ['Clean sheet', '4'], ['Penalty saved', '5'], ['Every 3 saves', '1']],
  DEF: [['Goal', '6'], ['Clean sheet', '4'], ['Assist', '3'], ['Every 2 goals conceded', '−1']],
  MID: [['Goal', '5'], ['Assist', '3'], ['Clean sheet', '1'], ['Yellow card', '−1']],
  FWD: [['Goal', '4'], ['Assist', '3'], ['Man of the Match', '3'], ['Penalty missed', '−2']],
};
const board = $('#board');
function draw(k) {
  board.innerHTML = data[k].map((r) => `<div class="cell"><div class="v ${r[1].startsWith('−') ? 'neg' : ''}" data-to="${r[1]}">${r[1]}</div><small>${r[0]}</small></div>`).join('');
  if (reduce) return;
  $$('.v', board).forEach((el) => { // numbers tick up from zero, like a scoreboard
    const raw = el.dataset.to, neg = raw.startsWith('−'), n = parseInt(raw.replace('−', ''), 10), t0 = performance.now();
    (function f(t) { const k2 = Math.min(1, (t - t0) / 520), v = Math.round(n * (1 - Math.pow(1 - k2, 3))); el.textContent = (neg ? '−' : '') + v; if (k2 < 1) requestAnimationFrame(f); })(t0);
    setTimeout(() => { el.textContent = raw; }, 600);
  });
}
const tabs = $('#tabs'), ind = $('#ind');
function moveInd(b) { ind.style.width = b.offsetWidth + 'px'; ind.style.transform = `translateX(${b.offsetLeft - 4}px)`; }
$$('button', tabs).forEach((b) => b.addEventListener('click', () => { $$('button', tabs).forEach((x) => x.classList.remove('on')); b.classList.add('on'); moveInd(b); draw(b.dataset.p); }));
board.innerHTML = ''; draw('GK'); addEventListener('load', () => moveInd($('button.on', tabs))); moveInd($('button.on', tabs));

// premium text motion
(function(){
  const split=(el)=>{let n=0;el.innerHTML=el.textContent.trim().split(/\s+/).map(w=>'<span class="w"><span style="--i:'+(n++)+'">'+w+'</span></span>').join(' ');el.setAttribute('aria-label',el.textContent)};
  $$('.chips h2,.org h2,.scoring h2,.close h2,.step h3').forEach(split);
  $$('.sub,.hint,.close p,.tabs,.close .cta,.board').forEach((e,i)=>e.classList.add('fx'));
  $$('.step .eb,.step p').forEach(e=>e.classList.add('fx'));
  const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('go');io.unobserve(e.target)}}),{threshold:.2,rootMargin:'0px 0px -8% 0px'});
  $$('.chips .wrap,.org .wrap,.scoring .wrap,.close .wrap').forEach(e=>io.observe(e));
  const seen=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('seen')}),{rootMargin:'0px 0px -22% 0px'});
  $$('.step').forEach(e=>seen.observe(e));
  $$('.step.on').forEach(e=>e.classList.add('seen'));
  })();

})();
