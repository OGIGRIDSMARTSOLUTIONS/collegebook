import { useEffect, useRef } from 'react';

/**
 * Animated longitudinal dot surface inspired by the structured particle field
 * used in modern hero sections. It is decorative, canvas-based and dependency-free.
 */
export function DotWaveField({
  className = '',
  color = 'rgba(255,255,255,0.42)',
  dotSize = 1.45,
  density = 'normal',
  opacity = 1,
  waveStrength = 1,
  coverage = 'lower',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let pageVisible = !document.hidden;
    let lastTime = 0;
    let elapsed = 0;
    let columns = [];

    const densityMap = {
      low: 32,
      normal: 24,
      high: 19,
    };

    const rebuild = () => {
      if (!width || !height) return;

      const columnGap = densityMap[density] ?? densityMap.normal;
      const rowGap = Math.max(16, columnGap * 0.92);
      const cols = Math.ceil(width / columnGap) + 2;
      const rows = Math.ceil(Math.min(height * 0.58, 330) / rowGap) + 2;

      columns = Array.from({ length: cols }, (_, columnIndex) => {
        const x = columnIndex * columnGap - columnGap;
        return Array.from({ length: rows }, (_, rowIndex) => ({
          x,
          rowIndex,
          phase: columnIndex * 0.37 + rowIndex * 0.19,
        }));
      });
    };

    const resize = () => {
      const rect = host?.getBoundingClientRect();
      if (!rect) return;

      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
      draw(reducedMotion.matches ? 0 : elapsed);
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      if (!columns.length) return;

      const fullCoverage = coverage === 'full';
      const fieldHeight = fullCoverage ? height + 24 : Math.min(height * 0.62, 350);
      const horizon = fullCoverage ? -8 : height * 0.34;
      const motion = reducedMotion.matches ? 0 : time * 0.00055;
      const strength = waveStrength;

      for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
        const column = columns[columnIndex];
        const normalizedX = (columnIndex * 24) / Math.max(width, 1);
        const longitudinal = Math.sin(normalizedX * 5.8 + motion * 1.7) * 17 * strength;
        const longitudinal2 = Math.sin(normalizedX * 11.5 - motion * 1.05) * 7 * strength;

        for (const point of column) {
          const depth = point.rowIndex / Math.max(column.length - 1, 1);
          const baseY = horizon + depth * fieldHeight;
          const perspective = 0.25 + depth * 0.95;
          const wave = (
            Math.sin(point.phase + normalizedX * 9 + motion * 2.2) * 10
            + Math.cos(point.phase * 0.72 + normalizedX * 5 - motion * 1.35) * 5
          ) * strength * perspective;

          const x = point.x + longitudinal * depth + longitudinal2 * depth * 0.55;
          const y = baseY + wave;
          if (y < -10 || y > height + 10) continue;

          const alpha = opacity * (fullCoverage ? (0.18 + depth * 0.52) : (0.16 + depth * 0.62));
          const radius = dotSize * (0.72 + depth * 0.72);
          // Accept both rgba(...) and simple CSS colors. For rgba values we
          // calculate alpha directly; for other colors the canvas handles it.
          if (color.startsWith('rgba(')) {
            const parts = color.slice(5, -1).split(',').map((value) => value.trim());
            if (parts.length >= 3) {
              ctx.fillStyle = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
            }
          } else {
            ctx.fillStyle = color;
            ctx.globalAlpha = alpha;
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    };

    const frame = (time) => {
      if (!lastTime) lastTime = time;
      elapsed += Math.min(time - lastTime, 50);
      lastTime = time;
      draw(elapsed);
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      lastTime = 0;
    };

    const start = () => {
      if (raf || reducedMotion.matches || !visible || !pageVisible) return;
      raf = requestAnimationFrame(frame);
    };

    const updateMotion = () => {
      stop();
      draw(elapsed);
      start();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.01 },
    );

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host || canvas);
    observer.observe(canvas);

    const onVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else stop();
    };

    const onMotionChange = () => updateMotion();
    const motionListener = reducedMotion.addEventListener
      ? (event) => onMotionChange(event)
      : null;

    document.addEventListener('visibilitychange', onVisibilityChange);
    if (motionListener) reducedMotion.addEventListener('change', motionListener);

    resize();
    if (!reducedMotion.matches) start();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (motionListener) reducedMotion.removeEventListener('change', motionListener);
    };
  }, [color, density, dotSize, opacity, waveStrength, coverage]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
