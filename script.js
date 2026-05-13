 document.addEventListener('DOMContentLoaded', () => {
  if (typeof kursor !== 'undefined') new kursor({ type: 2, color: "#BB6FFF", removeDefaultCursor: true });
});
 
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('transparent', window.scrollY > 60);
}, { passive: true });
 
/* ─── HAMBURGER / MOBILE NAV ─── */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
 
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
    // Bloqueia scroll do body enquanto menu está aberto
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });
 
  // Fecha ao clicar em qualquer link dentro do mobile nav
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
 
  // Fecha ao clicar fora do menu
  document.addEventListener('click', (e) => {
    if (mobileNav.classList.contains('open') &&
        !mobileNav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}
 
/* ─── CONTADORES ─── */
function animateCounter(el, target, isDecimal) {
  const duration = 2000, start = performance.now();
  function update(now) {
    const p = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = isDecimal ? (target * e).toFixed(1) : Math.floor(target * e).toString();
    if (p < 1) requestAnimationFrame(update);
    else el.textContent = isDecimal ? target.toFixed(1) : target.toString();
  }
  requestAnimationFrame(update);
}
 
const statsSection = document.querySelector('.section-stats');
let statsAnimated = false;
if (statsSection) {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        document.querySelectorAll('.stat-number').forEach(el => {
          animateCounter(el, parseFloat(el.dataset.target), el.classList.contains('stat-decimal'));
        });
      }
    });
  }, { threshold: 0.3 }).observe(statsSection);
}
 
/* ─── PARTICLES ─── */
particlesJS("particles-js", {
  "particles": {
    "number": {
      "value": 600,
      "density": { "enable": true, "value_area": 800 }
    },
    "color": { "value": "#ffffff" },
"line_linked": {
  "enable": true,
  "distance": 150,
  "color": "#7c3aed",
  "opacity": 0.4,
  "width": 1
},
    "size": {
      "value": 3,
      "random": true,
      "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false }
    },
    "line_linked": {
      "enable": true,
      "distance": 150,
      "color": "#7c3aed",
      "opacity": 0.4,
      "width": 1
    },
    "move": {
      "enable": true,
      "speed": 6,
      "direction": "none",
      "random": false,
      "straight": false,
      "out_mode": "out",
      "bounce": false,
      "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 }
    }
  },
  "interactivity": {
    "detect_on": "canvas",
    "events": {
      "onhover": { "enable": true, "mode": "repulse" },
      "onclick": { "enable": true, "mode": "push" },
      "resize": true
    },
    "modes": {
      "repulse": { "distance": 200, "duration": 0.4 },
      "push": { "particles_nb": 4 }
    }
  },
  "retina_detect": true
});
 
/* ─── REVEAL ON SCROLL ─── */
const revealEls = document.querySelectorAll('.project-card, .stat-item, .experiencia-img, .about-text, .cert-card');
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      ro.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
 
revealEls.forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = `opacity .6s ease ${(i % 6) * 0.08}s, transform .6s ease ${(i % 6) * 0.08}s`;
  ro.observe(el);
});
 
/* ─── ANIMAÇÃO HERO ─── */
['comeco-title', 'comeco-sub', 'comeco-actions'].forEach((cls, idx) => {
  const el = document.querySelector(`.${cls}`);
  if (!el) return;
  const delay = [0.2, 0.45, 0.65][idx];
  el.style.cssText += `opacity:0;transform:translateY(30px);transition:opacity .9s ease ${delay}s,transform .9s ease ${delay}s`;
  window.addEventListener('load', () => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
});
 
/* ─── SMOOTH SCROLL ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const t = document.querySelector(this.getAttribute('href'));
    if (t) {
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' });
    }
  });
});

  const overlay  = document.getElementById('certModal');
  const modalImg = document.getElementById('certModalImg');
  const btnClose = document.getElementById('certModalClose');

  document.querySelectorAll('.cert-card[data-cert]').forEach(card => {
    card.addEventListener('click', () => {
      modalImg.src = card.dataset.cert;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const fechar = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  btnClose.addEventListener('click', fechar);
  overlay.addEventListener('click', e => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });
