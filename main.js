/* main.js - shared interactivity across all pages */

(function(){
 const nameEl = document.getElementById('name');
 const tesseract = document.getElementById('tesseract');
 const dividerSpeed = 45; // px/second, fixed for all dividers
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

    while(state.items.length && state.items[state.items.length - 1].x > width){
      const offscreen = state.items.pop();
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
    dividers.forEach((divider) => {
      const source = divider.querySelector('span');
      if(!source) return;

      const text = source.dataset.text || source.textContent || '';
      if(!text) return;

      source.remove();
      const track = document.createElement('div');
      track.className = 'divider-track';
      divider.appendChild(track);

      const state = { divider, track, text, items: [] };
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
        state.items.forEach((item) => positionItem(item, item.x + (dividerSpeed * dt)));
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
