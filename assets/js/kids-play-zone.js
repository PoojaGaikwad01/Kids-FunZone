document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.getElementById('playZoneGame');
    const canvas = document.getElementById('playZoneCanvas');
    const scoreEl = document.getElementById('playZoneScoreValue');
    if (!wrap || !canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const BALLOON_COUNT = 8;
    const balloonColors = ['#FF6B9A', '#4F8EF7', '#FFC83D', '#53D8B5', '#8B6CFF', '#FF9F1C', '#10E7B2'];

    let width = 0;
    let height = 0;
    let score = 0;
    let balloons = [];
    let particles = [];

    const cat = { x: 0, y: 0, targetX: 0, targetY: 0, radius: 26 };

    function resize() {
        const rect = wrap.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (cat.x === 0 && cat.y === 0) {
            cat.x = cat.targetX = width / 2;
            cat.y = cat.targetY = height / 2;
        }
        balloons.forEach((b) => {
            if (b.x > width) b.x = Math.max(b.r, width - b.r);
        });
    }

    function randomBalloon(fromBottom) {
        const r = 22 + Math.random() * 12;
        return {
            x: r + Math.random() * Math.max(1, width - r * 2),
            y: fromBottom ? height + r + Math.random() * height * 0.6 : Math.random() * height,
            r,
            color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
            speed: 0.6 + Math.random() * 0.9,
            phase: Math.random() * Math.PI * 2,
            sway: 12 + Math.random() * 18
        };
    }

    function initBalloons() {
        balloons = [];
        for (let i = 0; i < BALLOON_COUNT; i++) {
            balloons.push(randomBalloon(false));
        }
    }

    // ── Synthesized pop sound (no external audio asset needed) ──
    let audioCtx = null;
    function ensureAudio() {
        if (!audioCtx) {
            try {
                const AudioCtor = window.AudioContext || window.webkitAudioContext;
                if (AudioCtor) audioCtx = new AudioCtor();
            } catch (e) { /* audio unsupported, fail silently */ }
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }
    function playPop() {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(560, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
    }

    function spawnParticles(x, y, color) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
            const speed = 1.5 + Math.random() * 2.6;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1,
                decay: 0.018 + Math.random() * 0.02,
                size: 3 + Math.random() * 3,
                color: Math.random() > 0.5 ? color : '#FFFFFF',
                shape: Math.random() > 0.5 ? 'circle' : 'sparkle'
            });
        }
    }

    function popBalloon(index) {
        const b = balloons[index];
        score++;
        scoreEl.textContent = String(score);
        spawnParticles(b.x, b.y, b.color);
        playPop();
        balloons[index] = randomBalloon(true);
    }

    function drawBalloon(b, sway) {
        const x = b.x + sway;
        const y = b.y;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, y, b.r * 0.82, b.r, 0, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - b.r * 0.3, y - b.r * 0.4, b.r * 0.1, x, y, b.r);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.28, b.color);
        grad.addColorStop(1, b.color);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x - 4, y + b.r - 2);
        ctx.lineTo(x + 4, y + b.r - 2);
        ctx.lineTo(x, y + b.r + 6);
        ctx.closePath();
        ctx.fillStyle = b.color;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, y + b.r + 6);
        ctx.quadraticCurveTo(x - 6, y + b.r + 20, x, y + b.r + 34);
        ctx.strokeStyle = 'rgba(90,100,110,0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
    }

    function drawParticle(p) {
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.translate(p.x, p.y);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -p.size * 1.8);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    // Original, simplified blue robo-cat mascot (not a reproduction of any copyrighted character)
    function drawCat(x, y) {
        const r = cat.radius;
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#2E79F5';
        ctx.beginPath();
        ctx.moveTo(-r * 0.75, -r * 0.55);
        ctx.lineTo(-r * 0.95, -r * 1.25);
        ctx.lineTo(-r * 0.25, -r * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.75, -r * 0.55);
        ctx.lineTo(r * 0.95, -r * 1.25);
        ctx.lineTo(r * 0.25, -r * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = '#2E79F5';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, r * 0.18, r * 0.78, r * 0.68, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.ellipse(-r * 0.28, -r * 0.05, r * 0.09, r * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.28, -r * 0.05, r * 0.09, r * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF3B76';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.18, r * 0.11, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = Math.max(1.2, r * 0.04);
        ctx.beginPath();
        ctx.moveTo(0, r * 0.26);
        ctx.quadraticCurveTo(-r * 0.18, r * 0.42, -r * 0.32, r * 0.3);
        ctx.moveTo(0, r * 0.26);
        ctx.quadraticCurveTo(r * 0.18, r * 0.42, r * 0.32, r * 0.3);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(30,41,59,0.55)';
        ctx.lineWidth = 1;
        [-1, 1].forEach((side) => {
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(side * r * 0.55, r * 0.2 + i * r * 0.08);
                ctx.lineTo(side * r * 1.05, r * 0.14 + i * r * 0.12);
                ctx.stroke();
            }
        });

        ctx.restore();
    }

    function tick() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < balloons.length; i++) {
            const b = balloons[i];
            b.y -= b.speed;

            if (b.y + b.r < -40) {
                balloons[i] = randomBalloon(true);
                continue;
            }

            const sway = Math.sin(performance.now() * 0.002 + b.phase) * (b.sway * 0.15);
            const dx = (b.x + sway) - cat.x;
            const dy = b.y - cat.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < b.r + cat.radius) {
                popBalloon(i);
                continue;
            }

            drawBalloon(b, sway);
        }

        // Safety net: the game should never run empty of balloons
        while (balloons.length < BALLOON_COUNT) {
            balloons.push(randomBalloon(true));
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= p.decay;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            drawParticle(p);
        }

        cat.x += (cat.targetX - cat.x) * 0.18;
        cat.y += (cat.targetY - cat.y) * 0.18;
        drawCat(cat.x, cat.y);

        requestAnimationFrame(tick);
    }

    function setTargetFromPoint(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        cat.targetX = Math.min(Math.max(clientX - rect.left, cat.radius), Math.max(cat.radius, width - cat.radius));
        cat.targetY = Math.min(Math.max(clientY - rect.top, cat.radius), Math.max(cat.radius, height - cat.radius));
    }

    canvas.addEventListener('mousemove', (e) => {
        ensureAudio();
        setTargetFromPoint(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
        ensureAudio();
        if (e.touches.length > 0) {
            setTargetFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            setTargetFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        }
        e.preventDefault();
    }, { passive: false });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    resize();
    initBalloons();
    requestAnimationFrame(tick);
});
