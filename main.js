/* main.js - shared interactivity across all pages */

(function(){
 const nameEl = document.getElementById('name');
 const tesseract = document.getElementById('tesseract');
 const dividerSpeed = 30; // px/second, fixed for all dividers
  const dividerStates = [];

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
      link.addEventListener('click', () => closeMenu());
    });

    window.addEventListener('resize', () => {
      if(window.innerWidth > 760){
        closeMenu();
      }
    });
  }

  initMobileMenu();

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
    const cards = document.querySelectorAll('.interest-card[data-effect]');
    if(!cards.length) return;

    const effectDurations = {
      snowboarding: 1900,
      tennis: 2000,
      computer: 2300,
      'machine-learning': 1800,
      games: 2000,
      'hanging-out': 2400
    };

    const effectCooldownBuffer = 700;

    const lastTriggered = new Map();
    const timers = new WeakMap();

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
    });
  }

  initInterestEffects();

  function initMiniPlatformer(){
    const canvas = document.getElementById('miniPlatformerCanvas');
    if(!canvas || !(canvas instanceof HTMLCanvasElement)) return;

    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    const state = {
      x: 14,
      y: 0,
      w: 10,
      h: 12,
      vx: 0,
      vy: 0,
      grounded: false
    };

    const gravity = 0.38;
    const moveSpeed = 1.4;
    const jumpSpeed = 4.8;
    const keys = { left: false, right: false };
    let controlsActive = false;

    const platforms = [
      { x: 0, y: 104, w: 260, h: 14 },
      { x: 52, y: 82, w: 42, h: 8 },
      { x: 122, y: 67, w: 46, h: 8 },
      { x: 188, y: 51, w: 40, h: 8 }
    ];

    const goal = { x: 236, y: 33, w: 10, h: 18 };
    let wonAt = 0;

    function resetPlayer(){
      state.x = 14;
      state.y = 88;
      state.vx = 0;
      state.vy = 0;
      state.grounded = false;
    }

    function intersects(a, b){
      return (
        a.x < (b.x + b.w) &&
        (a.x + a.w) > b.x &&
        a.y < (b.y + b.h) &&
        (a.y + a.h) > b.y
      );
    }

    resetPlayer();

    canvas.tabIndex = 0;
    canvas.addEventListener('mouseenter', () => { controlsActive = true; });
    canvas.addEventListener('mouseleave', () => {
      controlsActive = false;
      keys.left = false;
      keys.right = false;
    });
    canvas.addEventListener('focus', () => { controlsActive = true; });
    canvas.addEventListener('blur', () => {
      controlsActive = false;
      keys.left = false;
      keys.right = false;
    });
    canvas.addEventListener('click', () => { canvas.focus(); });

    function onKeyDown(event){
      if(!controlsActive) return;

      if(event.code === 'ArrowLeft' || event.code === 'KeyA'){
        keys.left = true;
      } else if(event.code === 'ArrowRight' || event.code === 'KeyD'){
        keys.right = true;
      } else if((event.code === 'ArrowUp' || event.code === 'Space' || event.code === 'KeyW') && state.grounded){
        state.vy = -jumpSpeed;
        state.grounded = false;
      } else {
        return;
      }

      event.preventDefault();
    }

    function onKeyUp(event){
      if(!controlsActive) return;

      if(event.code === 'ArrowLeft' || event.code === 'KeyA'){
        keys.left = false;
      } else if(event.code === 'ArrowRight' || event.code === 'KeyD'){
        keys.right = false;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function update(){
      if(wonAt && (performance.now() - wonAt > 1100)){
        wonAt = 0;
        resetPlayer();
      }

      if(wonAt){
        return;
      }

      const movement = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      state.vx = movement * moveSpeed;
      state.x += state.vx;
      state.vy += gravity;
      state.y += state.vy;

      state.grounded = false;
      platforms.forEach((platform) => {
        const wasAbove = (state.y + state.h - state.vy) <= platform.y;
        const isLanding = (state.y + state.h) >= platform.y;
        const overlapX = (state.x + state.w) > platform.x && state.x < (platform.x + platform.w);
        if(overlapX && wasAbove && isLanding && state.vy >= 0){
          state.y = platform.y - state.h;
          state.vy = 0;
          state.grounded = true;
        }
      });

      if(state.x < 0) state.x = 0;
      if((state.x + state.w) > canvas.width) state.x = canvas.width - state.w;
      if(state.y > canvas.height + 24){
        resetPlayer();
      }

      if(intersects(state, goal)){
        wonAt = performance.now();
      }
    }

    function draw(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f2742';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      for(let x = 0; x < canvas.width; x += 16){
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      ctx.fillStyle = '#2b4d7e';
      platforms.forEach((platform) => {
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      });

      ctx.fillStyle = '#ffd95f';
      ctx.fillRect(goal.x, goal.y, goal.w, goal.h);

      ctx.fillStyle = '#d7f2ff';
      ctx.fillRect(state.x, state.y, state.w, state.h);

      if(wonAt){
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Poppins, sans-serif';
        ctx.fillText('Goal!', 108, 40);
      }
    }

    function frame(){
      update();
      draw();
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  initMiniPlatformer();

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