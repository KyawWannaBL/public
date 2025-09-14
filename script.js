document.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  // Reveal animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  $$('.animated-element').forEach(el => observer.observe(el));

  // Footer year
  $('#yr').textContent = new Date().getFullYear();

  // Mobile menu toggle
  const toggleMenu = () => {
    $('#mobile-menu-container').classList.toggle('hidden');
    $('#mobile-menu').classList.toggle('translate-x-full');
  };

  $('#mobile-toggle').addEventListener('click', toggleMenu);
  $('#mobile-menu-overlay').addEventListener('click', toggleMenu);
  $$('.mobile-link').forEach(link => link.addEventListener('click', toggleMenu));

  // Slideshow
  const slideshow = $('#gallery .slideshow');
  if (slideshow) {
    const slides = slideshow.querySelectorAll('img');
    let current = 0;
    setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 4000);
  }

  // Chat simulation
  const chatInput = $('#chatInput');
  const chatSend = $('#chatSend');
  const chatWindow = $('#chat');

  const addMessage = (text, isUser = false) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = `p-3 rounded-lg w-fit max-w-xs break-words ${
      isUser ? 'ml-auto bg-[#FFC700] text-slate-950 font-semibold' : 'bg-slate-700/50'
    }`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  const handleSend = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, true);
    chatInput.value = '';
    setTimeout(() => {
      addMessage("Thank you for your message. A logistics specialist will be in touch shortly.", false);
    }, 800);
  };

  chatSend.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') handleSend();
  });

  // Hero video volume toggle
  const video = $('#hero-video');
  const volumeToggle = $('#volume-toggle');
  const volOn = $('#volume-on');
  const volOff = $('#volume-off');

  if (video && volumeToggle) {
    volumeToggle.addEventListener('click', () => {
      video.muted = !video.muted;
      video.volume = 0.1;
      volOn.classList.toggle('hidden', video.muted);
      volOff.classList.toggle('hidden', !video.muted);
    });
  }

  // Particles.js
  if (document.getElementById('particles-js')) {
    particlesJS('particles-js', {
      particles: {
        number: { value: 40 },
        color: { value: "#ffffff" },
        shape: { type: "circle" },
        opacity: { value: 0.2, random: true },
        size: { value: 2.5, random: true },
        line_linked: { enable: false },
        move: {
          enable: true,
          speed: 1.5,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out"
        }
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: false }
        }
      }
    });
  }

  // Cookie consent
  const consentBanner = $('#cookie-consent');
  const acceptBtn = $('#accept-cookies');

  if (!localStorage.getItem('cookieConsent')) {
    consentBanner.classList.remove('hidden');
  }

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'true');
      consentBanner.style.display = 'none';
    });
  }
});
