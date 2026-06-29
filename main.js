/* main.js - vanilla JS for simple interactivity and tiny game gating
   - computes a small "game" value and unlocks sections when criteria met
   - updates CSS vars for cursor-reactive visuals
   - rotates the tesseract based on cursor
*/

(function(){
  const playBtn = document.getElementById('playBtn');
  const projects = document.getElementById('projects');
  const experience = document.getElementById('experience');
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

  // Simple state persisted in localStorage
  const stateKey = 'elwin_site_state_v1';
  const defaultState = { clicks:0, unlocked:false };
  function loadState(){ try{ return JSON.parse(localStorage.getItem(stateKey)) || defaultState }catch(e){return defaultState} }
  function saveState(s){ localStorage.setItem(stateKey, JSON.stringify(s)); }

  // program loaded returns a tiny value (random seed or persisted progress)
  const state = loadState();

  function setUnlocked(unlock){
    if(unlock){
      projects.classList.remove('locked'); projects.classList.add('unlocked');
      experience.classList.remove('locked'); experience.classList.add('unlocked');
      document.body.dataset.access = 'unlocked';
    } else {
      projects.classList.add('locked'); document.body.dataset.access = 'locked';
    }
    state.unlocked = !!unlock; saveState(state);
  }

  // initialize
  setUnlocked(state.unlocked);
  initDividerTicker();

  // small "game": click 5 times to unlock
  playBtn.addEventListener('click', ()=>{
    state.clicks = (state.clicks || 0) + 1;
    saveState(state);
    playBtn.textContent = `Play to Unlock (${state.clicks}/5)`;
    if(state.clicks >= 5){ setUnlocked(true); playBtn.textContent = 'Unlocked ✓'; playBtn.disabled = true }
  });

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

  // make name "pop" on hover with JS tweak for extra personality
  nameEl.addEventListener('mouseenter', ()=>{ nameEl.style.transform = 'translateY(-8px) scale(1.04)'; });
  nameEl.addEventListener('mouseleave', ()=>{ nameEl.style.transform = ''; });

  // expose a tiny API: programLoaded() returns a value (seed) and toggles theme
  window.programLoaded = function(){
    // returns an access score and toggles a visual accent
    const seed = Math.floor(Math.random()*100);
    if(seed > 65) document.documentElement.style.setProperty('--neon-green', '#7CFFB2');
    else if(seed > 30) document.documentElement.style.setProperty('--neon-blue', '#00b8ff');
    else document.documentElement.style.setProperty('--neon-purple','#d68bff');
    return {seed, unlocked: state.unlocked};
  };

  // call programLoaded on startup and log result (could be used to change site later)
  const info = window.programLoaded();
  console.log('programLoaded', info);
})();
