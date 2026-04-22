/* ============================================
   GAMMA QUANT — SCRIPT PRINCIPAL
   Navegação, Form, Scroll, Animações
   ============================================ */

(function() {
    'use strict';

    // ========== NAVBAR SCROLL ==========
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function handleScroll() {
        // Navbar background on scroll
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlight based on scroll position
        const scrollPos = window.scrollY + 120;
        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);

            if (link) {
                if (scrollPos >= top && scrollPos < bottom) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ========== MOBILE MENU ==========
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // ========== SMOOTH SCROLL ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navHeight = navbar.offsetHeight;
                const targetPos = target.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPos,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========== FORM SUBMISSION ==========
    // Formulario agora e um iframe embedado do Full Stacky (GoHighLevel)
    // Submissao, validacao e redirect sao tratados pelo proprio iframe.
    const leadForm = document.getElementById('leadForm');

    if (leadForm) {
        leadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                nome: document.getElementById('nome').value.trim(),
                whatsapp: document.getElementById('whatsapp').value.trim(),
                email: document.getElementById('email').value.trim(),
                perfil: document.getElementById('perfil').value,
                timestamp: new Date().toISOString(),
                origem: 'site-institucional-gammaquant'
            };

            // Validação básica
            if (!formData.nome || !formData.whatsapp || !formData.email || !formData.perfil) {
                showNotification('Por favor, preencha todos os campos.', 'error');
                return;
            }

            if (!isValidEmail(formData.email)) {
                showNotification('Por favor, insira um e-mail válido.', 'error');
                return;
            }

            const phoneDigits = formData.whatsapp.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                showNotification('Por favor, insira um WhatsApp válido.', 'error');
                return;
            }

            // Loading state
            const submitBtn = leadForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Enviando...';

            // Backup local (nao depende do CRM responder)
            try {
                const leads = JSON.parse(localStorage.getItem('gammaquant_leads') || '[]');
                leads.push(formData);
                localStorage.setItem('gammaquant_leads', JSON.stringify(leads));
            } catch (e) {
                // localStorage indisponivel — segue o fluxo
            }

            // Monta payload do jeito que o GoHighLevel espera
            const phoneDigitsClean = formData.whatsapp.replace(/\D/g, '');
            const [firstName, ...lastParts] = formData.nome.split(' ');
            const ghlPayload = {
                first_name: firstName || formData.nome,
                last_name: lastParts.join(' ').trim(),
                full_name: formData.nome,
                email: formData.email,
                phone: phoneDigitsClean.startsWith('55')
                    ? `+${phoneDigitsClean}`
                    : `+55${phoneDigitsClean}`,
                perfil: getPerfilLabel(formData.perfil),
                perfil_code: formData.perfil,
                origem: formData.origem,
                etiqueta: 'PLATAFORMA',
                timestamp: formData.timestamp
            };

            const webhookReady = GHL_WEBHOOK_URL && !GHL_WEBHOOK_URL.startsWith('REPLACE_ME');

            if (webhookReady) {
                fetch(GHL_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ghlPayload)
                })
                .then(() => handleSuccess())
                .catch((err) => {
                    console.warn('CRM falhou, redirecionando ao WhatsApp:', err?.message || err);
                    handleSuccess();
                });
            } else {
                // Webhook ainda nao configurado — segue direto pro WhatsApp
                handleSuccess();
            }

            function handleSuccess() {
                showNotification('✓ Cadastro recebido! Em instantes entraremos em contato.', 'success');
                leadForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                // Redireciona para WhatsApp com mensagem pré-pronta após 2s
                setTimeout(() => {
                    const msg = encodeURIComponent(
                        `Olá, meu nome é ${formData.nome} e quero saber mais sobre a Plataforma Gamma Quant.\n\n` +
                        `Meu perfil: ${getPerfilLabel(formData.perfil)}.\n\n` +
                        `Já vou começar a ver o material aqui: https://portal.gammaquant.com.br/gammaquant-new`
                    );
                    window.open(`https://wa.me/5521990089490?text=${msg}`, '_blank');
                }, 2000);
            }
        });
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function getPerfilLabel(value) {
        const labels = {
            'iniciante': 'Ainda não invisto',
            'iniciante-bolsa': 'Invisto há menos de 1 ano',
            'intermediario': 'Invisto entre 1 e 3 anos',
            'experiente': 'Invisto há mais de 3 anos',
            'profissional': 'Profissional / formação em finanças'
        };
        return labels[value] || value;
    }

    // ========== NOTIFICATION ==========
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.gq-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `gq-notification gq-notification-${type}`;
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '24px',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: '9999',
            maxWidth: '360px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            transform: 'translateX(400px)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: 'Montserrat, sans-serif',
            border: '1px solid'
        });

        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, #0f2f1a, #1a3a25)';
            notification.style.color = '#4ade80';
            notification.style.borderColor = '#16a34a';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, #2f0f0f, #3a1a1a)';
            notification.style.color = '#f87171';
            notification.style.borderColor = '#dc2626';
        } else {
            notification.style.background = 'linear-gradient(135deg, #1a1a1a, #2a2a2a)';
            notification.style.color = '#f58a00';
            notification.style.borderColor = '#f58a00';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 400);
        }, 5000);
    }

    // ========== REVEAL ON SCROLL ==========
    const revealElements = document.querySelectorAll(
        '.pillar-card, .feature-card, .audience-card, .section-header, .form-card, .form-info, .method-quote'
    );

    revealElements.forEach(el => el.classList.add('reveal'));

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -60px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('visible'));
    }

    // ========== CONSOLE BRAND ==========
    console.log(
        '%c GAMMA QUANT ',
        'background: #f58a00; color: #000; font-size: 20px; font-weight: 900; padding: 8px 16px; border-radius: 4px;'
    );
    console.log(
        '%c Engenharia Aplicada ao Mercado Financeiro ',
        'color: #f58a00; font-size: 13px; font-weight: 600;'
    );
    console.log(
        '%c O mercado é volátil. Nós operamos com método. ',
        'color: #888; font-size: 11px; font-style: italic;'
    );

})();
