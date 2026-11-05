const photos = [1, 2, 3, 4].map(n => `enhanced-${n}.webp`);
let index = 0;
const image = document.getElementById('gallery-image');
const count = document.getElementById('gallery-count');
const modal = document.getElementById('photo-modal');
const largeImage = document.getElementById('large-photo');
const openButton = document.getElementById('gallery-open');
let suppressOpen = false;

let requestedIndex = index;
let photoRequest = 0;
const animations = new Map();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function animatePhoto(target, direction) {
  animations.get(target)?.cancel();
  if (reducedMotion.matches || !target.animate) return;
  const animation = target.animate([
    { opacity: 0, transform: `translateX(${direction * 24}px)` },
    { opacity: 1, transform: 'translateX(0)' }
  ], { duration: 280, easing: 'cubic-bezier(.22,.61,.36,1)' });
  animations.set(target, animation);
  animation.onfinish = () => animations.delete(target);
}

async function showPhoto(change) {
  requestedIndex = (requestedIndex + change + photos.length) % photos.length;
  const nextIndex = requestedIndex;
  const request = ++photoRequest;
  const prepared = new Image();
  prepared.src = photos[nextIndex];
  try {
    // Keep the current photo visible until the next one is ready.
    await prepared.decode();
  } catch {
    if (request === photoRequest) requestedIndex = index;
    return;
  }
  if (request !== photoRequest) return;
  index = nextIndex;
  const alt = `Фото автосервісу Clifford, ${index + 1} із ${photos.length}`;
  image.src = photos[index];
  image.alt = alt;
  count.textContent = `${String(index + 1).padStart(2, '0')} / 04`;
  animatePhoto(image, Math.sign(change));
  if (modal.open) {
    largeImage.src = photos[index];
    largeImage.alt = alt;
    animatePhoto(largeImage, Math.sign(change));
  }
}
document.getElementById('prev').addEventListener('click', () => showPhoto(-1));
document.getElementById('next').addEventListener('click', () => showPhoto(1));
document.querySelectorAll('[data-gallery-step]').forEach(button => {
  button.addEventListener('click', () => showPhoto(Number(button.dataset.galleryStep)));
});
openButton.addEventListener('click', event => {
  if (suppressOpen) {
    event.preventDefault();
    suppressOpen = false;
    return;
  }
  largeImage.src = photos[index];
  largeImage.alt = image.alt;
  modal.showModal();
});
document.getElementById('close-photo').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });

// Let vertical gestures scroll the page; only deliberate horizontal swipes change photos.
function enableSwipe(surface) {
  let gesture;
  surface.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressOpen = false;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) suppressOpen = true;
  });
  surface.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    const threshold = Math.max(44, Math.min(90, surface.clientWidth * 0.12));
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressOpen = true;
      showPhoto(dx < 0 ? 1 : -1);
    }
    gesture = undefined;
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
  });
  surface.addEventListener('pointercancel', () => { gesture = undefined; });
  surface.addEventListener('lostpointercapture', () => { gesture = undefined; });
}
enableSwipe(openButton);
enableSwipe(largeImage);
function keyboardNavigation(event) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  showPhoto(event.key === 'ArrowRight' ? 1 : -1);
}
document.querySelector('.gallery-photo').addEventListener('keydown', keyboardNavigation);
modal.addEventListener('keydown', keyboardNavigation);
