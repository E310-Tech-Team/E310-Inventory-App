"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface DeviceTopologyCanvasProps {
  className?: string;
  nodeCount?: number;
  activeStatus?: "healthy" | "busy" | "alert";
}

export function DeviceTopologyCanvas({
  className = "",
  nodeCount = 28,
  activeStatus = "healthy",
}: DeviceTopologyCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      // Graceful fallback if WebGL unavailable
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold network topology
    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    // Color definitions
    const primaryColor =
      activeStatus === "alert"
        ? 0xf43f5e // rose
        : activeStatus === "busy"
        ? 0xf59e0b // amber
        : 0x10b981; // emerald

    const secondaryColor = 0x38bdf8; // sky

    // Node geometry & points
    const geometry = new THREE.IcosahedronGeometry(7, 1);
    const positions = geometry.attributes.position.array as Float32Array;
    const verticesCount = positions.length / 3;

    // Node spheres
    const nodeGeometry = new THREE.SphereGeometry(0.32, 12, 12);
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.85,
    });

    const instancedNodes = new THREE.InstancedMesh(
      nodeGeometry,
      nodeMaterial,
      verticesCount
    );

    const dummy = new THREE.Object3D();
    for (let i = 0; i < verticesCount; i++) {
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      dummy.updateMatrix();
      instancedNodes.setMatrixAt(i, dummy.matrix);
    }
    networkGroup.add(instancedNodes);

    // Wireframe edges
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.28,
    });
    const lines = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    networkGroup.add(lines);

    // Central pulsing core
    const coreGeometry = new THREE.OctahedronGeometry(2.5, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    networkGroup.add(core);

    // Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 0.8;
      targetY = y * 0.8;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Render loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Group rotation
      networkGroup.rotation.y = elapsedTime * 0.15 + mouseX;
      networkGroup.rotation.x = Math.sin(elapsedTime * 0.1) * 0.2 + mouseY;

      // Core pulse
      const scale = 1 + Math.sin(elapsedTime * 2) * 0.08;
      core.scale.set(scale, scale, scale);
      core.rotation.y = -elapsedTime * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
    };
  }, [nodeCount, activeStatus]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[220px] pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
