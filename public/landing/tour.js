/* Tour.mount(el, cfg): plays a scripted "someone using the app" demo on real captured screens.
 *
 *   cfg.frames : { name: { src, tall?, h?, nav? } }   h = frame height in css px (tall frames, 390px wide)
 *   cfg.steps  : [ ops[], ops[], ... ]                one script per scroll-story step
 *
 *   ops:
 *     { show: 'name' }                       set the screen instantly
 *     { wait: ms }
 *     { reveal: [x, y], ms }                 scroll a tall screen so the point (x, y) is comfortably in view
 *     { scroll: y, ms }                      scroll a tall screen to y
 *     { tap: [x, y] }                        finger moves to (x, y), presses, ripples (frame coordinates)
 *     { go: 'name', how: 'fade'|'slide'|'up', ms }   navigate to another screen
 *   returns { play(i), stop() }
 */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 390, H = 844, NAVH = 64;
  const EASE = 'cubic-bezier(.45,0,.2,1)';
  const OUT = 'cubic-bezier(.22,1,.36,1)';

  function mount(el, cfg) {
    el.classList.add('pm', 'tour');
    el.style.setProperty('--pm-w', (el.clientWidth || 288) + 'px');
    el.innerHTML =
      '<div class="stage"></div>' +
      '<div class="tapm"></div>' +
      '<div class="isl"></div><div class="sb"><span>9:41</span><span class="r"><span class="sig"><i></i><i></i><i></i><i></i></span><span class="bat"></span></span></div>';
    const stage = el.querySelector('.stage');
    const marker = el.querySelector('.tapm');

    let token = 0, cur = null, playing = false, markerPos = null, visible = true, wantStep = null;

    const scale = () => el.clientWidth / W;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const alive = (t) => t === token;

    // preload every image once
    const urls = {};
    Object.entries(cfg.frames).forEach(([k, f]) => { const i = new Image(); i.src = f.src; urls[k] = i; });
    const navImg = new Image(); navImg.src = cfg.nav || '/landing/screens/nav.png';

    function makeLayer(name) {
      const f = cfg.frames[name];
      const d = document.createElement('div'); d.className = 'fl';
      const img = new Image(); img.className = 's'; img.src = f.src; img.alt = ''; img.draggable = false;
      d.appendChild(img);
      if (f.nav) { const n = new Image(); n.className = 'nv'; n.src = navImg.src; n.alt = ''; d.appendChild(n); }
      return { name, f, el: d, img, scroll: 0 };
    }
    const maxScroll = (L) => (L.f.tall ? Math.max(0, (L.f.h || H) - (H - (L.f.nav ? NAVH : 0))) : 0);
    const setScroll = (L, y) => { L.scroll = y; L.img.style.transform = `translateY(${-y * scale()}px)`; el.classList.toggle('scr', y > 8); };

    function setFrame(name) {
      stage.innerHTML = '';
      const L = makeLayer(name); stage.appendChild(L.el); cur = L; setScroll(L, 0);
    }

    async function doScroll(t, y, ms) {
      const L = cur; const to = Math.max(0, Math.min(y, maxScroll(L)));
      if (Math.abs(to - L.scroll) < 2) return;
      const from = L.scroll;
      if (to > 8) el.classList.add('scr');
      if (reduce) { setScroll(L, to); return; }
      const a = L.img.animate([{ transform: `translateY(${-from * scale()}px)` }, { transform: `translateY(${-to * scale()}px)` }], { duration: ms, easing: EASE, fill: 'forwards' });
      await sleep(ms + 30); if (!alive(t)) { a.cancel(); return; }
      setScroll(L, to); a.cancel();
    }

    async function moveMarker(t, x, y) {
      const s = scale();
      const px = x * s, py = (y - (cur.f.tall ? cur.scroll : 0)) * s;
      const from = markerPos || { x: el.clientWidth * 0.5, y: el.clientHeight * 0.9 };
      marker.style.opacity = '1';
      if (reduce) { marker.style.transform = `translate(${px}px,${py}px)`; markerPos = { x: px, y: py }; return; }
      const a = marker.animate([{ transform: `translate(${from.x}px,${from.y}px) scale(1)`, opacity: markerPos ? 1 : 0 }, { transform: `translate(${px}px,${py}px) scale(1)`, opacity: 1 }], { duration: 650, easing: EASE, fill: 'forwards' });
      await sleep(680); if (!alive(t)) { a.cancel(); return; }
      marker.style.transform = `translate(${px}px,${py}px)`; a.cancel();
      markerPos = { x: px, y: py };
    }
    async function press(t) {
      if (reduce) return;
      const tr = marker.style.transform || 'translate(0,0)';
      marker.animate([{ transform: tr + ' scale(1)' }, { transform: tr + ' scale(.72)' }, { transform: tr + ' scale(1)' }], { duration: 280, easing: OUT });
      const r = document.createElement('i'); r.className = 'rip';
      r.style.left = markerPos.x + 'px'; r.style.top = markerPos.y + 'px';
      el.appendChild(r); setTimeout(() => r.remove(), 750);
      await sleep(260);
    }

    async function go(t, name, how, ms) {
      const old = cur; const nxt = makeLayer(name);
      nxt.el.style.zIndex = 2; stage.appendChild(nxt.el); setScroll(nxt, 0);
      marker.style.opacity = '0.0'; // finger lifts while the screen changes
      if (reduce) { stage.querySelectorAll('.fl').forEach((x) => { if (x !== nxt.el) x.remove(); }); cur = nxt; return; }
      let anim;
      if (how === 'up') anim = nxt.el.animate([{ clipPath: 'inset(100% 0 0 0)', transform: 'translateY(5%)' }, { clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' }], { duration: ms || 460, easing: OUT, fill: 'both' });
      else if (how === 'slide') { anim = nxt.el.animate([{ transform: 'translateX(28%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: ms || 420, easing: OUT, fill: 'both' }); old.el.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-14%)', opacity: 0.4 }], { duration: ms || 420, easing: OUT, fill: 'both' }); }
      else anim = nxt.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms || 380, easing: 'ease', fill: 'both' });
      await sleep((ms || 420) + 40);
      if (!alive(t)) return;
      stage.querySelectorAll('.fl').forEach((x) => { if (x !== nxt.el) x.remove(); });
      if (anim) { anim.commitStyles && 0; anim.cancel(); }
      nxt.el.style.zIndex = ''; cur = nxt; markerPos = null;
    }

    async function run(i) {
      const t = ++token; wantStep = i; markerPos = null; marker.style.opacity = '0';
      const ops = cfg.steps[i];
      while (alive(t) && playing) {
        marker.style.opacity = '0'; markerPos = null;
        for (const op of ops) {
          if (!alive(t)) return;
          if (op.show) setFrame(op.show);
          else if (op.wait) await sleep(op.wait);
          else if (op.reveal) { const y = op.reveal[1]; const vis = H - (cur.f.nav ? NAVH : 0); await doScroll(t, y - vis * 0.55, op.ms || 1300); }
          else if (op.scroll !== undefined) await doScroll(t, op.scroll, op.ms || 1600);
          else if (op.tap) { await moveMarker(t, op.tap[0], op.tap[1]); if (!alive(t)) return; await press(t); }
          else if (op.go) await go(t, op.go, op.how, op.ms);
          if (!alive(t)) return;
        }
        marker.style.opacity = '0';
        if (!(await sleepAlive(t, 2600))) return;
      }
    }
    async function sleepAlive(t, ms) { await sleep(ms); return alive(t); }

    // show the first screen straight away, before any step has started
    const firstShow = cfg.steps[0] && cfg.steps[0].find((o) => o.show);
    if (firstShow) setFrame(firstShow.show);

    return {
      play(i) { playing = true; run(i); },
      stop() { playing = false; token++; marker.style.opacity = '0'; },
      resume() { if (wantStep !== null && !playing) { playing = true; run(wantStep); } },
    };
  }
  window.Tour = { mount };
})();
