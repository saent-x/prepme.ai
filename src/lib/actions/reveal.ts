/** Fades an element up the first time it scrolls into view. Elements already on screen are left alone. */
export function reveal(node: HTMLElement, delay = 0) {
  if (typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (node.getBoundingClientRect().top < innerHeight * 0.9) return;
  node.style.setProperty('--reveal-delay', `${delay}ms`);
  node.classList.add('reveal-wait');
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      node.classList.add('reveal');
      node.classList.remove('reveal-wait');
      io.disconnect();
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  io.observe(node);
  return { destroy: () => io.disconnect() };
}
