const slides = [...document.querySelectorAll('.slide')];
const total = slides.length;
let current = 0;

const deck = document.getElementById('deck');
const currentEl = document.getElementById('current');
const totalEl = document.getElementById('total');
const progressEl = document.getElementById('progress');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

totalEl.textContent = String(total).padStart(2, '0');

// Double diamond. Horizontally the glyph runs 0 to 68, with the belly of the
// first diamond at 17 and the waist at 34. Slides up to the diverge boundary
// open it out; slides from there to the converge boundary close it again,
// stopping just short of the waist because the second diamond is work this
// project has not done yet. Every edge is the same length, so distance along
// the line is proportional to distance across it.
const DD_SPAN = 68;
const DD_BELLY = 17;
const DD_STOP = 32;          // close to the 34 waist, deliberately not on it
const divergeEnd  = slides.findIndex(s => s.dataset.dd === 'diverge-end');
const convergeEnd = slides.findIndex(s => s.dataset.dd === 'converge-end');

const ddLeads = [...document.querySelectorAll('.dd-lead')].map(path => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
  return { path, length };
});

function ddReach(i){
  if(i <= 0 || divergeEnd < 1) return 0;
  if(i <= divergeEnd) return DD_BELLY * i / divergeEnd;
  if(i >= convergeEnd) return DD_STOP;
  return DD_BELLY + (DD_STOP - DD_BELLY) * (i - divergeEnd) / (convergeEnd - divergeEnd);
}

function drawDoubleDiamond(i){
  const fraction = ddReach(i) / DD_SPAN;
  ddLeads.forEach(({ path, length }) => {
    path.style.strokeDashoffset = length * (1 - fraction);
  });
}

// Fly each note from where it sat loose on the findings slide into the bucket
// it was sorted into. Both slides stay laid out even while hidden, so the
// scattered position can just be measured off the real element.
function flyNotesIntoBuckets(slide){
  const notes = [...slide.querySelectorAll('.bucket-note[data-note]')];
  const moves = notes.map(note => {
    const from = document.querySelector(`.scatter-note[data-note="${note.dataset.note}"]`);
    if(!from) return null;
    const a = from.getBoundingClientRect();
    const b = note.getBoundingClientRect();
    return {
      note,
      dx: (a.left + a.width / 2) - (b.left + b.width / 2),
      dy: (a.top + a.height / 2) - (b.top + b.height / 2),
      rot: from.dataset.rot || 0
    };
  }).filter(Boolean);

  moves.forEach(m => {
    m.note.style.transition = 'none';
    m.note.style.transform = `translate(${m.dx}px, ${m.dy}px) rotate(${m.rot}deg)`;
  });

  void slide.offsetWidth; // commit the scattered start state before releasing

  moves.forEach((m, i) => {
    const delay = i * 14;
    m.note.style.transition =
      `transform .85s cubic-bezier(.22,1,.36,1) ${delay}ms`;
    m.note.style.transform = '';
  });
}

function render(){
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === current);
    s.classList.toggle('prev', i < current);
  });

  if(slides[current].dataset.flip === 'affinity') flyNotesIntoBuckets(slides[current]);
  currentEl.textContent = String(current + 1).padStart(2, '0');
  progressEl.style.width = ((current + 1) / total * 100) + '%';
  drawDoubleDiamond(current);
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
