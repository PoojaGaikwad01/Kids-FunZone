document.addEventListener('DOMContentLoaded', () => {
    // ── Setup Configuration ──
    const container = document.querySelector('.balloon-interactive-canvas');
    const childWrapper = document.querySelector('.interactive-child-wrapper');
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Signage/Sign brand colors - calibrated to soft light pastels
    const colors = [
        { main: '#FFA6C9', border: '#E88AA9' }, // Light Pastel Pink
        { main: '#ADE1FF', border: '#8FC9E8' }, // Light Pastel Sky Blue
        { main: '#B2EFA0', border: '#95D184' }, // Light Pastel Lime Green
        { main: '#FFF3A8', border: '#E4D489' }, // Light Pastel Sunny Yellow
        { main: '#FFCCA3', border: '#E8AF87' }, // Light Pastel Peach/Orange
        { main: '#D1C4E9', border: '#B39DDB' }, // Light Pastel Lavender
        { main: '#B2EBF2', border: '#80DEEA' }, // Light Pastel Mint/Cyan
        { main: '#F8BBD0', border: '#F48FB1' }  // Light Pastel Rose
    ];

    const balloonCount = prefersReducedMotion ? 4 : 10;
    const balloons = [];
    let mouseX = -1000;
    let mouseY = -1000;

    // Track SVG elements of the child character
    const childArmLeft = document.getElementById('child-left-arm');
    const childArmRight = document.getElementById('child-right-arm');
    const childHead = document.getElementById('child-head');
    const childEyesOpen = document.getElementById('child-eyes-open');
    const childEyesBlink = document.getElementById('child-eyes-blink');
    const childChar = document.getElementById('child-character');

    // ── Generate Balloons ──
    const containerWidth = container.offsetWidth || window.innerWidth;
    const containerHeight = container.offsetHeight || window.innerHeight;

    for (let i = 0; i < balloonCount; i++) {
        createBalloon(true); // Initial load disperses balloons vertically
    }

    function createBalloon(initial = false) {
        const balloonEl = document.createElement('div');
        balloonEl.className = 'interactive-balloon';

        const colorSet = colors[Math.floor(Math.random() * colors.length)];
        const scale = 0.7 + Math.random() * 0.6; // Variable sizes (50px to 110px)
        const baseWidth = 80 * scale;
        const baseHeight = 96 * scale;

        balloonEl.style.width = `${baseWidth}px`;
        balloonEl.style.height = `${baseHeight}px`;
        balloonEl.style.background = `radial-gradient(circle at 30% 30%, #FFFFFF -20%, ${colorSet.main} 60%, ${colorSet.border} 100%)`;
        balloonEl.style.borderColor = colorSet.border;

        // Custom Knot element
        const knot = document.createElement('div');
        knot.className = 'interactive-balloon-knot';
        knot.style.borderBottomColor = colorSet.main;
        balloonEl.appendChild(knot);

        // SVG Thread string line
        const threadSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        threadSvg.setAttribute('class', 'interactive-balloon-thread');
        threadSvg.setAttribute('width', '30');
        threadSvg.setAttribute('height', '120');
        threadSvg.style.left = '50%';
        threadSvg.style.transform = 'translateX(-50%)';
        threadSvg.style.top = `${baseHeight}px`;

        const threadPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        threadPath.setAttribute('d', 'M 15 0 Q 10 30 15 60 T 15 120');
        threadPath.setAttribute('stroke', 'rgba(120, 130, 140, 0.45)');
        threadPath.setAttribute('stroke-width', '1.5');
        threadPath.setAttribute('fill', 'none');
        threadSvg.appendChild(threadPath);
        balloonEl.appendChild(threadSvg);

        container.appendChild(balloonEl);

        // Physical details for animation loop
        const data = {
            element: balloonEl,
            path: threadPath,
            width: baseWidth,
            height: baseHeight,
            x: Math.random() * (containerWidth - baseWidth),
            y: initial ? (Math.random() * (containerHeight - 200) + 50) : (containerHeight + 150),
            vx: 0,
            vy: 0,
            baseSpeedY: -(0.5 + Math.random() * 0.8), // Floating upwards speeds
            swayOffset: Math.random() * 100,
            swaySpeed: 0.01 + Math.random() * 0.02,
            swayRange: 10 + Math.random() * 20,
            repelVx: 0,
            repelVy: 0,
            color: colorSet.main
        };

        balloons.push(data);

        // Click / Touch particle effect trigger
        balloonEl.addEventListener('click', (e) => triggerBurst(e, data));
        balloonEl.addEventListener('touchstart', (e) => {
            triggerBurst(e.touches[0], data);
        });
    }

    function triggerBurst(e, data) {
        const clientX = e.clientX || e.pageX;
        const clientY = e.clientY || e.pageY;
        const rect = container.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        // Sparkle / Confetti Burst (GSAP animation)
        const burstCount = 12;
        for (let j = 0; j < burstCount; j++) {
            const particle = document.createElement('div');
            const isSparkle = Math.random() > 0.4;
            particle.className = isSparkle ? 'sparkle-particle' : 'confetti-particle';
            
            // Random color selection
            const randomColor = colors[Math.floor(Math.random() * colors.length)].main;
            particle.style.backgroundColor = randomColor;
            particle.style.left = `${relativeX}px`;
            particle.style.top = `${relativeY}px`;

            container.appendChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 110;
            const targetX = relativeX + Math.cos(angle) * distance;
            const targetY = relativeY + Math.sin(angle) * distance;

            gsap.to(particle, {
                x: targetX - relativeX,
                y: targetY - relativeY,
                rotation: Math.random() * 360,
                scale: 0,
                opacity: 0,
                duration: 0.6 + Math.random() * 0.6,
                ease: 'power2.out',
                onComplete: () => {
                    particle.remove();
                }
            });
        }

        // Slight push-down bounce on clicked balloon
        data.repelVy = 5;
    }

    // ── Interaction Physics Loop (60 FPS) ──
    let tickCount = 0;
    function updatePhysics() {
        tickCount++;
        const currentWidth = container.offsetWidth || window.innerWidth;
        const currentHeight = container.offsetHeight || window.innerHeight;

        balloons.forEach((b) => {
            // Apply wind sway
            const sway = Math.sin(tickCount * b.swaySpeed + b.swayOffset) * b.swayRange * 0.05;
            b.x += sway;

            // Apply upward buoyancy
            b.y += b.baseSpeedY + b.repelVy;

            // Mouse Repulsion Force calculation
            if (mouseX !== -1000 && mouseY !== -1000) {
                const balloonCenterX = b.x + b.width / 2;
                const balloonCenterY = b.y + b.height / 2;

                const dx = balloonCenterX - mouseX;
                const dy = balloonCenterY - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const limit = 130; // Repulsion active zone limit

                if (distance < limit && !prefersReducedMotion) {
                    const force = (limit - distance) / limit; // Stronger force when closer
                    const angle = Math.atan2(dy, dx);
                    const pushX = Math.cos(angle) * force * 4.5;
                    const pushY = Math.sin(angle) * force * 4.5;

                    b.repelVx += pushX;
                    b.repelVy += pushY;
                }
            }

            // Apply velocity damping (friction)
            b.x += b.repelVx;
            b.repelVx *= 0.88;
            b.repelVy *= 0.88;

            // Boundary restrictions & screen wrapping
            if (b.x < -b.width) b.x = currentWidth;
            if (b.x > currentWidth) b.x = -b.width;

            // Wrap from top to bottom continuously
            if (b.y < -b.height - 120) {
                b.y = currentHeight + 150;
                b.x = Math.random() * (currentWidth - b.width);
                b.vx = 0;
                b.vy = 0;
                b.repelVx = 0;
                b.repelVy = 0;
            }

            // Apply position styling
            b.element.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;

            // Thread sway animation
            const threadSway = Math.sin(tickCount * 0.05 + b.swayOffset) * 8;
            b.path.setAttribute('d', `M 15 0 Q ${10 + threadSway} 30 15 60 T 15 120`);
        });

        requestAnimationFrame(updatePhysics);
    }
    
    // Start physics loop
    requestAnimationFrame(updatePhysics);

    // ── Mouse & Touch Event Tracking ──
    const handlePointerMove = (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    };

    const handlePointerLeave = () => {
        mouseX = -1000;
        mouseY = -1000;
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', handlePointerLeave);
    container.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            handlePointerMove(e.touches[0]);
        }
    });
    container.addEventListener('touchend', handlePointerLeave);


    // ── Child Character GSAP Timelines ──
    if (childChar && !prefersReducedMotion) {
        // Initial setup anchors
        gsap.set(childArmLeft, { transformOrigin: '25px 125px' });
        gsap.set(childArmRight, { transformOrigin: '75px 125px' });
        gsap.set(childHead, { transformOrigin: '50px 115px' });
        gsap.set(childEyesBlink, { opacity: 0 });

        // Blink Cycle (randomly triggers every 3-5 seconds)
        function blinkEyes() {
            const tl = gsap.timeline({
                onComplete: () => {
                    setTimeout(blinkEyes, 2500 + Math.random() * 3000);
                }
            });
            tl.to(childEyesOpen, { opacity: 0, duration: 0.1 })
              .to(childEyesBlink, { opacity: 1, duration: 0.1 }, '<')
              .to(childEyesOpen, { opacity: 1, duration: 0.1 }, '+=0.15')
              .to(childEyesBlink, { opacity: 0, duration: 0.1 }, '<');
        }
        setTimeout(blinkEyes, 1500);

        // Head Tilting Cycle (continuous)
        gsap.to(childHead, {
            rotation: 'random(-6, 6)',
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        // Reaching and Grabbing cycle towards closest balloon
        function playReachCycles() {
            if (balloons.length === 0) return;

            // Find closest balloon to the child
            let closestB = null;
            let minDist = 999999;
            const childCenterX = childWrapper.offsetLeft + 100;
            const childCenterY = childWrapper.offsetTop + 150;

            balloons.forEach(b => {
                const dx = b.x - childCenterX;
                const dy = b.y - childCenterY;
                const d = Math.sqrt(dx*dx + dy*dy);
                if (d < minDist) {
                    minDist = d;
                    closestB = b;
                }
            });

            if (closestB && minDist < 350) {
                // Reach arm toward that direction
                const dy = closestB.y - childCenterY;
                const dx = closestB.x - childCenterX;
                const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) - 90; // Relative rotation adjustment
                const rotateLeft = Math.max(-120, Math.min(10, targetAngle));
                const rotateRight = Math.max(-10, Math.min(120, targetAngle + 180));

                gsap.to(childArmLeft, { rotation: rotateLeft, duration: 0.8, ease: 'power1.out' });
                gsap.to(childArmRight, { rotation: rotateRight, duration: 0.8, ease: 'power1.out' });
            } else {
                // Idle sway arms
                gsap.to(childArmLeft, { rotation: 'random(-15, 5)', duration: 1.5, ease: 'sine.inOut' });
                gsap.to(childArmRight, { rotation: 'random(-5, 15)', duration: 1.5, ease: 'sine.inOut' });
            }

            setTimeout(playReachCycles, 2500 + Math.random() * 2000);
        }
        setTimeout(playReachCycles, 2000);

        // Excited jumping grab sequence (every 6-8 seconds)
        function triggerExcitedJump() {
            const tl = gsap.timeline({
                onComplete: () => {
                    setTimeout(triggerExcitedJump, 6000 + Math.random() * 3000);
                }
            });

            tl.to(childChar, { scaleY: 0.82, scaleX: 1.06, y: 5, duration: 0.25, ease: 'power1.in' }) // Bend down
              .to([childArmLeft, childArmRight], { rotation: -130, duration: 0.2 }, '<') // Wind arms
              .to(childChar, { scaleY: 1.1, scaleX: 0.92, y: -90, duration: 0.45, ease: 'power2.out' }) // Launch Jump
              .to(childArmLeft, { rotation: -160, duration: 0.35, ease: 'power2.out' }, '<') // Reach left high
              .to(childArmRight, { rotation: 160, duration: 0.35, ease: 'power2.out' }, '<') // Reach right high
              .to(childHead, { rotation: -15, duration: 0.3, ease: 'power2.out' }, '<') // Head up
              .to(childChar, { scaleY: 0.95, scaleX: 1.05, y: 10, duration: 0.3, ease: 'power2.in' }) // Land bend
              .to([childArmLeft, childArmRight], { rotation: 0, duration: 0.3, ease: 'power2.in' }, '<') // Lower arms
              .to(childChar, { scaleY: 1, scaleX: 1, y: 0, duration: 0.2, ease: 'power1.out' }); // Recover
        }
        setTimeout(triggerExcitedJump, 5000);
    }
});
