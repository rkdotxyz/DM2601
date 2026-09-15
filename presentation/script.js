const slides = document.querySelectorAll('.slide');
const total = slides.length;
let current = 0;

const deck = document.getElementById('deck');
const currentEl = document.getElementById('current');
const totalEl = document.getElementById('total');
const progressEl = document.getElementById('progress');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

totalEl.textContent = String(total).padStart(2, '0');

function render(){
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === current);
    s.classList.toggle('prev', i < current);
  });
  currentEl.textContent = String(current + 1).padStart(2, '0');
  progressEl.style.width = ((current + 1) / total * 100) + '%';
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === total - 1;
}

// Only a step between the paired zoom slides animates; everything else cuts.
function isZoomPair(a, b){
  const pair = (x, y) => x.classList.contains('zoom-from') && y.classList.contains('zoom-to');
  return pair(a, b) || pair(b, a);
}

function goTo(index){
  if(index < 0 || index >= total || index === current) return;
  deck.classList.toggle('zooming', isZoomPair(slides[current], slides[index]));
  current = index;
  render();
}

function go(delta){
  goTo(current + delta);
}

prevBtn.addEventListener('click', () => go(-1));
nextBtn.addEventListener('click', () => go(1));

window.addEventListener('keydown', (e) => {
  if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){ e.preventDefault(); go(1); }
  if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){ e.preventDefault(); go(-1); }
  if(e.key === 'Home'){ goTo(0); }
  if(e.key === 'End'){ goTo(total - 1); }
});

let touchStartX = 0;
window.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; });
window.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].screenX - touchStartX;
  if(Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
});

render();
