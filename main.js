/* main.js - shared interactivity across all pages */

(function(){
 const nameEl = document.getElementById('name');
 const tesseract = document.getElementById('tesseract');
 const dividerSpeed = 30; // px/second, fixed for all dividers
  const dividerStates = [];
  const scrollFadeState = {
    boxes: [],
    pendingTarget: null,
    pendingBoxes: [],
    waitingForNavArrival: false,
    navDelayTimer: null
  };

  function isBoxVisibleEnough(box){
    const rect = box.getBoundingClientRect();
    const visiblePx = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    const ratio = visiblePx / Math.max(1, rect.height);
    return ratio >= 0.16;
  }

  function prepareNavFadeDelay(targetSection){
    if(!targetSection || !scrollFadeState.boxes.length) return;

    if(scrollFadeState.navDelayTimer){
      clearTimeout(scrollFadeState.navDelayTimer);
      scrollFadeState.navDelayTimer = null;
    }

    const targetBoxes = scrollFadeState.boxes.filter((box) => targetSection.contains(box));
    if(!targetBoxes.length) return;

    const distance = Math.abs(targetSection.getBoundingClientRect().top);
    const delayMs = Math.round(Math.max(120, Math.min(950, distance * 0.25)));

    scrollFadeState.pendingTarget = targetSection;
    scrollFadeState.pendingBoxes = targetBoxes;
    scrollFadeState.waitingForNavArrival = true;

    targetBoxes.forEach((box) => {
      box.classList.remove('in-view');
    });

    scrollFadeState.navDelayTimer = setTimeout(() => {
      scrollFadeState.waitingForNavArrival = false;
      scrollFadeState.pendingTarget = null;
      scrollFadeState.pendingBoxes.forEach((box) => {
        if(isBoxVisibleEnough(box)){
          box.classList.add('in-view');
        }
      });
      scrollFadeState.pendingBoxes = [];
      scrollFadeState.navDelayTimer = null;
    }, delayMs);
  }

  function makeDividerItem(text){
    const item = document.createElement('span');
    item.className = 'divider-item';
    item.textContent = text;
    return item;
  }

  function positionItem(item, x){
    item.x = x;
    item.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  function addItemRight(state){
    const item = makeDividerItem(state.text);
    state.track.appendChild(item);
    const last = state.items[state.items.length - 1];
    const x = last ? (last.x + last.offsetWidth) : 0;
    positionItem(item, x);
    state.items.push(item);
  }

  function addItemLeft(state){
    const item = makeDividerItem(state.text);
    state.track.appendChild(item); // measure width before inserting into state order
    const first = state.items[0];
    const x = first ? (first.x - item.offsetWidth) : -item.offsetWidth;
    positionItem(item, x);
    state.items.unshift(item);
  }

  function rebalanceDivider(state){
    const width = state.divider.clientWidth;

    // Clean up offscreen items on the right (exited right)
    while(state.items.length && state.items[state.items.length - 1].x > width){
      const offscreen = state.items.pop();
      offscreen.remove();
    }

    // Clean up offscreen items on the left (exited left)
    while(state.items.length && (state.items[0].x + state.items[0].offsetWidth) < 0){
      const offscreen = state.items.shift();
      offscreen.remove();
    }

    while(state.items.length && state.items[0].x > -state.items[0].offsetWidth){
      addItemLeft(state);
    }

    while(
      state.items.length &&
      (state.items[state.items.length - 1].x + state.items[state.items.length - 1].offsetWidth) < width
    ){
      addItemRight(state);
    }
  }

  function initDividerTicker(){
    const dividers = document.querySelectorAll('.divider');
    dividers.forEach((divider, index) => {
      const source = divider.querySelector('span');
      if(!source) return;

      const text = source.dataset.text || source.textContent || '';
      if(!text) return;

      source.remove();
      const track = document.createElement('div');
      track.className = 'divider-track';
      divider.appendChild(track);

      // Alternate direction based on the divider index
      const direction = index % 2 === 0 ? 1 : -1;

      const state = { divider, track, text, items: [], direction };
      addItemRight(state);
      while(
        state.items[state.items.length - 1].x + state.items[state.items.length - 1].offsetWidth < (divider.clientWidth * 1.5)
      ){
        addItemRight(state);
      }
      while(state.items[0].x > -divider.clientWidth){
        addItemLeft(state);
      }

      dividerStates.push(state);
    });

    if(!dividerStates.length) return;

    let lastFrame = performance.now();
    function tick(now){
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      dividerStates.forEach((state) => {
        // Multiply speed by direction (1 or -1)
        const speed = dividerSpeed * state.direction;
        state.items.forEach((item) => positionItem(item, item.x + (speed * dt)));
        rebalanceDivider(state);
      });

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    window.addEventListener('resize', () => dividerStates.forEach(rebalanceDivider));
  }

  // initialize shared effects
  initDividerTicker();

  // cursor-reactive: update CSS vars and tesseract rotate
  document.addEventListener('mousemove', (e)=>{
    const w = window.innerWidth, h = window.innerHeight;
    const mx = Math.round((e.clientX / w) * 100);
    const my = Math.round((e.clientY / h) * 100);
    document.documentElement.style.setProperty('--mx', mx);
    document.documentElement.style.setProperty('--my', my);

    // rotate tesseract subtly
    const rx = (my - 50) * -1; // tilt based on y
    const ry = (mx - 50) * 1.5;  // rotate based on x
    if(tesseract) tesseract.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });

  if(nameEl){
    nameEl.addEventListener('mouseenter', ()=>{ nameEl.style.transform = 'translateY(-8px) scale(1.04)'; });
    nameEl.addEventListener('mouseleave', ()=>{ nameEl.style.transform = ''; });
  }

  function smoothScrollToHashLink(link, event, options = {}){
    const targetSelector = link.getAttribute('href');
    if(!targetSelector || !targetSelector.startsWith('#')) return false;

    const target = document.querySelector(targetSelector);
    if(!target) return false;

    event.preventDefault();
    if(options.delayFadeUntilArrival){
      prepareNavFadeDelay(target);
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', targetSelector);
    return true;
  }

  function setActiveNavLink(clickedLink){
    const navLinks = document.querySelectorAll('#mainNavLinks .nav-btn');
    navLinks.forEach((navLink) => {
      navLink.classList.toggle('active', navLink === clickedLink);
    });
  }

  function setActiveNavLinkByHash(){
    const currentHash = window.location.hash || '#intro';
    const matchingLink = document.querySelector(`#mainNavLinks .nav-btn[href="${currentHash}"]`);
    if(matchingLink){
      setActiveNavLink(matchingLink);
    }
  }

  function initNavScrollTracking(){
    const navLinks = Array.from(document.querySelectorAll('#mainNavLinks .nav-btn[href^="#"]'));
    if(!navLinks.length) return;

    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter((section) => section instanceof HTMLElement);
    if(!sections.length) return;

    let ticking = false;
    let activeSectionId = '';

    function updateActiveByScroll(){
      const topBar = document.querySelector('.top-bar');
      const topBarHeight = topBar ? topBar.offsetHeight : 0;
      const markerY = topBarHeight + 28;
      const visibleSection = sections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= markerY && rect.bottom > markerY;
      });

      let activeSection = visibleSection || sections[0];
      if(!visibleSection){
        if(markerY < sections[0].getBoundingClientRect().top){
          activeSection = sections[0];
        } else {
          for(let index = sections.length - 1; index >= 0; index -= 1){
            if(sections[index].getBoundingClientRect().top <= markerY){
              activeSection = sections[index];
              break;
            }
          }
        }
      }

      const activeLink = navLinks.find((link) => link.getAttribute('href') === `#${activeSection.id}`);
      if(activeLink){
        setActiveNavLink(activeLink);
      }

      if(activeSectionId !== activeSection.id){
        activeSectionId = activeSection.id;
        window.history.replaceState(null, '', `#${activeSectionId}`);
      }
    }

    function requestUpdate(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActiveByScroll();
        ticking = false;
      });
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function initMobileMenu(){
    const toggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('mainNavLinks');
    if(!toggle || !navLinks) return;

    function closeMenu(){
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function openMenu(){
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', () => {
      if(document.body.classList.contains('menu-open')){
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (event) => {
        const handled = smoothScrollToHashLink(link, event, { delayFadeUntilArrival: true });
        if(!handled){
          closeMenu();
          return;
        }
        setActiveNavLink(link);
        closeMenu();
      });
    });

    window.addEventListener('resize', () => {
      if(window.innerWidth > 760){
        closeMenu();
      }
    });
  }

  initMobileMenu();
  initNavScrollTracking();
  setActiveNavLinkByHash();
  window.addEventListener('hashchange', setActiveNavLinkByHash);

  document.querySelectorAll('.weird-btn[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      smoothScrollToHashLink(link, event);
    });
  });

  async function postContactForm(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const status = document.getElementById('contactFormStatus');
    const submitButton = form.querySelector('button[type="submit"]');
    if(!status || !submitButton) return;

    status.textContent = 'Sending...';
    submitButton.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        status.textContent = 'Message failed to send. Please try again.';
        return;
      }

      form.reset();
      status.textContent = 'Message sent successfully.';
    } catch (error) {
      status.textContent = `Message failed to send: ${error.message}`;
    } finally {
      submitButton.disabled = false;
    }
  }

  const contactForm = document.getElementById('contactForm');
  if(contactForm){
    contactForm.addEventListener('submit', postContactForm);
  }

  function initInterestEffects(){
    const cards = document.querySelectorAll('.interest-card[data-effect], .project-animation-card[data-effect]');
    if(!cards.length) return;
    const visuals = document.querySelectorAll('.interest-visual, .project-platformer-visual');

    const effectDurations = {
      snowboarding: 1900,
      tennis: 2000,
      computer: 2300,
      'machine-learning': 1800,
      games: 2000,
      'hanging-out': 2400,
      'project-platformer': 2400
    };

    const effectCooldownBuffer = 700;

    const lastTriggered = new Map();
    const timers = new WeakMap();

    function syncEffectMetrics(){
      visuals.forEach((visual) => {
        const width = Math.max(160, visual.clientWidth);
        const travelFull = Math.round(width + 84);
        const travelMid = Math.round(travelFull * 0.34);
        const travelEnd = Math.round(travelFull * 0.78);
        const tennisTravel = Math.round(Math.max(120, width - 24));
        const tennisMid = Math.round(tennisTravel * 0.64);
        const robotTravel = Math.round(Math.max(170, width + 46));
        const walkTravel = Math.round(Math.max(165, width + 38));
        const boardWidth = Math.round(width * 0.8);
        const pongTravel = Math.max(100, boardWidth - 32);
        const projectPlatformerTravel = Math.round(Math.max(170, width + 40));

        visual.style.setProperty('--travel-full', `${travelFull}px`);
        visual.style.setProperty('--travel-mid', `${travelMid}px`);
        visual.style.setProperty('--travel-end', `${travelEnd}px`);
        visual.style.setProperty('--tennis-travel', `${tennisTravel}px`);
        visual.style.setProperty('--tennis-mid', `${tennisMid}px`);
        visual.style.setProperty('--robot-travel', `${robotTravel}px`);
        visual.style.setProperty('--walk-travel', `${walkTravel}px`);
        visual.style.setProperty('--walk-quarter', `${Math.round(walkTravel * 0.25)}px`);
        visual.style.setProperty('--walk-half', `${Math.round(walkTravel * 0.5)}px`);
        visual.style.setProperty('--walk-three-quarter', `${Math.round(walkTravel * 0.75)}px`);
        visual.style.setProperty('--pong-travel', `${pongTravel}px`);
        visual.style.setProperty('--project-platformer-travel', `${projectPlatformerTravel}px`);
      });
    }

    syncEffectMetrics();
    window.addEventListener('resize', syncEffectMetrics);

    function trigger(card){
      const effect = card.dataset.effect;
      if(!effect) return;

      const duration = effectDurations[effect] || 1800;
      const cooldown = duration + effectCooldownBuffer;
      const now = performance.now();
      const previous = lastTriggered.get(effect) || -Infinity;
      if((now - previous) < cooldown) return;

      lastTriggered.set(effect, now);

      card.classList.remove('playing');
      void card.offsetWidth;
      card.classList.add('playing');

      const existingTimer = timers.get(card);
      if(existingTimer){
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        card.classList.remove('playing');
      }, duration);

      timers.set(card, timer);
    }

    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => trigger(card));
      card.addEventListener('focusin', () => trigger(card));
    });
  }

  initInterestEffects();

  function initScrollFadeIn(){
    const boxes = document.querySelectorAll('.title-card, .card, .project-card');
    if(!boxes.length) return;

    boxes.forEach((box) => box.classList.add('scroll-fade'));
    scrollFadeState.boxes = Array.from(boxes);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const isInDelayedSection = scrollFadeState.waitingForNavArrival &&
          scrollFadeState.pendingTarget &&
          scrollFadeState.pendingTarget.contains(entry.target);

        if(entry.isIntersecting && !isInDelayedSection){
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    }, {
      threshold: 0.16
    });

    boxes.forEach((box) => observer.observe(box));
  }

  initScrollFadeIn();

  function initMiniFlyGame(){
    const canvas = document.getElementById('miniFlyCanvas');
    if(!canvas || !(canvas instanceof HTMLCanvasElement)) return;

    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    let width = 260;
    let height = 118;
    let dpr = window.devicePixelRatio || 1;
    let lastFrame = performance.now();
    let running = false;
    let timeLeft = 16;
    let score = 0;
    let message = 'Click to start';

    const fly = {
      x: 64,
      y: 54,
      radius: 5,
      vx: 1.6,
      vy: 1.25
    };

    function resizeCanvas(){
      const rect = canvas.getBoundingClientRect();
      width = Math.max(140, Math.floor(rect.width));
      height = Math.max(86, Math.floor(rect.height));
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fly.x = Math.min(Math.max(fly.radius, fly.x), width - fly.radius);
      fly.y = Math.min(Math.max(24, fly.y), height - fly.radius);
    }

    function placeFlyRandomly(){
      fly.x = 20 + (Math.random() * (width - 40));
      fly.y = 30 + (Math.random() * (height - 42));
    }

    function startRound(){
      running = true;
      timeLeft = 16;
      score = 0;
      fly.vx = (Math.random() > 0.5 ? 1 : -1) * 1.6;
      fly.vy = (Math.random() > 0.5 ? 1 : -1) * 1.25;
      placeFlyRandomly();
      message = '';
    }

    function endRound(){
      running = false;
      message = `Time! Caught: ${score}`;
    }

    function clickPosition(event){
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function attemptCatch(x, y){
      if(!running){
        startRound();
        return;
      }

      const dx = x - fly.x;
      const dy = y - fly.y;
      const hitRadius = fly.radius + 6;
      if((dx * dx) + (dy * dy) <= (hitRadius * hitRadius)){
        score += 1;
        const speedBoost = Math.min(4.2, 1.05 + (score * 0.015));
        fly.vx = (fly.vx >= 0 ? 1 : -1) * Math.min(4.2, Math.abs(fly.vx) * speedBoost);
        fly.vy = (fly.vy >= 0 ? 1 : -1) * Math.min(4.2, Math.abs(fly.vy) * speedBoost);
        placeFlyRandomly();
      }
    }

    canvas.addEventListener('click', (event) => {
      const point = clickPosition(event);
      attemptCatch(point.x, point.y);
    });

    canvas.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      if(!touch) return;
      const rect = canvas.getBoundingClientRect();
      attemptCatch(touch.clientX - rect.left, touch.clientY - rect.top);
      event.preventDefault();
    }, { passive: false });

    function update(now){
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      if(running){
        timeLeft -= dt;
        if(timeLeft <= 0){
          endRound();
          return;
        }

        fly.x += fly.vx;
        fly.y += fly.vy;

        if(fly.x <= fly.radius){
          fly.x = fly.radius;
          fly.vx = Math.abs(fly.vx);
        } else if(fly.x >= (width - fly.radius)){
          fly.x = width - fly.radius;
          fly.vx = -Math.abs(fly.vx);
        }

        if(fly.y <= 24){
          fly.y = 24;
          fly.vy = Math.abs(fly.vy);
        } else if(fly.y >= (height - fly.radius)){
          fly.y = height - fly.radius;
          fly.vy = -Math.abs(fly.vy);
        }
      }
    }

    function draw(){
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#0f2742';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '10px Poppins, sans-serif';
      ctx.fillText(`Score: ${score}`, 8, 14);
      ctx.fillText(`Time: ${Math.max(0, Math.ceil(timeLeft))}`, width - 54, 14);

      ctx.fillStyle = '#d4ecff';
      ctx.beginPath();
      ctx.ellipse(fly.x - 5, fly.y - 2, 6, 4, -0.35, 0, Math.PI * 2);
      ctx.ellipse(fly.x + 5, fly.y - 2, 6, 4, 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1f2f4f';
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, fly.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fly.x - 2, fly.y - 1, 1.4, 0, Math.PI * 2);
      ctx.fill();

      if(!running && message){
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = 'bold 11px Poppins, sans-serif';
        const metrics = ctx.measureText(message);
        ctx.fillText(message, (width - metrics.width) / 2, (height / 2) + 3);
      }
    }

    function frame(now){
      update(now);
      draw();
      requestAnimationFrame(frame);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(frame);
  }

  initMiniFlyGame();

  // expose a tiny API: programLoaded() returns a value (seed) and sets theme accent
  window.programLoaded = function(){
    const seed = Math.floor(Math.random()*100);
    if(seed > 65) document.documentElement.style.setProperty('--neon-green', '#7CFFB2');
    else if(seed > 30) document.documentElement.style.setProperty('--neon-blue', '#00b8ff');
    else document.documentElement.style.setProperty('--neon-purple','#d68bff');
    return {seed};
  };

  window.programLoaded();
})();