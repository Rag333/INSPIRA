import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth  || window.innerWidth;
    const H = mount.clientHeight || 280;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 0); // fully transparent
    mount.appendChild(renderer.domElement);

    // ── Scene + Camera ───────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 1000);
    camera.position.z = 50;

    // ── Glow sprite texture ──────────────────────────────────────────────────
    const makeSprite = (color) => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0,   color.replace(')', ', 1)').replace('rgb', 'rgba'));
      g.addColorStop(0.5, color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
      g.addColorStop(1,   color.replace(')', ', 0)').replace('rgb', 'rgba'));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(c);
    };

    // ── Particles ────────────────────────────────────────────────────────────
    const COUNT    = 120;
    const spriteDefs = [
      { color: 'rgb(239,68,68)',   count: 30 },  // red
      { color: 'rgb(168,85,247)',  count: 25 },  // purple
      { color: 'rgb(249,115,22)', count: 25 },  // orange
      { color: 'rgb(236,72,153)', count: 25 },  // pink
      { color: 'rgb(99,102,241)', count: 15 },  // indigo
    ];

    const sprites = [];
    spriteDefs.forEach(({ color, count }) => {
      const tex = makeSprite(color);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.8,
        blending: THREE.NormalBlending,
        depthWrite: false,
      });
      for (let i = 0; i < count; i++) {
        const sprite = new THREE.Sprite(mat);
        const scale  = 2 + Math.random() * 5;
        sprite.scale.set(scale, scale, 1);
        sprite.position.set(
          (Math.random() - 0.5) * 160,
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 30,
        );
        // Store velocity for floating motion
        sprite.userData.vy    = (Math.random() - 0.5) * 0.03;
        sprite.userData.vx    = (Math.random() - 0.5) * 0.015;
        sprite.userData.phase = Math.random() * Math.PI * 2;
        scene.add(sprite);
        sprites.push(sprite);
      }
    });

    // ── Mouse ───────────────────────────────────────────────────────────────
    let mx = 0, my = 0;
    const onMove = (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', onMove);

    // ── Animate ─────────────────────────────────────────────────────────────
    let raf;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t  += 0.012;

      sprites.forEach((s, i) => {
        s.position.y += Math.sin(t + s.userData.phase) * 0.04;
        s.position.x += Math.cos(t * 0.7 + s.userData.phase) * 0.02;

        // Mouse parallax — nearer particles react more
        s.position.x += mx * (0.1 + i % 3 * 0.05);
        s.position.y -= my * (0.05 + i % 2 * 0.03);

        // Wrap around
        if (s.position.x >  85) s.position.x = -85;
        if (s.position.x < -85) s.position.x =  85;
        if (s.position.y >  45) s.position.y = -45;
        if (s.position.y < -45) s.position.y =  45;
      });

      // Gentle camera drift
      camera.position.x += (mx * 3 - camera.position.x) * 0.02;
      camera.position.y += (-my * 2 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth  || window.innerWidth;
      const h = mount.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      if (mount && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    />
  );
}
