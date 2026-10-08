"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";

/* ==========================================================================
   ShaderCanvas — the Lab's "Shader Experiment" demo (04).

   A self-contained WebGL plasma field running the current site accent. This
   file is only ever imported through next/dynamic({ ssr: false }) because OGL
   is a browser-only dependency.

   Resilience (same contract as AuroraField):
     - Reduced motion or a missing WebGL context -> nothing renders, and the
       CSS gradient the lab panel paints beneath the canvas stays visible.
     - A frame that fails to draw (context lost, software GL) stops the loop
       instead of throwing every frame.
     - The loop pauses while the canvas is off-screen.
   ========================================================================== */

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uRes;
  uniform vec3  uAccent;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    p.x *= uRes.x / max(uRes.y, 1.0);

    float t = uTime * 0.5;

    // Standing waves + a radial core keep it readable inside a small panel.
    float wave = sin(p.x * 3.0 + t) * 0.5 + sin(p.y * 2.4 - t * 1.25) * 0.5;
    float d = length(p * vec2(0.85, 1.5));
    float field = sin(d * 5.0 - t * 2.2 + wave * 2.0) * 0.5 + 0.5;

    // Cool surrounds shift toward the accent at the core.
    vec3 cool = vec3(uAccent.b, uAccent.g * 0.45, uAccent.r * 0.85) * 0.5;
    vec3 color = mix(cool, uAccent, field);
    color += vec3(0.02) * wave;

    float alpha = smoothstep(1.15, 0.25, d) * 0.9;
    gl_FragColor = vec4(color, alpha);
  }
`;

function readAccentRGB(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  return raw || "#3d6cf2";
}

export default function ShaderCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, 1.75),
        premultipliedAlpha: false,
        powerPreference: "low-power",
      });
    } catch {
      return; // No WebGL: the CSS gradient beneath stays visible.
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: [1, 1] },
        uAccent: { value: new Color(readAccentRGB()) },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let visible = true;
    let raf = 0;
    const startedAt = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      renderer.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setSize(width, height);
      program.uniforms.uRes.value = [width, height];
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    window.addEventListener("resize", resize);

    // Accent can change with the theme; follow it cheaply on each documented
    // breakpoint rather than polling in the loop.
    const themeObserver = new MutationObserver(() => {
      program.uniforms.uAccent.value = new Color(readAccentRGB());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { rootMargin: "120px 0px" },
    );
    visibilityObserver.observe(canvas);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      program.uniforms.uTime.value = (performance.now() - startedAt) / 1000;
      try {
        renderer.render({ scene: mesh });
      } catch {
        cancelAnimationFrame(raf);
        return;
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}