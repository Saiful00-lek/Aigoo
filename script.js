// ===== OPEN NEXT (link with data-open-next) =====
document.querySelectorAll("[data-open-next]").forEach((link) => {
  link.addEventListener("click", (e) => {
    const envId = link.getAttribute("data-env") || "envIndex";
    const href  = link.getAttribute("href");
    e.preventDefault();
    openEnvelopeSequence(envId, href);
  });
});

// ===== WISH BUTTON =====
const openWishBtn = document.getElementById("openWishBtn");
if (openWishBtn) {
  openWishBtn.addEventListener("click", () => {
    openEnvelopeSequence("envWish");
    openWishBtn.style.display = "none";

    const wish = document.getElementById("wish");
    if (wish) {
      wish.classList.remove("hidden");
      setTimeout(() => wish.classList.add("show"), 60);
    }

    launchConfetti();
  });
}

// ===== CONFETTI (light version for non-wish pages) =====
function launchConfetti() {
  const colors = ['#e05c5c','#c9a96e','#4caf6e','#4a86e8','#9c6ee8','#e8a838','#ff8fa3'];
  const shapes = ['■','●','★','♥'];
  for (let i = 0; i < 40; i++) {
    const conf = document.createElement("div");
    conf.className = "confetti";
    conf.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    document.body.appendChild(conf);
    conf.style.left = Math.random() * window.innerWidth + "px";
    conf.style.color = colors[Math.floor(Math.random() * colors.length)];
    conf.style.fontSize = (8 + Math.random() * 10) + "px";
    conf.style.animationDuration = (2.5 + Math.random() * 3) + "s";
    setTimeout(() => conf.remove(), 6000);
  }
}

// ===== AUTO-OPEN (reason, final) =====
const envAutoOpen = document.querySelector(".envelope.auto-open");
if (envAutoOpen) {
  setTimeout(() => envAutoOpen.classList.add("opened"), 280);
}

// ===== ENVELOPE SEQUENCE =====
function openEnvelopeSequence(envId, nextHref = null) {
  const env = document.getElementById(envId);
  if (!env) {
    if (nextHref) window.location.href = nextHref;
    return;
  }

  env.classList.add("opened");
  setTimeout(() => env.classList.add("pulled"),   440);
  setTimeout(() => env.classList.add("unfolded"), 920);

  if (nextHref) {
    setTimeout(() => { window.location.href = nextHref; }, 1180);
  }
}

// ===== LIGHTBOX =====
const lb      = document.getElementById("lightbox");
const lbImg   = document.getElementById("lightboxImg");
const lbStage = document.getElementById("lightboxStage");

let zoom = 1;
let isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function openLightbox(src) {
  if (!lb || !lbImg) return;
  zoom = 1;
  lbImg.style.transform = `scale(${zoom})`;
  lbImg.style.transformOrigin = "50% 50%";
  lbImg.src = src;
  lb.classList.add("show");
}

function closeLightbox() {
  if (!lb || !lbImg) return;
  lb.classList.remove("show");
  setTimeout(() => { lbImg.src = ""; }, 200);
}

document.querySelectorAll("[data-lightbox]").forEach(img => {
  img.addEventListener("click", () => openLightbox(img.getAttribute("src")));
});

if (lb) {
  lb.addEventListener("click", e => {
    if (e.target.matches("[data-close]")) closeLightbox();
  });
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && lb?.classList.contains("show")) closeLightbox();
});

// Desktop: zoom with scroll
function setOriginFromPointer(e) {
  if (!lbImg || !lbStage) return;
  const r = lbStage.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  const y = Math.min(1, Math.max(0, (e.clientY - r.top)  / r.height));
  lbImg.style.transformOrigin = `${x * 100}% ${y * 100}%`;
}

if (lbStage) {
  lbStage.addEventListener("mousemove", e => {
    if (!isDesktop || !lb?.classList.contains("show")) return;
    setOriginFromPointer(e);
  });

  lbStage.addEventListener("wheel", e => {
    if (!isDesktop || !lb?.classList.contains("show")) return;
    e.preventDefault();
    setOriginFromPointer(e);
    zoom = Math.min(4, Math.max(1, zoom * (Math.sign(e.deltaY) > 0 ? .88 : 1.12)));
    lbImg.style.transform = `scale(${zoom})`;
  }, { passive: false });
}

window.addEventListener("resize", () => {
  isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
});
