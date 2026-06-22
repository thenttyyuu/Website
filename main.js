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
    const rx = (my - 50) * -0.6; // tilt based on y
    const ry = (mx - 50) * 0.8;  // rotate based on x
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
