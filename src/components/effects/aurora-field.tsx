"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Color } from "ogl";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";

/* ==========================================================================
   AuroraField — one persistent OGL canvas for the whole page.

   Why OGL and not three/R3F: this is a single full-screen triangle running a
   fragment shader. OGL does that in ~7 KB with no scene graph, no renderer
   overhead and no second React reconciler. A heavier stack would be dead
   weight for a background.

   Uniforms:
     uTime   ambient drift
     uMouse  cursor influence, damped
     uScroll 0..1 page progress, shifts the colour field's vertical bias
     uAccent accent colour as rgb 0..1

   Performance rules:
     - Renders at devicePixelRatio capped to 1.75.
     - Idle for 1.2s while the tab is hidden or the canvas is off-screen →
       the rAF loop stops entirely.
     - Skipped entirely under prefers-reduced-motion, and on coarse pointers
       with a small viewport (mobile) where a static CSS gradient is used
       instead.
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
  uniform float uScroll;
  uniform vec2  uMouse;
  uniform vec3  uAccent;
  uniform float uIntensity;

  // Cheap value noise — enough for organic drift, far cheaper than simplex.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv;

    // Aspect-correct so the field doesn't stretch on wide monitors.
    p.x *= 1.6;

    float t = uTime * 0.055;
    p.y += uScroll * 0.65;
    p += uMouse * 0.14;

    float n1 = fbm(p * 1.6 + vec2(t, t * 0.6));
    float n2 = fbm(p * 2.4 - vec2(t * 0.8, t * 0.35));

    // Domain warp — the single trick that makes this read as a gradient mesh
    // rather than a blur.
    vec2 warp = vec2(n1, n2);
    float field = fbm(p * 2.1 + warp * 0.9 + vec2(0.0, t * 0.4));

    // Radial falloff keeps the centre dense and the edges calm so text
    // always has somewhere quiet to sit.
    float dist = distance(uv, vec2(0.5, 0.46));
    float falloff = smoothstep(0.92, 0.12, dist);

    float density = smoothstep(0.34, 0.86, field) * falloff;

    // Derivative of the accent, shifted toward magenta in the outer field.
    vec3 warm = uAccent;
    vec3 cool = vec3(uAccent.b, uAccent.g * 0.55, uAccent.r * 0.85);
    vec3 tint = mix(cool, warm, smoothstep(0.2, 0.9, field));

    vec3 color = tint * density * uIntensity;

    // Faint scanline tooth so the field reads as a rendered surface.
    color += vec3(0.012) * sin(uv.y * 900.0) * density;

    float alpha = clamp(density * 1.15, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const int = parseInt(full, 16);
  return [
    ((int >> 16) & 255) / 255,
    ((int >> 8) & 255) / 255,
    (int & 255) / 255,
  ];
}

type AuroraFieldProps = {
  /** CSS colour of the field. Read from the theme so it tracks light/dark. */
  accentVar?: string;
  intensity?: number;
  className?: string;
  /** Scroll progress source. Left out, the field simply ignores scroll. */
  interactive?: boolean;
};

export default function AuroraField({
  accentVar = "--color-signal-500",
  intensity = 1,
  className,
  interactive = true,
}: AuroraFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Coarse pointer + small viewport: the shader is not worth the battery.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && window.innerWidth < 900) return;

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

    const accent = new Color(hexToRgb(readAccent()));

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
        uAccent: { value: accent },
        uIntensity: { value: intensity },
      },
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    /* ---- input ---- */
    const pointer = { x: 0.5, y: 0.5 };
    const smoothed = { x: 0.5, y: 0.5 };
    const scroll = { value: 0 };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth;
      pointer.y = 1 - event.clientY / window.innerHeight;
    };
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scroll.value = max > 0 ? window.scrollY / max : 0;
    };

    if (interactive) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    /* ---- visibility: stop the loop when nobody is looking ---- */
    let visible = true;
    let lastInteraction = performance.now();
    const startedAt = performance.now();
    let raf = 0;

    const markInteraction = () => {
      lastInteraction = performance.now();
    };
    window.addEventListener("pointermove", markInteraction, { passive: true });
    window.addEventListener("scroll", markInteraction, { passive: true });

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;

      // The field is ambient: after 4s with no input we stop drawing. The
      // last frame stays on screen, which is exactly what we want.
      if (now - lastInteraction > 4000 && now - startedAt > 2000) return;

      program.uniforms.uTime.value = (now - startedAt) / 1000;
      smoothed.x += (pointer.x - smoothed.x) * 0.045;
      smoothed.y += (pointer.y - smoothed.y) * 0.045;
      program.uniforms.uMouse.value = [smoothed.x, smoothed.y];
      program.uniforms.uScroll.value +=
        (scroll.value - program.uniforms.uScroll.value) * 0.06;

      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Theme switch: recolour in place rather than remounting the canvas.
    const themeObserver = new MutationObserver(() => {
      const next = hexToRgb(readAccent());
      program.uniforms.uAccent.value = [next[0], next[1], next[2]];
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    /* ---- sizing ----
       OGL's Renderer constructor calls setSize() using the canvas element's
       own default attribute size (300x150) and writes that to the element's
       INLINE style. Inline style outranks the h-full/w-full classes, so
       without an explicit setSize here the field renders as a 300x150 patch
       in the top-left corner of the hero instead of filling it.

       setSize() takes CSS pixels and multiplies by dpr internally for the
       backing store, which is exactly what we want to pass. */
    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      renderer.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setSize(width, height);
    };
    resize();

    // A ResizeObserver also catches container resizes, not just window
    // resizes, so the field tracks the hero rather than the viewport.
    const resizeObserver = new ResizeObserver(resize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointermove", markInteraction);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", markInteraction);
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      themeObserver.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };

    function readAccent() {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(accentVar)
        .trim();
      return raw || "#f5410f";
    }
  }, [accentVar, intensity, interactive, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? "pointer-events-none absolute inset-0 h-full w-full"}
    />
  );
}
