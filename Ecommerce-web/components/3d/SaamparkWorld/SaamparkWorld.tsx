'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './SaamparkWorld.module.css';

interface SaamparkWorldProps {
  interactive?: boolean;
  className?: string;
}

export function SaamparkWorld({ interactive = true, className = '' }: SaamparkWorldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b1220, 0.035);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 2. Lighting Setup (Cinematic Dual-Division Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // STR Electric Blue Light
    const strLight = new THREE.PointLight(0x2563eb, 2.8, 30);
    strLight.position.set(-8, 6, 8);
    scene.add(strLight);

    // SCS Tomato Red Light
    const scsLight = new THREE.PointLight(0xeb412c, 2.5, 30);
    scsLight.position.set(8, -5, 7);
    scene.add(scsLight);

    // Dynamic Cursor Spotlight
    const cursorLight = new THREE.PointLight(0x06b6d4, 1.8, 22);
    cursorLight.position.set(0, 0, 10);
    scene.add(cursorLight);

    // 3. Procedural Architectural Digital Structure
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // A. Central Crystalline Architectural Core
    const coreGeo = new THREE.IcosahedronGeometry(2.4, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b1220,
      emissive: 0x111827,
      roughness: 0.2,
      metalness: 0.85,
      transmission: 0.4,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    worldGroup.add(coreMesh);

    // Wireframe overlay for technical engineering precision (STR)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(coreGeo, wireMat);
    wireMesh.scale.setScalar(1.02);
    worldGroup.add(wireMesh);

    // B. Dual Orbital Rings (STR & SCS Connectivity)
    // Ring 1: STR (Electric Blue)
    const ring1Geo = new THREE.TorusGeometry(4.2, 0.04, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI * 0.35;
    ring1.rotation.y = Math.PI * 0.15;
    worldGroup.add(ring1);

    // Ring 2: SCS (Violet)
    const ring2Geo = new THREE.TorusGeometry(5.4, 0.035, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x7655e8,
      emissive: 0x7655e8,
      emissiveIntensity: 0.65,
      metalness: 0.9,
      roughness: 0.1,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI * 0.25;
    ring2.rotation.z = Math.PI * 0.3;
    worldGroup.add(ring2);

    // C. Architectural Monolith Pillars (Representing Enterprise Infrastructure)
    const pillarsCount = 14;
    const pillarGeo = new THREE.BoxGeometry(0.35, 2.8, 0.35);
    const pillarMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.25,
      reflectivity: 0.9,
      clearcoat: 0.5,
    });

    const pillarsGroup = new THREE.Group();
    for (let i = 0; i < pillarsCount; i++) {
      const angle = (i / pillarsCount) * Math.PI * 2;
      const radius = 6.8 + (i % 3) * 0.8;
      const pMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pMesh.position.set(
        Math.cos(angle) * radius,
        (Math.sin(angle * 2) * 1.5),
        Math.sin(angle) * radius
      );
      pMesh.rotation.y = -angle;
      pMesh.rotation.z = Math.sin(angle) * 0.2;
      pMesh.scale.set(1, 0.6 + (i % 4) * 0.35, 1);
      pillarsGroup.add(pMesh);
    }
    worldGroup.add(pillarsGroup);

    // D. Soft Atmospheric Constellation Particles
    const particleCount = prefersReducedMotion ? 120 : 380;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cBlue = new THREE.Color(0x2563eb);
    const cCyan = new THREE.Color(0x06b6d4);
    const cSCS = new THREE.Color(0xeb412c);
    const cViolet = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 32;
      positions[i3 + 1] = (Math.random() - 0.5) * 24;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;

      const pickColor = Math.random();
      const col = pickColor < 0.45 ? cBlue : pickColor < 0.75 ? cCyan : cViolet;
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 4. Mouse and Scroll Interaction Physics
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = 0;
    let targetScrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 5. Render Loop with Smooth Damping
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      scrollY += (targetScrollY - scrollY) * 0.06;

      if (!prefersReducedMotion) {
        // Core subtle rotation
        coreMesh.rotation.y = elapsedTime * 0.12;
        coreMesh.rotation.x = Math.sin(elapsedTime * 0.15) * 0.15;
        wireMesh.rotation.y = -elapsedTime * 0.16;

        // Orbital ring rotation
        ring1.rotation.z = elapsedTime * 0.18;
        ring2.rotation.y = -elapsedTime * 0.14;

        // Pillars gentle drift
        pillarsGroup.rotation.y = -elapsedTime * 0.04;

        // Atmospheric particle wave
        particleSystem.rotation.y = elapsedTime * 0.02;
      }

      // Camera parallax & scroll travel
      const scrollFactor = Math.min(scrollY * 0.003, 8);
      camera.position.x = mouseX * 2.2;
      camera.position.y = mouseY * 1.5 - scrollFactor * 0.35;
      camera.position.z = 16 - scrollFactor * 0.8;
      camera.lookAt(0, -scrollFactor * 0.15, 0);

      // Cursor light follow
      cursorLight.position.x = mouseX * 12;
      cursorLight.position.y = mouseY * 8;

      renderer.render(scene, camera);
    };

    animate();

    // 6. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js resources
      coreGeo.dispose();
      coreMat.dispose();
      wireMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      pillarGeo.dispose();
      pillarMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [interactive]);

  return (
    <div ref={containerRef} className={`${styles.canvasContainer} ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.webglCanvas} />
      <div className={styles.atmosphericVignette} />
    </div>
  );
}
