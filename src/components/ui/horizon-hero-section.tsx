"use client";

/* ==========================================================================
   HorizonHeroSection — a Three.js "cosmos" hero you scroll through.

   Three full-viewport panels sit over one fixed WebGL scene: three additive
   star fields, a shader nebula, four silhouette ridges and a fresnel
   atmosphere, rendered through an EffectComposer with UnrealBloom. Page
   scroll drives the camera between three stops; the ridges dissolve once the
   camera is deep in the field.

   How this differs from the source component it was adapted from, and why:

   - TypeScript + house motion rules (MOTION.md). The source kept scroll
     progress and the section index in React state and re-rendered the whole
     tree on every scroll event. Here scroll progress lives in a ref updated
     by ScrollTrigger, and the only DOM writes are the progress bar and the
     counter — no per-frame renders.
   - Scroll is owned by GSAP/ScrollTrigger (which Lenis already drives), so
     there is exactly one scroll pipeline on the page. The source attached
     its own window scroll listener.
   - The progress bar is animated with `scaleX` rather than `width`, so it
     never triggers layout.
   - GSAP timelines are gated on `usePrefersReducedMotion`, and the whole
     WebGL scene is skipped under reduced motion (CSS gradient + type only).
   - One rAF loop that parks itself when the tab is hidden or the scene is
     off-screen, DPR capped, bloom dropped and star count reduced on coarse
     pointers / small viewports.
   - The renderer is created per effect run on a freshly created canvas and
     fully disposed (passes, composer, renderer, context), so React Strict
     Mode's double-invoke is safe.
   - The source's "teleport the mountains to z=600000 past 70% scroll" trick
     (which also teleported the nebula with them) is replaced by an opacity
     fade over the same threshold — same intent, no popping.
   - The side menu mark is decorative and marked as such; the back link is
     supplied by the route wrapper.

   Scene geometry, camera stops and shaders follow the source values.
   ========================================================================== */

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import { HORIZON_PANELS, type HorizonPanel } from "@/lib/horizon";

gsap.registerPlugin(ScrollTrigger);

export type { HorizonPanel };
export { HORIZON_PANELS };

export interface HorizonHeroSectionProps {
  /** Panels to scroll through. Defaults to the three source panels. */
  panels?: readonly HorizonPanel[];
  /** Vertical label beside the decorative side mark. */
  brand?: string;
  /**
   * Optional link rendered at the foot of the final panel. A plain anchor
   * (not next/link) so `#fragment` and `mailto:` targets both work.
   */
  cta?: { label: string; href: string } | null;
  /**
   * `page` (default) is the standalone `/horizon` hero: a 3-viewport block
   * that owns its own ScrollTrigger. `stage` fills an absolutely-positioned
   * box instead and reads scroll progress from `progressRef`, so the homepage
   * opening scene can reuse this exact scene with one scroll pipeline.
   */
  variant?: "page" | "stage";
  /**
   * Stage mode only. The intro writes 0→1 progress (already remapped to this
   * scene) into `progressRef.current.progress`; the WebGL loop and the HUD
   * read it from the shared GSAP ticker instead of a private ScrollTrigger.
   */
  progressRef?: RefObject<{ progress: number }>;
  className?: string;
}

/* Camera stops, one per panel (the source's `cameraPositions`). */
const CAMERA_STOPS = [
  { x: 0, y: 30, z: 300 },
  { x: 0, y: 40, z: -50 },
  { x: 0, y: 50, z: -700 },
] as const;

/* Ridge layers, near → far (the source's `layers`). */
const MOUNTAIN_LAYERS = [
  { distance: -50, height: 60, color: 0x1a1a2e, opacity: 1 },
  { distance: -100, height: 80, color: 0x16213e, opacity: 0.8 },
  { distance: -150, height: 100, color: 0x0f3460, opacity: 0.6 },
  { distance: -200, height: 120, color: 0x0a4668, opacity: 0.4 },
] as const;

const STAR_COUNT = 5000;
const STAR_COUNT_LITE = 1600;
const CAMERA_EASE = 0.05;
const DPR_MAX = 1.75;
const DPR_MAX_LITE = 1.25;
/** Scroll progress at which the ridges + nebula start and finish dissolving. */
const DISSOLVE_FROM = 0.62;
const DISSOLVE_TO = 0.8;

const STAR_VERTEX = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float time;
  uniform float depth;

  void main() {
    vColor = color;
    vec3 pos = position;

    // Slow rotation based on depth
    float angle = time * 0.05 * (1.0 - depth * 0.3);
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    pos.xy = rot * pos.xy;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(vColor, opacity);
  }
`;

const NEBULA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying float vElevation;
  uniform float time;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const NEBULA_FRAGMENT = /* glsl */ `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float opacity;
  uniform float time;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
    vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);

    float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
    alpha *= 1.0 + vElevation * 0.01;

    gl_FragColor = vec4(color, alpha);
  }
`;

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float time;

  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    vec3 atmosphere = vec3(0.3, 0.6, 1.0) * intensity;

    float pulse = sin(time * 2.0) * 0.1 + 0.9;
    atmosphere *= pulse;

    gl_FragColor = vec4(atmosphere, intensity * 0.25);
  }
`;

/** Characters of a title, each its own span so GSAP can stagger them. */
function SplitChars({ text }: { text: string }) {
  return (
    <span aria-hidden="true" className="inline-flex">
      {Array.from(text).map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="horizon-char inline-block will-change-transform"
        >
          {char === " " ? "\u00a0" : char}
        </span>
      ))}
    </span>
  );
}

export function HorizonHeroSection({
  panels = HORIZON_PANELS,
  brand = "SPACE",
  cta = null,
  variant = "page",
  progressRef,
  className,
}: HorizonHeroSectionProps) {
  const isStage = variant === "stage";
  const rootRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const stageTextRef = useRef<HTMLDivElement>(null);

  const reduced = usePrefersReducedMotion();
  /* Quality tier is fixed for the life of the scene and read once, during the
     first (client-only) render — never in an effect, and never in a state
     update that would re-render the tree. */
  const [lite] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 900),
  );

  const total = Math.max(panels.length, 1);
  const lastStop = total - 1;

  /* ---- scroll progress: owned by GSAP, read by the render loop ----
     ScrollTrigger is already updated by Lenis (MotionProvider), so this
     adds no second scroll listener and no second rAF loop.

     Page mode owns its own trigger (below). Stage mode is driven from
     outside: the intro writes into `progressRef`, so this scene contributes
     no scroll listener at all and the page keeps a single scroll pipeline. */
  const internalScroll = useRef({ progress: 0 });
  const scroll = isStage ? (progressRef ?? internalScroll) : internalScroll;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || isStage) return;

    const write = (progress: number) => {
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      }
      if (counterRef.current) {
        const index = Math.min(Math.floor(progress * lastStop), lastStop);
        counterRef.current.textContent = `${String(index).padStart(2, "0")} / ${String(lastStop).padStart(2, "0")}`;
      }
    };

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        scroll.current.progress = self.progress;
        write(self.progress);
      },
      onRefresh: (self) => {
        scroll.current.progress = self.progress;
        write(self.progress);
      },
    });

    write(0);
    return () => trigger.kill();
  }, [reduced, lastStop, isStage, scroll]);

  /* ---- stage mode: mirror the injected progress into the HUD and text ----
     `gsap.ticker` is the loop Lenis already drives, so this adds no second
     rAF. Writes go straight to the DOM — no per-frame React render. */
  useEffect(() => {
    if (!isStage || reduced) return;

    let last = Number.NaN;
    const tick = () => {
      const progress = scroll.current.progress;
      if (progress === last) return;
      last = progress;

      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${progress.toFixed(4)})`;
      }
      if (counterRef.current) {
        const index = Math.min(Math.floor(progress * lastStop), lastStop);
        counterRef.current.textContent = `${String(index).padStart(2, "0")} / ${String(lastStop).padStart(2, "0")}`;
      }
      /* The scene's own type leaves before the aircraft act; the intro's CTA
         takes over from there. Under reduced motion this effect never runs
         and the static text simply stays put. */
      if (stageTextRef.current) {
        const fade = 1 - THREE.MathUtils.smoothstep(progress, 0.5, 0.88);
        stageTextRef.current.style.opacity = fade.toFixed(3);
        stageTextRef.current.style.transform = `translateY(${(-60 * (1 - fade)).toFixed(1)}px)`;
      }
    };

    gsap.ticker.add(tick);
    tick();
    return () => gsap.ticker.remove(tick);
  }, [isStage, reduced, lastStop, scroll]);

  /* ---- intro timeline ----
     Content is visible by default (rule 5): GSAP adds the "from" state at
     runtime rather than the markup starting hidden. */
  useLayoutEffect(() => {
    const root = rootRef.current;
    const menu = menuRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const hud = hudRef.current;
    if (!root || !menu || !title || !subtitle || !hud || reduced) return;

    const chars = title.querySelectorAll<HTMLElement>(".horizon-char");
    const lines = subtitle.querySelectorAll<HTMLElement>(".horizon-line");

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(menu, { x: -60, autoAlpha: 0, duration: 0.9 })
        .from(
          chars,
          { yPercent: 120, autoAlpha: 0, duration: 1.2, stagger: 0.05, ease: "power4.out" },
          "-=0.5",
        )
        .from(lines, { y: 40, autoAlpha: 0, duration: 0.9, stagger: 0.18 }, "-=0.7")
        .from(hud, { autoAlpha: 0, y: 30, duration: 0.8 }, "-=0.5");
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  /* ---- WebGL scene ---- */
  useEffect(() => {
    const root = rootRef.current;
    const holder = holderRef.current;
    if (!root || !holder || reduced) return;
    if (typeof window.WebGLRenderingContext === "undefined") return;

    /* A canvas per run: React Strict Mode invokes this effect twice in dev,
       and a canvas whose context has been lost cannot host a new renderer. */
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "absolute inset-0 h-full w-full";
    holder.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !lite,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // No WebGL: the CSS gradient under the canvas is the fallback.
      canvas.remove();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
    const [stop0] = CAMERA_STOPS;
    camera.position.set(stop0.x, stop0.y, stop0.z);
    camera.lookAt(0, 10, -600);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    let bloom: UnrealBloomPass | null = null;
    if (!lite) {
      bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.4, 0.85);
      composer.addPass(bloom);
    }

    const starCount = lite ? STAR_COUNT_LITE : STAR_COUNT;

    /* ---- star fields ---- */
    const stars: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);

      for (let j = 0; j < starCount; j++) {
        const radius = 200 + Math.random() * 800;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[j * 3 + 2] = radius * Math.cos(phi);

        const color = new THREE.Color();
        const choice = Math.random();
        if (choice < 0.7) color.setHSL(0, 0, 0.8 + Math.random() * 0.2);
        else if (choice < 0.9) color.setHSL(0.08, 0.5, 0.8);
        else color.setHSL(0.6, 0.5, 0.8);

        colors[j * 3] = color.r;
        colors[j * 3 + 1] = color.g;
        colors[j * 3 + 2] = color.b;

        sizes[j] = Math.random() * 2 + 0.5;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          depth: { value: i },
        },
        vertexShader: STAR_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const field = new THREE.Points(geometry, material);
      scene.add(field);
      stars.push(field);
    }

    /* ---- nebula ---- */
    const nebulaGeometry = new THREE.PlaneGeometry(
      8000,
      4000,
      lite ? 48 : 100,
      lite ? 48 : 100,
    );
    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x0033ff) },
        color2: { value: new THREE.Color(0xff0066) },
        opacity: { value: 0.3 },
      },
      vertexShader: NEBULA_VERTEX,
      fragmentShader: NEBULA_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    nebula.position.z = -1050;
    scene.add(nebula);

    /* ---- ridges ---- */
    const mountains: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>[] =
      [];
    for (const layer of MOUNTAIN_LAYERS) {
      const points: THREE.Vector2[] = [];
      const segments = 50;

      for (let i = 0; i <= segments; i++) {
        const x = (i / segments - 0.5) * 1000;
        const y =
          Math.sin(i * 0.1) * layer.height +
          Math.sin(i * 0.05) * layer.height * 0.5 +
          Math.random() * layer.height * 0.2 -
          100;
        points.push(new THREE.Vector2(x, y));
      }
      points.push(new THREE.Vector2(5000, -300));
      points.push(new THREE.Vector2(-5000, -300));

      const geometry = new THREE.ShapeGeometry(new THREE.Shape(points));
      const material = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.DoubleSide,
      });

      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.z = layer.distance;
      scene.add(mountain);
      mountains.push(mountain);
    }

    /* ---- atmosphere ---- */
    const atmosphereGeometry = new THREE.SphereGeometry(600, 32, 32);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    /* ---- sizing ---- */
    const resize = () => {
      /* The canvas is `fixed inset-0`, i.e. one viewport tall, so it is sized
         from the viewport — reading `root` here would size it to the whole
         3-viewport page and stretch the scene. */
      const width = holder.clientWidth || window.innerWidth;
      const height = holder.clientHeight || window.innerHeight;
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        lite ? DPR_MAX_LITE : DPR_MAX,
      );
      renderer.setPixelRatio(dpr);
      // updateStyle false: sizing comes from the CSS classes, so no inline
      // width/height is written onto the canvas.
      renderer.setSize(width, height, false);
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(holder);
    window.addEventListener("resize", resize);

    /* ---- frame loop ---- */
    const smooth: { x: number; y: number; z: number } = { x: stop0.x, y: stop0.y, z: stop0.z };
    const target: { x: number; y: number; z: number } = { x: stop0.x, y: stop0.y, z: stop0.z };
    let raf = 0;

    const draw = () => {
      const time = performance.now() * 0.001;
      const progress = scroll.current.progress;

      for (const field of stars) {
        field.material.uniforms.time.value = time;
      }

      // Camera: interpolate between stops, then ease toward it so scroll
      // momentum reads as weight rather than snapping.
      const t = progress * lastStop;
      const i = Math.min(Math.floor(t), CAMERA_STOPS.length - 1);
      const f = t - i;
      const from = CAMERA_STOPS[i];
      const to = CAMERA_STOPS[Math.min(i + 1, CAMERA_STOPS.length - 1)];
      target.x = from.x + (to.x - from.x) * f;
      target.y = from.y + (to.y - from.y) * f;
      target.z = from.z + (to.z - from.z) * f;

      smooth.x += (target.x - smooth.x) * CAMERA_EASE;
      smooth.y += (target.y - smooth.y) * CAMERA_EASE;
      smooth.z += (target.z - smooth.z) * CAMERA_EASE;

      // Subtle floating motion keeps the scene alive when the page is still.
      camera.position.set(
        smooth.x + Math.sin(time * 0.1) * 2,
        smooth.y + Math.cos(time * 0.15) * 1,
        smooth.z,
      );
      camera.lookAt(0, 10, -600);

      // Ridges and nebula dissolve as the camera leaves them behind.
      const fade =
        1 - THREE.MathUtils.smoothstep(progress, DISSOLVE_FROM, DISSOLVE_TO);
      mountains.forEach((mountain, i) => {
        const parallaxFactor = 1 + i * 0.5;
        mountain.position.x = Math.sin(time * 0.1) * 2 * parallaxFactor;
        mountain.position.y = 50 + Math.cos(time * 0.15) * parallaxFactor;
        mountain.material.opacity = MOUNTAIN_LAYERS[i].opacity * fade;
        mountain.visible = fade > 0.01;
      });
      nebulaMaterial.uniforms.time.value = time * 0.5;
      nebulaMaterial.uniforms.opacity.value = 0.3 * fade;
      atmosphereMaterial.uniforms.time.value = time;

      try {
        composer.render();
      } catch {
        /* A draw can fail mid-session (context loss, software GL in headless
           browsers). Stop drawing rather than throwing every frame — the CSS
           gradient beneath is the designed fallback. */
        stop();
      }
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    /* Park the loop when the tab is hidden or the scene is off-screen. */
    let onScreen = true;
    const sync = () => {
      if (onScreen && !document.hidden) start();
      else stop();
    };
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        sync();
      },
      { rootMargin: "120px" },
    );
    visibilityObserver.observe(root);
    document.addEventListener("visibilitychange", sync);
    start();

    return () => {
      stop();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", resize);
      resizeObserver.disconnect();

      for (const field of stars) {
        field.geometry.dispose();
        field.material.dispose();
      }
      for (const mountain of mountains) {
        mountain.geometry.dispose();
        mountain.material.dispose();
      }
      nebulaGeometry.dispose();
      nebulaMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      bloom?.dispose();
      renderPass.dispose();
      composer.dispose();
      renderer.dispose();
      try {
        renderer.forceContextLoss();
      } catch {
        /* already lost */
      }
      canvas.remove();
    };
  }, [reduced, lite, lastStop, scroll]);

  /* The scene's opening panel: brand mark, title, lines, scroll HUD. Rendered
     inside a full-height flow section in `page` mode, or inside the intro's
     held frame in `stage` mode — same elements, same animation, in both. */
  const panelZero = (
    <>
      {/* Decorative side mark. Left `aria-hidden` on purpose: the source has
          no menu behind it, and a control that does nothing is worse than a
          mark that claims nothing. */}
      <div
        ref={menuRef}
        aria-hidden="true"
        className="absolute top-8 left-6 flex flex-col items-center gap-4 sm:left-10"
      >
        <span className="grid size-11 place-items-center rounded-pill border border-line bg-surface/60 backdrop-blur-sm">
          <Menu className="size-5" strokeWidth={1.75} />
        </span>
        <span className="type-mono text-fg-subtle [writing-mode:vertical-rl]">
          {brand}
        </span>
      </div>

      <h1
        ref={titleRef}
        className="font-display text-[clamp(2.75rem,13vw,10rem)] leading-[0.92] font-bold tracking-tight uppercase"
      >
        <span className="sr-only">{panels[0]?.title}</span>
        <SplitChars text={panels[0]?.title ?? ""} />
      </h1>

      <div
        ref={subtitleRef}
        className="mt-6 max-w-[46ch] text-lead text-fg-muted"
      >
        <p className="horizon-line">{panels[0]?.line1}</p>
        <p className="horizon-line">{panels[0]?.line2}</p>
      </div>

      <div
        ref={hudRef}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5"
      >
        <span className="type-mono text-fg-subtle">Scroll</span>
        <div className="h-px w-40 bg-line">
          <div
            ref={fillRef}
            className="h-full origin-left scale-x-0 bg-accent"
          />
        </div>
        <span className="type-mono text-fg-subtle tabular-nums">
          <span ref={counterRef}>00 / {String(lastStop).padStart(2, "0")}</span>
        </span>
      </div>
    </>
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "bg-canvas text-fg",
        isStage ? "absolute inset-0 overflow-hidden" : "relative w-full",
        className,
      )}
    >
      {/* Static backdrop: the opening frame before the canvas paints, and the
          permanent fallback when WebGL is unavailable or reduced motion is on.
          Pinned to the viewport in `page` mode; filling the stage otherwise. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none z-0 bg-canvas bg-[radial-gradient(120%_80%_at_50%_115%,rgba(0,51,255,0.28),transparent_62%),radial-gradient(90%_60%_at_50%_-10%,rgba(255,0,102,0.14),transparent_70%)]",
          isStage ? "absolute inset-0" : "fixed inset-0",
        )}
      >
        <div ref={holderRef} className="absolute inset-0" />
      </div>

      {isStage ? (
        /* A single held frame. The intro fades this block out as the aircraft
           arrives, so only the opening panel is ever shown here. */
        <div ref={stageTextRef} className="absolute inset-0 z-10">
          <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
            {panelZero}
          </div>
        </div>
      ) : (
        <>
          {/* ---- panel 0 ---- */}
          <section className="relative z-10 flex h-svh flex-col items-center justify-center px-6 text-center">
            {panelZero}
          </section>

          {/* ---- remaining panels ---- */}
          {panels.slice(1).map((panel, i) => {
            const isLast = i === panels.length - 2;
            return (
              <section
                key={panel.title}
                className="relative z-10 flex h-svh flex-col items-center justify-center px-6 text-center"
              >
                <h2 className="font-display text-[clamp(2.25rem,10vw,7rem)] leading-[0.95] font-bold tracking-tight uppercase">
                  {panel.title}
                </h2>
                <div className="mt-6 max-w-[46ch] text-lead text-fg-muted">
                  <p>{panel.line1}</p>
                  <p>{panel.line2}</p>
                </div>
                {isLast && cta ? (
                  <a
                    href={cta.href}
                    className="type-mono mt-10 inline-flex items-center gap-2 rounded-pill border border-line bg-surface/60 px-4 py-2 text-fg-muted backdrop-blur-sm transition-colors duration-300 hover:border-accent/50 hover:text-fg"
                  >
                    {cta.label}
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                ) : null}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

export default HorizonHeroSection;
