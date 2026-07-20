// Main Javascript File for Kids FunZone Public Website

document.addEventListener('DOMContentLoaded', () => {
    // 0. Apply admin-managed footer content overrides (if configured)
    applyFooterSettings();

    // 1. Sticky Navbar styling on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled', 'shadow-sm');
            } else {
                navbar.classList.remove('scrolled', 'shadow-sm');
            }
        });
    }

    // 1a. Lock background scroll while the mobile hamburger menu is open
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse) {
        navbarCollapse.addEventListener('shown.bs.collapse', () => {
            document.body.classList.add('nav-open');
        });
        navbarCollapse.addEventListener('hidden.bs.collapse', () => {
            document.body.classList.remove('nav-open');
        });
        // Close the menu automatically when a nav link is tapped
        navbarCollapse.querySelectorAll('.nav-link, .btn').forEach((link) => {
            link.addEventListener('click', () => {
                if (navbarCollapse.classList.contains('show') && window.bootstrap) {
                    const instance = window.bootstrap.Collapse.getInstance(navbarCollapse);
                    if (instance) instance.hide();
                }
            });
        });
    }

    // 1b. Back to Top Button
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.classList.toggle('visible', window.scrollY > 300);
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 2. Gallery Filter Logic
    const filterButtons = document.querySelectorAll('.gallery-filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (filterButtons.length > 0 && galleryItems.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filterValue = button.getAttribute('data-filter');

                galleryItems.forEach(item => {
                    if (filterValue === 'all') {
                        item.style.display = 'block';
                    } else if (item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // 3. Membership Pricing Toggle (Monthly vs Annual)
    const periodToggle = document.getElementById('billingPeriodToggle');
    if (periodToggle) {
        periodToggle.addEventListener('change', (e) => {
            const isAnnual = e.target.checked;
            const prices = document.querySelectorAll('.pricing-value');
            const periods = document.querySelectorAll('.pricing-period');

            prices.forEach(price => {
                const monthlyVal = price.getAttribute('data-monthly');
                const annualVal = price.getAttribute('data-annual');
                price.textContent = isAnnual ? annualVal : monthlyVal;
            });

            periods.forEach(period => {
                period.textContent = isAnnual ? '/year' : '/month';
            });
        });
    }

    // 4. Contact Form Simulated Submit
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Show alert or success toast
            const formContainer = contactForm.parentElement;
            const originalContent = formContainer.innerHTML;
            
            formContainer.innerHTML = `
                <div class="text-center py-5 animate-fade-in">
                    <div class="display-1 text-success mb-3"><i class="bi bi-check2-circle"></i></div>
                    <h3>Thank you!</h3>
                    <p class="text-muted">Your message has been sent successfully. We will get back to you within 24 hours.</p>
                    <button class="btn btn-primary mt-3 btn-reload-form">Send Another Message</button>
                </div>
            `;

            formContainer.querySelector('.btn-reload-form').addEventListener('click', () => {
                location.reload();
            });
        });
    }

    // 6. Lightbox Modal Logic
    const lightboxModal = document.getElementById('lightboxModal');
    if (lightboxModal) {
        const lightboxImg = lightboxModal.querySelector('.lightbox-img');
        const galleryImages = document.querySelectorAll('.gallery-item img, .masonry-item img');
        galleryImages.forEach(img => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => {
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt;
                const modal = new bootstrap.Modal(lightboxModal);
                modal.show();
            });
        });
    }

    // 7. Statistics Counters Animation
    const counterElements = document.querySelectorAll('.stat-number');
    if (counterElements.length > 0) {
        const animateCounters = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const countTo = parseFloat(target.getAttribute('data-count')) || 0;
                    const duration = 2000; // 2 seconds
                    const startTime = performance.now();
                    const isDecimal = target.getAttribute('data-decimal') === 'true';

                    const updateCount = (currentTime) => {
                        const elapsedTime = currentTime - startTime;
                        const progress = Math.min(elapsedTime / duration, 1);
                        const easeProgress = progress * (2 - progress); // easeOutQuad
                        const currentValue = easeProgress * countTo;
                        
                        if (isDecimal) {
                            target.textContent = currentValue.toFixed(1) + (target.getAttribute('data-suffix') || '');
                        } else {
                            const roundedValue = Math.floor(currentValue);
                            if (countTo >= 1000) {
                                target.textContent = roundedValue.toLocaleString() + (target.getAttribute('data-suffix') || '+');
                            } else {
                                target.textContent = roundedValue + (target.getAttribute('data-suffix') || '');
                            }
                        }

                        if (progress < 1) {
                            requestAnimationFrame(updateCount);
                        } else {
                            if (isDecimal) {
                                target.textContent = countTo.toFixed(1) + (target.getAttribute('data-suffix') || '');
                            } else {
                                target.textContent = (countTo >= 1000 ? countTo.toLocaleString() : countTo) + (target.getAttribute('data-suffix') || '+');
                            }
                        }
                    };

                    requestAnimationFrame(updateCount);
                    observer.unobserve(target); // Only animate once
                }
            });
        };

        const counterObserver = new IntersectionObserver(animateCounters, {
            threshold: 0.1
        });

        counterElements.forEach(el => counterObserver.observe(el));
    }

    initVisualThemeAnimations();
});

// Apply footer content saved from the Admin Panel's Footer Management settings (falls back to the markup already in the page)
function applyFooterSettings() {
    let settings;
    try {
        settings = JSON.parse(localStorage.getItem('kfz_footer_settings'));
    } catch (e) {
        settings = null;
    }
    if (!settings) return;

    const tagline = document.getElementById('footerTagline');
    if (tagline && settings.tagline) tagline.textContent = settings.tagline;

    const facebookLink = document.getElementById('footerFacebookLink');
    if (facebookLink && settings.facebook) facebookLink.href = settings.facebook;

    const instagramLink = document.getElementById('footerInstagramLink');
    if (instagramLink && settings.instagram) instagramLink.href = settings.instagram;

    const youtubeLink = document.getElementById('footerYoutubeLink');
    if (youtubeLink && settings.youtube) youtubeLink.href = settings.youtube;

    const address = document.getElementById('footerAddress');
    if (address && settings.address) address.textContent = ' ' + settings.address;

    const phone = document.getElementById('footerPhone');
    if (phone && settings.phone) phone.textContent = ' ' + settings.phone;

    const email = document.getElementById('footerEmail');
    if (email && settings.email) email.textContent = ' ' + settings.email;
}

// Utility Toast function
function showToast(title, message, type = 'primary') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Create container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const id = 'toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success text-white' : type === 'danger' ? 'bg-danger text-white' : 'bg-primary text-white';
    
    const toastHTML = `
        <div id="${id}" class="toast align-items-center ${bgClass} border-0 animate-fade-in" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
            <div class="d-flex">
                <div class="toast-body">
                    <strong class="d-block">${title}</strong>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.getElementById(id);
    const bsToast = new bootstrap.Toast(toastEl);
    bsToast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

// Redesign Visual Theme Animations and Section Class Assigning
function initVisualThemeAnimations() {
    // 1. Assign classes to sections dynamically based on their headers
    document.querySelectorAll('section').forEach((section) => {
        const h2 = section.querySelector('h2');
        if (h2) {
            const text = h2.textContent.toLowerCase();
            if (text.includes('fun zones') || text.includes('attractions')) {
                section.classList.add('section-activities');
            } else if (text.includes('why choose')) {
                section.classList.add('section-why');
            } else if (text.includes('safety & hygiene') || text.includes('priority')) {
                section.classList.add('section-safety');
            } else if (text.includes('parent café') || text.includes('parent cafe') || text.includes('coffee & relaxation')) {
                section.classList.add('section-cafe');
            } else if (text.includes('reviews') || text.includes('diary')) {
                section.classList.add('section-testimonials');
            } else if (text.includes('kids play zone') || text.includes('take a break')) {
                section.classList.add('section-game');
            }
        }
        // Custom check for birthday packages section
        if (section.querySelector('h2') && section.querySelector('h2').textContent.toLowerCase().includes('birthday')) {
            section.classList.add('section-birthday');
        }
    });

    // 2. Add dynamic animated wave decoration to contact and footers
    const contactSection = document.querySelector('.section-contact') || document.querySelector('footer.website-footer');
    if (contactSection) {
        contactSection.style.position = 'relative';
        const waveDiv = document.createElement('div');
        waveDiv.className = 'wave-decoration';
        waveDiv.innerHTML = `
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" class="shape-fill"></path>
            </svg>
        `;
        contactSection.appendChild(waveDiv);
    }

    // 3. Respect user system preferences for reduced animations
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 4. Inject animated decorative elements throughout homepage
    const hero = document.querySelector('.hero-section');
    if (hero) {
        // Clouds
        for (let i = 0; i < 2; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'bg-particle anim-drift-horizontal';
            cloud.style.top = `${12 + Math.random() * 20}%`;
            cloud.style.left = `-${120 + Math.random() * 200}px`;
            cloud.style.opacity = 0.12 + Math.random() * 0.12;
            cloud.style.animationDuration = `${25 + Math.random() * 20}s`;
            cloud.style.animationDelay = `${i * 12}s`;
            cloud.innerHTML = `
                <svg width="${90 + Math.random() * 60}" height="60" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 40 A12 12 0 0 1 32 24 A18 18 0 0 1 68 24 A12 12 0 0 1 80 40 A8 8 0 0 1 72 48 L28 48 A8 8 0 0 1 20 40 Z" fill="#E8F1FF"/>
                </svg>
            `;
            hero.appendChild(cloud);
        }

        // Balloons
        const colors = ['#EC4899', '#FACC15', '#10E7B2', '#6D28D9', '#3B82F6'];
        for (let i = 0; i < 3; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'bg-particle anim-float-up';
            balloon.style.left = `${10 + Math.random() * 80}%`;
            balloon.style.animationDuration = `${16 + Math.random() * 8}s`;
            balloon.style.animationDelay = `${Math.random() * 12}s`;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 30 + Math.random() * 20;
            balloon.innerHTML = `
                <svg width="${size}" height="${size * 1.5}" viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="30" cy="35" rx="25" ry="30" fill="${color}" opacity="0.5"/>
                    <path d="M30 65 L27 70 L33 70 Z" fill="${color}"/>
                    <path d="M30 70 Q28 80 32 90" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" fill="none"/>
                </svg>
            `;
            hero.appendChild(balloon);
        }

        // Paper Plane
        const plane = document.createElement('div');
        plane.className = 'bg-particle anim-drift-sway';
        plane.style.left = '32%';
        plane.style.top = '35%';
        plane.style.animationDuration = '13s';
        plane.innerHTML = `
            <svg width="35" height="35" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M45 5 L5 25 L20 30 L45 5 Z" fill="#10E7B2" opacity="0.45"/>
                <path d="M45 5 L20 30 L25 45 L32 35 L45 5 Z" fill="#0D8A6A" opacity="0.55"/>
            </svg>
        `;
        hero.appendChild(plane);

        // Kite
        const kite = document.createElement('div');
        kite.className = 'bg-particle anim-drift-sway';
        kite.style.left = '75%';
        kite.style.top = '22%';
        kite.style.animationDuration = '16s';
        kite.style.animationDelay = '3s';
        kite.innerHTML = `
            <svg width="30" height="70" viewBox="0 0 40 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="#EC4899" opacity="0.4" stroke="#EC4899" stroke-width="1.5"/>
                <line x1="0" y1="20" x2="40" y2="20" stroke="rgba(255,255,255,0.4)"/>
                <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(255,255,255,0.4)"/>
                <path d="M20 40 Q25 55 18 70 T20 90" stroke="#FACC15" stroke-width="2" fill="none" opacity="0.6"/>
            </svg>
        `;
        hero.appendChild(kite);
    }

    // Activities Section particles
    const activities = document.querySelector('.section-activities');
    if (activities) {
        // Bubbles
        for (let i = 0; i < 6; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bg-particle bg-bubble-particle';
            const size = 15 + Math.random() * 20;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${5 + Math.random() * 90}%`;
            bubble.style.animationDuration = `${9 + Math.random() * 6}s`;
            bubble.style.animationDelay = `${Math.random() * 8}s`;
            activities.appendChild(bubble);
        }

        // Toy Blocks
        const b1 = document.createElement('div');
        b1.className = 'bg-particle anim-drift-sway';
        b1.style.left = '10%';
        b1.style.top = '25%';
        b1.style.animationDuration = '14s';
        b1.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="4" stroke="#FACC15" stroke-width="2" fill="none" opacity="0.45"/>
                <line x1="2" y1="2" x2="8" y2="8" stroke="#FACC15" stroke-width="2" opacity="0.45"/>
                <line x1="22" y1="22" x2="16" y2="16" stroke="#FACC15" stroke-width="2" opacity="0.45"/>
                <rect x="8" y="8" width="8" height="8" rx="1" stroke="#FACC15" stroke-width="2" fill="none" opacity="0.45"/>
            </svg>
        `;
        activities.appendChild(b1);

        const b2 = document.createElement('div');
        b2.className = 'bg-particle anim-drift-sway';
        b2.style.right = '12%';
        b2.style.top = '65%';
        b2.style.animationDuration = '17s';
        b2.style.animationDelay = '2s';
        b2.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="4" stroke="#EC4899" stroke-width="2" fill="none" opacity="0.45"/>
                <line x1="2" y1="2" x2="8" y2="8" stroke="#EC4899" stroke-width="2" opacity="0.45"/>
                <line x1="22" y1="22" x2="16" y2="16" stroke="#EC4899" stroke-width="2" opacity="0.45"/>
                <rect x="8" y="8" width="8" height="8" rx="1" stroke="#EC4899" stroke-width="2" fill="none" opacity="0.45"/>
            </svg>
        `;
        activities.appendChild(b2);
    }

    // Birthday Section particles
    const birthday = document.querySelector('.section-birthday');
    if (birthday) {
        const colors = ['#EC4899', '#FACC15', '#10E7B2', '#3B82F6', '#6D28D9'];
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'bg-particle bg-confetti-particle';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = `${5 + Math.random() * 90}%`;
            p.style.top = `${-20 - Math.random() * 60}px`;
            p.style.animationDuration = `${6 + Math.random() * 5}s`;
            p.style.animationDelay = `${Math.random() * 10}s`;
            // Randomly pick shape (rect vs circle)
            if (Math.random() > 0.5) p.style.borderRadius = '50%';
            birthday.appendChild(p);
        }
    }

    // Cafe Section steam
    const cafe = document.querySelector('.section-cafe');
    if (cafe) {
        const badge = cafe.querySelector('.badge');
        if (badge) {
            badge.style.position = 'relative';
            const steamCont = document.createElement('div');
            steamCont.className = 'coffee-steam-container';
            steamCont.innerHTML = `
                <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                    <path class="steam-line" d="M15,50 Q10,35 20,25 T15,0" style="animation-delay: 0s; animation-duration: 3.5s;"></path>
                    <path class="steam-line" d="M30,50 Q25,35 35,25 T30,0" style="animation-delay: 1.2s; animation-duration: 4.2s;"></path>
                    <path class="steam-line" d="M45,50 Q40,35 50,25 T45,0" style="animation-delay: 0.6s; animation-duration: 3.8s;"></path>
                </svg>
            `;
            badge.appendChild(steamCont);
        }
    }

    // Gallery Section particles
    const gallery = document.querySelector('.section-gallery') || document.querySelector('.gallery-grid')?.parentElement;
    if (gallery) {
        gallery.style.position = 'relative';
        const colors = ['#EC4899', '#FACC15', '#10E7B2', '#6D28D9'];
        for (let i = 0; i < 5; i++) {
            const c = document.createElement('div');
            c.className = 'bg-particle';
            const size = 90 + Math.random() * 100;
            c.style.width = `${size}px`;
            c.style.height = `${size}px`;
            c.style.borderRadius = '50%';
            c.style.background = colors[Math.floor(Math.random() * colors.length)];
            c.style.filter = 'blur(55px)';
            c.style.opacity = 0.08 + Math.random() * 0.05;
            c.style.left = `${10 + Math.random() * 80}%`;
            c.style.top = `${10 + Math.random() * 80}%`;
            c.style.animation = `driftSway ${14 + Math.random() * 8}s ease-in-out infinite`;
            gallery.appendChild(c);
        }
    }

    // Testimonials Section particles
    const testimonials = document.querySelector('.section-testimonials');
    if (testimonials) {
        for (let i = 0; i < 12; i++) {
            const star = document.createElement('div');
            star.className = 'bg-particle anim-twinkle';
            star.style.left = `${5 + Math.random() * 90}%`;
            star.style.top = `${10 + Math.random() * 80}%`;
            star.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            star.innerHTML = `
                <svg width="${12 + Math.random() * 10}" height="${12 + Math.random() * 10}" viewBox="0 0 24 24" class="bg-star-particle" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
            `;
            testimonials.appendChild(star);
        }
    }
}
