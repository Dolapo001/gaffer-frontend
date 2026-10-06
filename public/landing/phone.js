/* Phone.mount(el, screens, opts) puts real app screenshots in a phone and animates them.
 *   screens: [{ src, tall, nav, hold, scroll }]
 *     tall   = a full-length capture that should scroll inside the phone (nav image is overlaid)
 *     nav    = overlay the real bottom navigation (needed for tall captures, which have none)
 *     hold   = ms to rest before and after the scroll (default 1100)
 *     scroll = ms the scroll takes (default 5200)
 *   opts: { auto: true (cycle through screens), pips: true, only: false }
 *   Returns { show(i), play(), pause(), destroy() }.
 */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NAV = '/landing/screens/nav.png';
  const EASE = 'cubic-bezier(.45,0,.2,1)';

  function mount(el, screens, opts) {
    opts = Object.assign({ auto: true, pips: true }, opts || {});
    el.classList.add('pm');
    el.style.setProperty('--pm-w', (el.clientWidth || 288) + 'px');
    el.innerHTML = '<div class="isl"></div><div class="sb"><span>9:41</span><span class="r"><span class="sig"><i></i><i></i><i></i><i></i></span><span class="bat"></span></span></div>';

    const panes = screens.map((s) => {
      const p = document.createElement('div');
      p.className = 'pane';
      const img = new Image();
      img.className = 's'; img.alt = ''; img.draggable = false; img.src = s.src;
      p.appendChild(img);
      if (s.nav) { const n = new Image(); n.className = 'nv'; n.alt = ''; n.src = NAV; p.appendChild(n); }
      el.appendChild(p);
      return { s, p, img, anim: null };
    });
    let pips = null;
    if (opts.pips && screens.length > 1) {
      pips = document.createElement('div'); pips.className = 'pips';
      pips.innerHTML = screens.map(() => '<i></i>').join('');
      el.appendChild(pips);
    }

    let cur = -1, timer = null, playing = false, token = 0, visible = true;

    function maxScroll(pn) {
      const h = pn.img.getBoundingClientRect().height / (pn.img.getBoundingClientRect().height ? 1 : 1);
      const scrH = el.getBoundingClientRect().height;
      const navH = pn.s.nav ? scrH * (64 / 844) : 0;
      return Math.max(0, h - (scrH - navH));
    }
    function clear() { clearTimeout(timer); panes.forEach((x) => { if (x.anim) { x.anim.cancel(); x.anim = null; } }); }

    function show(i, runOnce) {
      token++; const my = token; clear(); el.classList.remove("scr");
      cur = (i + panes.length) % panes.length;
      panes.forEach((x, k) => x.p.classList.toggle('on', k === cur));
      if (pips) [...pips.children].forEach((d, k) => d.classList.toggle('on', k === cur));
      const pn = panes[cur];
      pn.img.style.transform = 'translateY(0)';
      const hold = pn.s.hold ?? 1100;
      const next = () => { if (my !== token) return; if (opts.auto && playing && visible && panes.length > 1) show(cur + 1); else if (opts.auto && playing && visible) loopSingle(); };
      const run = () => {
        if (my !== token) return;
        const m = pn.s.tall && !reduce ? maxScroll(pn) : 0;
        if (m > 4) {
          // longer screens scroll for longer, so the speed stays comfortable to read
          const dur = pn.s.scroll ?? Math.min(13000, Math.max(4200, m * 3.6));
          timer = setTimeout(() => {
            if (my !== token) return;
            el.classList.add("scr"); pn.anim = pn.img.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-m}px)` }], { duration: dur, easing: EASE, fill: 'forwards' });
            pn.anim.onfinish = () => { timer = setTimeout(next, hold); };
          }, hold);
        } else {
          timer = setTimeout(next, hold + 2200);
        }
      };
      // wait for the image so its height is known
      if (pn.img.complete && pn.img.naturalHeight) run(); else pn.img.addEventListener('load', run, { once: true });
    }
    function loopSingle() { const pn = panes[cur]; if (pn.anim) { pn.anim.reverse(); pn.anim.onfinish = () => { timer = setTimeout(() => show(cur), 900); }; } else show(cur); }

    function play() { if (reduce) return; playing = true; if (cur < 0) show(0); else show(cur); }
    function pause() { playing = false; token++; clear(); }

    show(0);
    let io = null;
    if (opts.auto && !reduce) {
      io = new IntersectionObserver((es) => es.forEach((e) => {
        visible = e.isIntersecting;
        if (visible) play(); else pause();
      }), { threshold: 0.25 });
      io.observe(el);
      playing = true;
    }
    return { show: (i) => { playing = opts.auto && !reduce; show(i); }, play, pause, destroy() { pause(); if (io) io.disconnect(); } };
  }
  window.Phone = { mount };
})();
