import React, { useEffect, useRef } from 'react';
import './AnimatedBackground.css';

const AnimatedBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particlesArray: Particle[] = [];
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const mouse = {
            x: undefined as number | undefined,
            y: undefined as number | undefined,
            // Increased interaction radius
            radius: 150
        };

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            init();
        };

        const handleMouseMove = (event: MouseEvent) => {
            mouse.x = event.x;
            mouse.y = event.y;
        };

        const handleMouseOut = () => {
            mouse.x = undefined;
            mouse.y = undefined;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);

        class Particle {
            x: number;
            y: number;
            directionX: number;
            directionY: number;
            size: number;
            color: string;
            baseX: number;
            baseY: number;
            density: number;

            constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
                this.x = x;
                this.y = y;
                this.baseX = x;
                this.baseY = y;
                this.directionX = directionX;
                this.directionY = directionY;
                this.size = size;
                this.color = color;
                this.density = (Math.random() * 30) + 1;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx.fillStyle = this.color;
                // Premium glow effect
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            update() {
                if (this.x > w || this.x < 0) this.directionX = -this.directionX;
                if (this.y > h || this.y < 0) this.directionY = -this.directionY;

                let dx = (mouse.x || -1000) - this.x;
                let dy = (mouse.y || -1000) - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;

                if (distance < mouse.radius) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    // Slow return to movement track
                    if (this.x !== this.baseX) {
                        let dx = this.x - this.baseX;
                        this.x -= dx / 10;
                    }
                    if (this.y !== this.baseY) {
                        let dy = this.y - this.baseY;
                        this.y -= dy / 10;
                    }
                }

                // Continuous organic drift
                this.baseX += this.directionX * 0.3;
                this.baseY += this.directionY * 0.3;

                // Loop around edges organically
                if (this.baseX > w || this.baseX < 0) this.directionX = -this.directionX;
                if (this.baseY > h || this.baseY < 0) this.directionY = -this.directionY;

                this.draw();
            }
        }

        function init() {
            particlesArray = [];
            let numberOfParticles = (h * w) / 10000;
            for (let i = 0; i < numberOfParticles; i++) {
                let size = (Math.random() * 2) + 1;
                let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
                let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
                let directionX = (Math.random() * 2) - 1;
                let directionY = (Math.random() * 2) - 1;
                let color = '#a78bfa'; // Soft purple glow
                particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
            }
        }

        function connect() {
            let opacityValue = 1;
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                        ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                    if (distance < (w / 7) * (h / 7)) {
                        opacityValue = 1 - (distance / 20000);
                        if (!ctx) return;
                        // Dynamic premium line colors
                        ctx.strokeStyle = `rgba(139, 92, 246, ${opacityValue * 0.4})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        let animationFrameId: number;
        function animate() {
            if (!ctx) return;
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, w, h);

            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
            }
            connect();
        }

        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <div className="gradient-base-bg">
                <div className="gradient-orb orb-primary"></div>
                <div className="gradient-orb orb-secondary"></div>
            </div>
            <canvas ref={canvasRef} id="interactive-canvas"></canvas>
            <div className="grain-overlay"></div>
        </>
    );
};

export default AnimatedBackground;
