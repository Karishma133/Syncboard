// Tiny, dependency-free confetti burst. Fires ~28 CSS-animated pieces from
// the top of the viewport and cleans itself up — no canvas, no libraries.
const COLORS = ["#17C9B2", "#7C6CF6", "#FF7A59", "#F5B441"];

export function fireConfetti() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  root.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden;";

  const pieceCount = 28;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement("span");
    const color = COLORS[i % COLORS.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.25;
    const duration = 1.6 + Math.random() * 0.9;
    const size = 6 + Math.random() * 5;
    const rounded = Math.random() > 0.5;
    piece.style.cssText = `
      position:absolute; top:-5vh; left:${left}vw;
      width:${size}px; height:${size * (rounded ? 1 : 1.8)}px;
      background:${color}; border-radius:${rounded ? "50%" : "2px"};
      animation: confetti-fall ${duration}s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s forwards;
      opacity:0.95;
    `;
    root.appendChild(piece);
  }

  document.body.appendChild(root);
  setTimeout(() => root.remove(), 3000);
}
