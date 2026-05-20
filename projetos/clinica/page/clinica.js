/* ═══════════════════════════════════════════════════════════
   CLÍNICA VIVA BEM — script.js
   Funcionalidades:
   1. Header inteligente (transparente → sólido)
   2. Menu mobile (hamburguer)
   3. Scroll Reveal (Intersection Observer)
   4. Contadores animados nas estatísticas
   5. Formulário com validação e feedback
   6. Smooth scroll nos links âncora
   7. Fechamento do menu ao clicar fora
═══════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════
   1. HEADER — muda visual ao rolar
   Transparente na hero, sólido no restante
══════════════════════════════════════ */
(function() {
  const header = document.getElementById('header');
  if (!header) return;

  function updateHeader() {
    // Se o scroll for menor que 60px, o header fica transparente
    if (window.scrollY < 60) {
      header.classList.add('transparent');
      header.classList.remove('scrolled');
    } else {
      header.classList.remove('transparent');
      header.classList.add('scrolled');
    }
  }

  // Inicializa no estado correto ao carregar a página
  updateHeader();

  // Atualiza a cada scroll (passive = sem bloquear a rolagem)
  window.addEventListener('scroll', updateHeader, { passive: true });
})();


/* ══════════════════════════════════════
   2. MENU MOBILE — hamburguer
   Abre/fecha o nav com animação
══════════════════════════════════════ */
(function() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  if (!hamburger || !nav) return;

  // Ao clicar no hamburguer, toggle do menu
  hamburger.addEventListener('click', function(e) {
    e.stopPropagation(); // evita que o click feche imediatamente

    const isOpen = nav.classList.toggle('nav-open');
    hamburger.classList.toggle('open', isOpen);

    // Bloqueia scroll do body enquanto menu está aberto
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Fecha o menu ao clicar em qualquer link do nav
  nav.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      nav.classList.remove('nav-open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Fecha o menu ao clicar fora dele
  document.addEventListener('click', function(e) {
    if (nav.classList.contains('nav-open') &&
        !nav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      nav.classList.remove('nav-open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Estilos do nav mobile (injetados aqui para não poluir o CSS)
  // No mobile (≤768px) o nav se torna um drawer lateral/superior
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .nav {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(13,27,36,.97);
        backdrop-filter: blur(16px);
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 36px;
        z-index: 998;
        visibility: hidden;
        opacity: 0;
        transform: translateY(-8px);
        transition: opacity .35s ease, transform .35s ease, visibility .35s ease;
      }
      .nav.nav-open {
        display: flex;
        visibility: visible;
        opacity: 1;
        transform: translateY(0);
      }
      .nav a {
        font-size: 1.6rem;
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-weight: 600;
        color: rgba(255,255,255,.7) !important;
      }
      .nav a:hover { color: #fff !important; }
    }
  `;
  document.head.appendChild(style);
})();


/* ══════════════════════════════════════
   3. SCROLL REVEAL — elementos entram
   suavemente ao aparecer na tela
   Usa Intersection Observer (performance)
══════════════════════════════════════ */
(function() {
  // Seleciona todos os elementos com classe .reveal
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Adiciona classe que ativa a animação (definida no CSS)
          entry.target.classList.add('visible');
          // Deixa de observar após animar (não precisa mais)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,         // aciona quando 12% do elemento está visível
      rootMargin: '0px 0px -40px 0px' // margem interna para não acionar muito cedo
    }
  );

  revealElements.forEach(function(el) {
    observer.observe(el);
  });
})();


/* ══════════════════════════════════════
   4. CONTADORES ANIMADOS
   Animam os números da barra de estatísticas
   quando ela entra na tela
══════════════════════════════════════ */
(function() {
  const statsSection = document.querySelector('.stats-bar');
  if (!statsSection) return;

  let hasAnimated = false; // garante que anima só uma vez

  // Função de easing suave (ease-out cubic)
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Anima um contador do 0 até o target
  function animateCounter(el, target, isDecimal) {
    const duration = 2200; // duração em ms
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = target * eased;

      // Formata: decimal (ex: 4.9) ou inteiro
      el.textContent = isDecimal
        ? current.toFixed(1)
        : Math.floor(current).toString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Garante o valor final exato
        el.textContent = isDecimal ? target.toFixed(1) : target.toString();
      }
    }

    requestAnimationFrame(update);
  }

  // Observa a barra de stats e aciona os contadores ao entrar na tela
  const statsObserver = new IntersectionObserver(
    function(entries) {
      if (entries[0].isIntersecting && !hasAnimated) {
        hasAnimated = true;

        // Seleciona todos os números e anima
        document.querySelectorAll('.stat-num').forEach(function(el) {
          const target = parseFloat(el.dataset.target);
          const isDecimal = el.classList.contains('stat-decimal');
          animateCounter(el, target, isDecimal);
        });
      }
    },
    { threshold: 0.4 }
  );

  statsObserver.observe(statsSection);
})();


/* ══════════════════════════════════════
   5. FORMULÁRIO — validação + feedback
   Valida campos obrigatórios e mostra
   mensagem de sucesso ao enviar
══════════════════════════════════════ */
(function() {
  const form = document.getElementById('formAgendamento');
  const successMsg = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault(); // previne reload

    let isValid = true;

    // Remove classes de erro anteriores
    form.querySelectorAll('.invalid').forEach(function(el) {
      el.classList.remove('invalid');
    });

    // Valida campos obrigatórios (marcados com required no HTML)
    form.querySelectorAll('[required]').forEach(function(field) {
      if (!field.value.trim()) {
        field.classList.add('invalid');
        isValid = false;

        // Shake suave no campo inválido para chamar atenção
        field.style.animation = 'shake .4s ease';
        setTimeout(function() { field.style.animation = ''; }, 400);
      }
    });

    if (!isValid) {
      // Foca no primeiro campo inválido
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // === AQUI: envie os dados para o seu backend/Formspree/Netlify ===
    // Exemplo com Formspree:
    // fetch('https://formspree.io/f/SEU_ID', { method: 'POST', body: new FormData(form) })
    // Por enquanto, simula um envio bem-sucedido:

    // Simula loading no botão
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    setTimeout(function() {
      // Esconde o formulário e mostra a mensagem de sucesso
      form.style.display = 'none';
      if (successMsg) successMsg.style.display = 'flex';

      // 🔧 Aqui você pode redirecionar para uma página de agradecimento:
      // window.location.href = '/obrigado.html';
    }, 1200); // simula delay de rede de 1.2 segundos
  });

  // Remove classe de erro ao usuário começar a digitar
  form.querySelectorAll('input, select, textarea').forEach(function(field) {
    field.addEventListener('input', function() {
      this.classList.remove('invalid');
    });
  });

  // Injeção da animação de shake (para campos inválidos)
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(shakeStyle);
})();


/* ══════════════════════════════════════
   6. SMOOTH SCROLL — links âncora
   Garante scroll suave mesmo em browsers
   que não suportam CSS scroll-behavior
══════════════════════════════════════ */
(function() {
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return; // evita links vazios

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      // Altura do header fixo para compensar no offset
      const headerHeight = document.getElementById('header')
        ? document.getElementById('header').offsetHeight
        : 0;

      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });
})();


/* ══════════════════════════════════════
   7. MICROINTERAÇÃO: máscara no telefone
   Formata automaticamente o campo de
   telefone enquanto o usuário digita
══════════════════════════════════════ */
(function() {
  const phoneInput = document.getElementById('telefone');
  if (!phoneInput) return;

  phoneInput.addEventListener('input', function() {
    // Remove tudo que não for número
    let value = this.value.replace(/\D/g, '');

    // Formata como (XX) XXXXX-XXXX
    if (value.length > 11) value = value.substring(0, 11);

    if (value.length <= 2) {
      value = value.replace(/^(\d{0,2})/, '($1');
    } else if (value.length <= 7) {
      value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else {
      value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }

    this.value = value;
  });
})();


/* ══════════════════════════════════════
   8. EFEITO: header ativo na seção atual
   Ilumina o link do nav correspondente
   à seção visível na tela
══════════════════════════════════════ */
(function() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  // Estilo de link ativo
  const activeStyle = document.createElement('style');
  activeStyle.textContent = `
    .nav a.nav-active {
      color: var(--azul) !important;
    }
    .nav a.nav-active::after {
      width: 100% !important;
    }
    #header.transparent .nav a.nav-active {
      color: #fff !important;
    }
  `;
  document.head.appendChild(activeStyle);

  const sectionObserver = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const id = entry.target.id;

          // Remove ativo de todos os links
          navLinks.forEach(function(link) {
            link.classList.remove('nav-active');
          });

          // Adiciona ativo no link correspondente
          const activeLink = document.querySelector('.nav a[href="#' + id + '"]');
          if (activeLink) activeLink.classList.add('nav-active');
        }
      });
    },
    {
      threshold: 0.4, // seção precisa ter 40% visível para ativar
      rootMargin: '-80px 0px -40% 0px'
    }
  );

  sections.forEach(function(section) {
    sectionObserver.observe(section);
  });
})();
