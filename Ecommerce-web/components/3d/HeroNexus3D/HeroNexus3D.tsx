'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import styles from './HeroNexus3D.module.css';

interface HeroNexus3DProps {
  activeDivision?: 'str' | 'scs';
}

export function HeroNexus3D({ activeDivision = 'str' }: HeroNexus3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const activeDivisionRef = useRef(activeDivision);

  useEffect(() => {
    activeDivisionRef.current = activeDivision;
  }, [activeDivision]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect initial theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 260;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    // 2. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.5 : 2.0);
    dirLight.position.set(4, 5, 6);
    scene.add(dirLight);

    const strColorHex = isDark ? 0xd9dadc : 0x9caf88; // Silver in dark, Sage in light
    const scsColorHex = isDark ? 0xffc93c : 0xeb412c; // Yellow in dark, Tomato Red in light

    const strPointLight = new THREE.PointLight(strColorHex, isDark ? 2.5 : 2.0, 10);
    strPointLight.position.set(-1.8, 0.5, 2);
    scene.add(strPointLight);

    const scsPointLight = new THREE.PointLight(scsColorHex, 3, 10);
    scsPointLight.position.set(1.8, 0.5, 2);
    scene.add(scsPointLight);

    // ─────────────────────────────────────────────────────────────
    // A. STR ENGINEERING CORE (Left Architecture: Sage/Silver in Light, Silver in Dark)
    // ─────────────────────────────────────────────────────────────
    const strGroup = new THREE.Group();
    strGroup.position.set(-1.45, 0, 0);

    // 1. Outer Icosahedron Wireframe
    const icoGeom = new THREE.IcosahedronGeometry(0.85, 1);
    const icoWireMat = new THREE.MeshBasicMaterial({
      color: strColorHex,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.6 : 0.5,
    });
    const strWireframe = new THREE.Mesh(icoGeom, icoWireMat);
    strGroup.add(strWireframe);

    // 2. Inner Crystal Polyhedron
    const innerGeom = new THREE.DodecahedronGeometry(0.55, 0);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x2b2d31 : 0x9caf88,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    });
    const strInnerCrystal = new THREE.Mesh(innerGeom, innerMat);
    strGroup.add(strInnerCrystal);

    // 3. Dual Orbital Rings
    const ringGeom1 = new THREE.TorusGeometry(1.15, 0.02, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: strColorHex,
      transparent: true,
      opacity: 0.6,
    });
    const strRing1 = new THREE.Mesh(ringGeom1, ringMat1);
    strRing1.rotation.x = Math.PI / 3;
    strGroup.add(strRing1);

    const ringGeom2 = new THREE.TorusGeometry(1.3, 0.015, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Lime neon touchup
      transparent: true,
      opacity: 0.45,
    });
    const strRing2 = new THREE.Mesh(ringGeom2, ringMat2);
    strRing2.rotation.y = Math.PI / 4;
    strGroup.add(strRing2);

    scene.add(strGroup);

    // ─────────────────────────────────────────────────────────────
    // B. SCS STRATEGY & GROWTH CORE (Right Architecture: Tomato Red / Sage in Light, Yellow / Silver in Dark)
    // ─────────────────────────────────────────────────────────────
    const scsGroup = new THREE.Group();
    scsGroup.position.set(1.45, 0, 0);

    // 1. Outer Gyroscope Torus Knot
    const knotGeom = new THREE.TorusKnotGeometry(0.65, 0.12, 64, 16, 2, 3);
    const knotMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0xd9dadc : 0x9caf88, // Silver in dark, Sage in light
      metalness: isDark ? 0.9 : 0.4,
      roughness: isDark ? 0.2 : 0.3,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.5 : 0.4,
    });
    const scsKnot = new THREE.Mesh(knotGeom, knotMat);
    scsGroup.add(scsKnot);

    // 2. Inner Gemstone Sphere
    const gemGeom = new THREE.OctahedronGeometry(0.55, 1);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: scsColorHex, // Tomato Red #EB412C in light, Yellow #FFC93C in dark
      metalness: 0.7,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const scsGem = new THREE.Mesh(gemGeom, gemMat);
    scsGroup.add(scsGem);

    // 3. SCS Orbital Ring
    const scsRingGeom = new THREE.TorusGeometry(1.2, 0.02, 16, 64);
    const scsRingMat = new THREE.MeshBasicMaterial({
      color: scsColorHex,
      transparent: true,
      opacity: 0.6,
    });
    const scsRing = new THREE.Mesh(scsRingGeom, scsRingMat);
    scsRing.rotation.x = -Math.PI / 4;
    scsGroup.add(scsRing);

    scene.add(scsGroup);

    // ─────────────────────────────────────────────────────────────
    // C. SYNAPTIC CONNECTING ENERGY CURVES
    // ─────────────────────────────────────────────────────────────
    const curvePoints1 = [
      new THREE.Vector3(-1.45, 0, 0),
      new THREE.Vector3(-0.6, 0.5, 0.3),
      new THREE.Vector3(0.6, -0.4, -0.2),
      new THREE.Vector3(1.45, 0, 0),
    ];
    const curve1 = new THREE.CatmullRomCurve3(curvePoints1);
    const curveGeom1 = new THREE.TubeGeometry(curve1, 40, 0.015, 8, false);
    const curveMat1 = new THREE.MeshBasicMaterial({
      color: strColorHex,
      transparent: true,
      opacity: 0.45,
    });
    const bridgeTube1 = new THREE.Mesh(curveGeom1, curveMat1);
    scene.add(bridgeTube1);

    const curvePoints2 = [
      new THREE.Vector3(-1.45, 0, 0),
      new THREE.Vector3(-0.5, -0.6, -0.3),
      new THREE.Vector3(0.5, 0.5, 0.2),
      new THREE.Vector3(1.45, 0, 0),
    ];
    const curve2 = new THREE.CatmullRomCurve3(curvePoints2);
    const curveGeom2 = new THREE.TubeGeometry(curve2, 40, 0.015, 8, false);
    const curveMat2 = new THREE.MeshBasicMaterial({
      color: scsColorHex,
      transparent: true,
      opacity: 0.45,
    });
    const bridgeTube2 = new THREE.Mesh(curveGeom2, curveMat2);
    scene.add(bridgeTube2);

    // ─────────────────────────────────────────────────────────────
    // D. 39 FLOATING SERVICE NODES (Star Constellation)
    // ─────────────────────────────────────────────────────────────
    const nodeCount = 39;
    const nodeGeom = new THREE.SphereGeometry(0.045, 12, 12);
    const nodeInstances = new THREE.Group();

    const nodeData: Array<{
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
      speed: number;
      phase: number;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      const isTechNode = i < 21; // 21 STR services, 18 SCS services
      const mat = new THREE.MeshBasicMaterial({
        color: isTechNode ? strColorHex : scsColorHex,
        transparent: true,
        opacity: 0.85,
      });

      const nodeMesh = new THREE.Mesh(nodeGeom, mat);

      // Distribute in spatial cloud around the corresponding division core
      const center = isTechNode ? new THREE.Vector3(-1.45, 0, 0) : new THREE.Vector3(1.45, 0, 0);
      const angle = (i / nodeCount) * Math.PI * 4;
      const radius = 0.95 + Math.random() * 0.7;
      const zOffset = (Math.random() - 0.5) * 1.2;

      const baseX = center.x + Math.cos(angle) * radius;
      const baseY = center.y + Math.sin(angle) * (radius * 0.6);
      const baseZ = center.z + zOffset;

      nodeMesh.position.set(baseX, baseY, baseZ);
      nodeInstances.add(nodeMesh);

      nodeData.push({
        mesh: nodeMesh,
        baseX,
        baseY,
        baseZ,
        speed: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }

    scene.add(nodeInstances);

    // ─────────────────────────────────────────────────────────────
    // E. MOUSE INTERACTION & TARGET LERP
    // ─────────────────────────────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x * 0.45;
      mouseY = y * 0.35;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Theme mutation observer to update colors dynamically
    const observer = new MutationObserver(() => {
      const darkNow = document.documentElement.getAttribute('data-theme') === 'dark';
      const updatedSCSHex = darkNow ? 0xffc93c : 0xeb412c;
      
      gemMat.color.setHex(updatedSCSHex);
      scsRingMat.color.setHex(updatedSCSHex);
      curveMat2.color.setHex(updatedSCSHex);
      scsPointLight.color.setHex(updatedSCSHex);
      knotMat.color.setHex(darkNow ? 0xd9dadc : 0x9caf88);

      nodeData.forEach((item, idx) => {
        if (idx >= 21) {
          (item.mesh.material as THREE.MeshBasicMaterial).color.setHex(updatedSCSHex);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // ─────────────────────────────────────────────────────────────
    // F. ANIMATION LOOP (120 FPS Capable with Smooth Interpolation)
    // ─────────────────────────────────────────────────────────────
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // 1. Rotate STR Core
      strWireframe.rotation.x += 0.007;
      strWireframe.rotation.y += 0.01;
      strInnerCrystal.rotation.y -= 0.012;
      strRing1.rotation.z += 0.015;
      strRing2.rotation.z -= 0.012;

      // 2. Rotate SCS Core
      scsKnot.rotation.x += 0.008;
      scsKnot.rotation.y += 0.009;
      scsGem.rotation.y -= 0.015;
      scsRing.rotation.z -= 0.014;

      // 3. Animate 39 Service Nodes
      nodeData.forEach(node => {
        const t = elapsedTime * node.speed + node.phase;
        node.mesh.position.y = node.baseY + Math.sin(t) * 0.08;
        node.mesh.position.x = node.baseX + Math.cos(t * 0.7) * 0.05;
        const scalePulse = 1 + Math.sin(t * 2) * 0.15;
        node.mesh.scale.set(scalePulse, scalePulse, scalePulse);
      });

      // 4. Smooth Camera Lerp according to activeDivision tab and mouse
      const activeDiv = activeDivisionRef.current;
      if (activeDiv === 'str') {
        targetCameraX = -0.75 + mouseX;
        targetCameraY = mouseY;
      } else if (activeDiv === 'scs') {
        targetCameraX = 0.75 + mouseX;
        targetCameraY = mouseY;
      } else {
        targetCameraX = mouseX;
        targetCameraY = mouseY;
      }

      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y += (targetCameraY - camera.position.y) * 0.05;
      camera.lookAt(targetCameraX * 0.3, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // ─────────────────────────────────────────────────────────────
    // G. CLEANUP ON UNMOUNT
    // ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
      resizeObserver.disconnect();

      // Dispose Three.js objects
      icoGeom.dispose();
      icoWireMat.dispose();
      innerGeom.dispose();
      innerMat.dispose();
      ringGeom1.dispose();
      ringMat1.dispose();
      ringGeom2.dispose();
      ringMat2.dispose();
      knotGeom.dispose();
      knotMat.dispose();
      gemGeom.dispose();
      gemMat.dispose();
      scsRingGeom.dispose();
      scsRingMat.dispose();
      curveGeom1.dispose();
      curveMat1.dispose();
      curveGeom2.dispose();
      curveMat2.dispose();
      nodeGeom.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={styles.canvasContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Saampark 3D Digital Nexus World"
    >
      {/* 3D Telemetry HUD Overlay */}
      <span className={styles.fpsBadge}>60-120 FPS</span>
    </div>
  );
}
