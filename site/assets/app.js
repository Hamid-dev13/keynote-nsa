/* CIA Keynote — navigation engine */
(function(){
  const deck   = document.getElementById('deck');
  const stage  = document.getElementById('stage');
  const slides = Array.from(stage.querySelectorAll('.slide'));
  const bar    = document.getElementById('bar');
  const cur    = document.getElementById('cur');
  const tot    = document.getElementById('tot');
  const dots   = document.getElementById('dots');
  let i = 0, overview = false;

  // build dots
  slides.forEach((s,idx)=>{
    const b=document.createElement('button');
    b.title = s.dataset.title || ('Slide '+(idx+1));
    b.addEventListener('click',()=>{ if(overview) toggleOverview(); go(idx); });
    dots.appendChild(b);
  });
  const dotEls = Array.from(dots.children);
  tot.textContent = String(slides.length).padStart(2,'0');

  // responsive: scale the whole 1280x720 stage to fit the viewport
  function applyScale(){
    if(overview){ stage.style.transform='none'; return; }
    const s = Math.min(window.innerWidth/1280, window.innerHeight/720);
    stage.style.transform = `scale(${s})`;
    stage.style.transformOrigin = 'center center';
  }

  function render(){
    slides.forEach((s,idx)=>{
      s.classList.toggle('current', idx===i);
      s.classList.toggle('past', idx<i);
    });
    dotEls.forEach((d,idx)=>d.classList.toggle('on',idx===i));
    bar.style.width = ((i)/(slides.length-1)*100)+'%';
    cur.textContent = String(i+1).padStart(2,'0');
    location.hash = i+1;
  }
  function go(n){ i=Math.max(0,Math.min(slides.length-1,n)); render(); }
  function next(){ go(i+1); }
  function prev(){ go(i-1); }

  function toggleOverview(){
    overview=!overview;
    deck.classList.toggle('overview',overview);
    applyScale();
    if(!overview) render();
  }

  // keyboard
  window.addEventListener('keydown',e=>{
    if(['ArrowRight',' ','PageDown'].includes(e.key)){e.preventDefault();overview?toggleOverview():next();}
    else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();prev();}
    else if(e.key==='Home'){go(0);} else if(e.key==='End'){go(slides.length-1);}
    else if(e.key==='f'||e.key==='F'){ if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();}
    else if(e.key==='o'||e.key==='O'||e.key==='Escape'){toggleOverview();}
  });

  // touch swipe
  let tx=0,ty=0;
  window.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
  window.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){ dx<0?next():prev(); }
  },{passive:true});

  // click arrows
  document.getElementById('np').addEventListener('click',prev);
  document.getElementById('nn').addEventListener('click',next);

  window.addEventListener('resize',applyScale);
  window.addEventListener('hashchange',()=>{
    const n=parseInt(location.hash.slice(1),10);
    if(n && n-1!==i) go(n-1);
  });

  // init
  const start=parseInt(location.hash.slice(1),10);
  if(start) i=Math.min(slides.length-1,Math.max(0,start-1));
  applyScale(); render();
})();
