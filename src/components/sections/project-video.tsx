"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/components/animations/motion-primitives";
import { cn } from "@/lib/utils";
import { ProjectSignature } from "./project-signature";

/* ==========================================================================
   ProjectVideo — the case study's primary visual, when a real recording exists.

   WHY THIS REPLACES THE STILL
   A screenshot is a claim about a product. A screen recording is the product.
   Nothing here is generated: `src` is a file the owner put in `public/`, and
   every number on screen (duration, elapsed time) is read from the decoder.

   LOADING — the part that actually matters
   The element renders with NO `src` at all until it is within 200% of the
   viewport, so opening a case study costs zero video bytes. Only then is the
   source attached, and even then `preload="none"` means the browser fetches
   nothing until playback is actually requested. The `poster` fills the
   reserved box throughout, so the layout never shifts and the page is fully
   legible with JS disabled.

   The box is a fixed 16:9 with `object-contain` and a site-coloured gradient
   behind it. Both current recordings are 16:9 to within 0.3% (1.774 and
   1.778), and `object-contain` means a future recording of any shape letterboxes
   into that gradient rather than being stretched or cropped. This mirrors the
   fit-don't-crop decision already made in ProjectFrame, so the two media
   surfaces behave the same way.

   CONTROLS
   Custom rather than `controls`, because the brief asks for a designed player.
   That choice is only defensible if the replacement is genuinely accessible,
   so: every control is a real <button>, the scrubber is a real range input
   (keyboard, touch and screen-reader behaviour for free), the frame is a
   focusable group with the standard shortcuts, and the fullscreen state is
   mirrored to `aria-pressed`. What native controls would have given up —
   captions — is not replaced with a guess; see the note on the component.

   MOTION OWNERSHIP
   Nothing here uses GSAP or ScrollTrigger. The block entrance is the page's
   own `Reveal`; every animation in this file is a discrete UI state driven by
   a CSS transition. That keeps one owner per property, per MOTION.md.

   `prefers-reduced-motion` disables the hover preview and the settle, and the
   controls behave exactly as they otherwise would.
   ========================================================================== */

/**
 * Only one recording plays at a time.
 *
 * A case study shows one video, but the pattern has to survive a future
 * gallery, and two clips talking over each other is the kind of bug nobody
 * reports and everybody notices. Module scope, not context: this is a media
 * policy, not React state.
 */
type Player = { stop: () => void };
let activePlayer: Player | null = null;

function claimPlayback(player: Player) {
  if (activePlayer && activePlayer !== player) activePlayer.stop();
  activePlayer = player;
}
function releasePlayback(player: Player) {
  if (activePlayer === player) activePlayer = null;
}

/**
 * The element's type comes from the response header, not from an attribute:
 * React's `type` prop belongs to `<source>`, and a `src` on the media element
 * is what makes the late attach (below) reliable, because React setting and
 * clearing that attribute is guaranteed to trigger a load, whereas swapping
 * `<source>` children after mount is not.
 */

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

type ProjectVideoProps = {
  /** Path or full URL to the recording. */
  src: string;
  /** Still frame shown before playback and while nothing is buffered. */
  poster?: string | null;
  title: string;
  /** Mono label above the frame. */
  label?: string;
  className?: string;
};

export function ProjectVideo({
  src,
  poster,
  title,
  label = "Demo",
  className,
}: ProjectVideoProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rangeRef = useRef<HTMLInputElement | null>(null);

  /**
   * The scrubber's id, for its visually-hidden <label>.
   *
   * Derived from `useId` rather than from `src`: a src-derived id embeds the
   * whole URL, so it carries slashes (legitimate in HTML but a trap in a
   * selector) and would repeat if a case study ever showed the same recording
   * twice.
   */
  const seekId = `seek-${useId()}`;

  const reduced = usePrefersReducedMotion();

  /** Has the source been attached yet? Gates every byte of video. */
  const [armed, setArmed] = useState(false);
  /** Metadata has arrived, so duration is real and the scrubber is live. */
  const [duration, setDuration] = useState(0);
  /** Whole seconds only — the fine-grained value never re-renders React. */
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [failed, setFailed] = useState(false);
  /** Once the visitor has deliberately played, hover stops interfering. */
  const [committed, setCommitted] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const hasAudio = !failed;
  const showPlayOverlay = !playing && !failed;

  /* ---------------------------------------------------------------------
     Lazy attach. rootMargin 200% means the file is queued a little before it
     is needed but long after the page has settled, which is the trade that
     makes a 3 MB recording invisible to first paint.
     --------------------------------------------------------------------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || armed) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer means the video would never arm, so release it on the next
      // task. Deferred rather than immediate: a synchronous setState in an
      // effect body cascades a render before the browser has painted, and
      // there is no reason to withhold the file for a microtask here.
      const id = window.setTimeout(() => setArmed(true), 0);
      return () => window.clearTimeout(id);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "200% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  /* ---------------------------------------------------------------------
     A recording nobody is looking at is wasted battery and data. Pause it
     when it leaves the viewport — but never reset, so coming back resumes
     where the visitor actually was.
     --------------------------------------------------------------------- */
  useEffect(() => {
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video || !armed) return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          if (committed) void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed, committed]);

  /* Release the global player slot on unmount, or a navigation away from a
     playing case study leaves audio running with no visible element. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const player: Player = {
      stop: () => {
        video.pause();
      },
    };
    return () => {
      video.pause();
      releasePlayback(player);
    };
  }, []);

  /* Fullscreen is a browser-level state change; the class does not fire for
     Escape in older WebKit, so listen to the events rather than trusting the
     click that caused them. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => {
      setFullscreen(
        document.fullscreenElement !== null ||
          // @ts-expect-error — legacy WebKit prefixed API
          Boolean(document.webkitFullscreenElement),
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  /* Muted is driven imperatively, never through the JSX attribute: browsers
     gate autoplay on the *property* at the moment play() is called, and React
     re-applying the attribute on re-render can land after the call. */
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  /* ---------------------------------------------------------------------
     Hover preview: a muted, from-the-top playthrough, so the visitor sees the
     product move before deciding to commit to it. Pointer-gated, because on
     touch there is no hover and a video that starts by itself is startling.
     Once committed, hover never touches playback again.
     --------------------------------------------------------------------- */
  const startPreview = useCallback(() => {
    const video = videoRef.current;
    if (!video || committed || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    video.muted = true;
    if (video.currentTime > 0.4) video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, [committed, reduced]);

  const endPreview = useCallback(() => {
    const video = videoRef.current;
    if (!video || committed || reduced) return;
    video.pause();
    video.currentTime = 0;
  }, [committed, reduced]);

  /* ---------------------------------------------------------------------
     Committed playback
     --------------------------------------------------------------------- */
  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    setCommitted(true);
    // A deliberate press is a user gesture, so unmuting is allowed here and
    // the visitor hears the narration the recording was made with.
    video.muted = false;
    setMuted(false);
    claimPlayback({
      stop: () => {
        video.pause();
      },
    });
    void video.play().catch(() => {
      // Autoplay refused: leave the poster up rather than a half-started clip.
      setPlaying(false);
    });
  }, [failed]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    if (video.paused) play();
    else pause();
  }, [failed, pause, play]);

  const seek = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(value)) return;

    /* Refuse to seek until the timeline actually exists.
       With `preload="none"` the duration is NaN until playback is first
       requested, and assigning `currentTime` in that window parks the element
       at 0 — so an arrow-key press before pressing play would silently rewind
       to the start instead of doing nothing. */
    const total = video.duration;
    if (!Number.isFinite(total) || total <= 0) return;

    const next = Math.min(Math.max(value, 0), total);
    video.currentTime = next;
    setElapsed(Math.floor(next));
    const range = rangeRef.current;
    if (range) {
      range.value = String(next);
      range.style.setProperty("--played", `${(next / total) * 100}%`);
    }
  }, []);

  const onScrub = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      seek(Number(event.target.value));
    },
    [seek],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      const video = videoRef.current;
      if (video) video.muted = next;
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }
    // @ts-expect-error — legacy WebKit prefixed API
    if (document.webkitFullscreenElement) {
      // @ts-expect-error — legacy WebKit prefixed API
      void document.webkitExitFullscreen?.();
      return;
    }
    if (wrap.requestFullscreen) {
      void wrap.requestFullscreen().catch(() => undefined);
    } else if (video) {
      // iPhone only offers fullscreen on the media element itself, through a
      // prefixed API that predates the standard and is not in the DOM lib.
      const legacy = video as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      legacy.webkitEnterFullscreen?.();
    }
  }, []);

  /* ---------------------------------------------------------------------
     Timekeeping. `timeupdate` fires about four times a second, which is too
     often to re-render React but too rare to interpolate by hand. So the
     progress fill is written straight to the DOM as a custom property and
     only the whole-second label goes through state.
     --------------------------------------------------------------------- */
  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    const range = rangeRef.current;
    if (!video) return;
    const range_ = video.duration;
    if (range && Number.isFinite(range_)) {
      range.style.setProperty(
        "--played",
        `${range_ ? (video.currentTime / range_) * 100 : 0}%`,
      );
    }
    const whole = Math.floor(video.currentTime);
    setElapsed((prev) => (prev === whole ? prev : whole));
  }, []);

  /* Controls fade while playing, but never while they hold focus — hiding a
     focused control is an accessibility failure, not a flourish. */
  const [pointerIdle, setPointerIdle] = useState(false);
  useEffect(() => {
    if (!playing || !pointerIdle || reduced) return;
    const id = window.setTimeout(() => setChromeVisible(false), 2400);
    return () => window.clearTimeout(id);
  }, [playing, pointerIdle, reduced]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      // The range input owns its own arrow keys.
      if (target.tagName === "INPUT") return;
      const video = videoRef.current;
      if (!video) return;

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          event.preventDefault();
          toggle();
          break;
        case "ArrowLeft":
          event.preventDefault();
          seek(Math.max(0, video.currentTime - 5));
          break;
        case "ArrowRight":
          event.preventDefault();
          seek(Math.min(video.duration || 0, video.currentTime + 5));
          break;
        case "m":
        case "M":
          event.preventDefault();
          toggleMute();
          break;
        case "f":
        case "F":
          event.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    },
    [seek, toggle, toggleFullscreen, toggleMute],
  );

  /* ==========================================================================
     Render
     ========================================================================== */

  if (failed) {
    /* The file is missing, truncated, or a codec this browser cannot decode.
       Falling back to the signature keeps the page composed, and the note
       says what is actually wrong instead of pretending a video is there. */
    return (
      <div className={cn("gutter shell", className)}>
        <div className="relative aspect-video w-full overflow-hidden rounded-card border border-line">
          <ProjectSignature seed={src} title={title} className="absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <p className="type-mono max-w-[44ch] text-center leading-relaxed text-fg-muted">
              The demo recording for {title} could not be played in this
              browser. Re-upload it, or add a still to the project to stand in
              for it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("gutter shell", className)}>
      {/* header: what this is, and its real length */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="type-mono text-accent">{label}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span className="type-mono text-fg-subtle tabular-nums">
          {duration ? formatTime(duration) : "—"}
        </span>
      </div>

      <div
        ref={wrapRef}
        data-video-frame=""
        tabIndex={0}
        role="group"
        aria-label={`${title} demo recording. Space to play or pause, arrow keys to seek, M to mute, F for fullscreen.`}
        onKeyDown={onKeyDown}
        onPointerEnter={() => {
          setPointerIdle(false);
          setChromeVisible(true);
          startPreview();
        }}
        onPointerLeave={() => {
          setPointerIdle(true);
          endPreview();
        }}
        onPointerMove={() => {
          setChromeVisible(true);
          setPointerIdle(false);
        }}
        onFocus={() => setChromeVisible(true)}
        className={cn(
          "group/video relative isolate w-full cursor-pointer rounded-card",
          "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        )}
      >
        {/* Glow. Sits behind the frame, and is the only thing that changes on
            hover besides the border — enough to feel alive, not enough to
            compete with the recording. */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-x-6 -bottom-8 -top-4 -z-10 rounded-[2.5rem] bg-accent/22 blur-3xl",
            "opacity-0 transition-opacity duration-700 group-hover/video:opacity-100",
            "group-focus-within/video:opacity-100",
          )}
        />

        <div
          onClick={toggle}
          className={cn(
            "relative aspect-video w-full overflow-hidden rounded-card border border-line",
            "border-sweep bg-surface transition-[border-color,box-shadow] duration-500",
            "group-hover/video:border-accent/45",
            "group-focus-within/video:border-accent/45",
            "group-focus-within/video:shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent),0_30px_80px_-40px_color-mix(in_oklab,var(--accent)_60%,transparent)]",
          )}
        >
          {/* Letterbox fill. Anything outside a non-16:9 recording lands on
              site colour rather than on dead black. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,color-mix(in_oklab,var(--accent)_10%,transparent),transparent_62%)]"
          />

          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 size-full object-contain",
              // Entrance: settles from a hair large and bright. One discrete
              // transition, triggered once, then left alone.
              !reduced &&
                "motion-safe:[transition:opacity_900ms_cubic-bezier(0.16,1,0.3,1),transform_1100ms_cubic-bezier(0.16,1,0.3,1)]",
              armed
                ? "scale-100 opacity-100"
                : "scale-[1.045] opacity-0",
            )}
            /* `src` appears only once the frame is near the viewport. Until
               then this element is a poster with no media behind it. */
            src={armed ? src : undefined}
            poster={poster ?? undefined}
            preload="none"
            playsInline
            /* no `controls`: the bar below replaces them, accessibly. */
            onLoadedMetadata={(event) => {
              const el = event.currentTarget;
              if (Number.isFinite(el.duration)) setDuration(el.duration);
            }}
            onTimeUpdate={onTimeUpdate}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setFailed(true)}
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
          >
            Your browser cannot play this recording. The project is still
            described in full on this page.
          </video>

          {/* ---- play affordance ---- */}
          {showPlayOverlay ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                play();
              }}
              aria-label={`Play the ${title} demo recording`}
              className={cn(
                "absolute inset-0 z-10 flex items-center justify-center",
                "bg-gradient-to-t from-ink-950/70 via-ink-950/15 to-ink-950/40",
                "transition-opacity duration-500",
                playing ? "opacity-0" : "opacity-100",
              )}
            >
              <span className="relative flex size-[clamp(3.75rem,9vw,5.5rem)] items-center justify-center">
                {/* pulse ring — decoration, hidden from assistive tech */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 rounded-pill border border-accent/60",
                    !reduced && "animate-[pulse-ring_2.6s_ease-out_infinite]",
                  )}
                />
                <span className="relative flex size-[clamp(3rem,7vw,4.25rem)] items-center justify-center rounded-pill bg-accent text-accent-fg shadow-[0_10px_40px_-12px_color-mix(in_oklab,var(--accent)_85%,transparent)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/video:scale-105">
                  <Play
                    className="ml-0.5 size-[38%] fill-current"
                    strokeWidth={0}
                    aria-hidden="true"
                  />
                </span>
              </span>
            </button>
          ) : null}

          {/* ---- controls ---- */}
          <div
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "absolute inset-x-0 bottom-0 z-10",
              "bg-gradient-to-t from-ink-950/92 via-ink-950/55 to-transparent",
              "px-3 pb-3 pt-10 sm:px-4 sm:pb-4",
              "transition-opacity duration-500",
              chromeVisible ? "opacity-100" : "opacity-0",
              // Never hidden from someone who cannot hover to bring it back.
              "pointer-events-none group-hover/video:pointer-events-auto group-focus-within/video:pointer-events-auto",
              chromeVisible ? "pointer-events-auto" : "",
            )}
          >
            <label className="sr-only" htmlFor={seekId}>
              Seek within the {title} recording
            </label>
            <input
              id={seekId}
              ref={rangeRef}
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(elapsed, duration || 0)}
              onChange={onScrub}
              disabled={!duration}
              aria-valuetext={`${formatTime(elapsed)} of ${formatTime(duration)}`}
              className={cn(
                "video-range mb-3 block h-1.5 w-full cursor-pointer appearance-none rounded-pill",
                "bg-[linear-gradient(to_right,var(--accent)_0_var(--played,0%),var(--line-strong)_var(--played,0%)_100%)]",
                "disabled:cursor-default",
                "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-pill",
                "[&::-webkit-slider-thumb]:bg-fg [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_var(--accent)]",
                "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-pill [&::-moz-range-thumb]:border-0",
                "[&::-moz-range-thumb]:bg-fg [&::-moz-range-thumb]:shadow-[0_0_0_1px_var(--accent)]",
                "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
              )}
            />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <ControlButton
                onClick={toggle}
                label={playing ? "Pause" : "Play"}
                pressed={playing}
              >
                {playing ? (
                  <Pause className="size-4 fill-current" strokeWidth={0} aria-hidden="true" />
                ) : (
                  <Play className="ml-0.5 size-4 fill-current" strokeWidth={0} aria-hidden="true" />
                )}
              </ControlButton>

              {hasAudio ? (
                <ControlButton
                  onClick={toggleMute}
                  label={muted ? "Unmute" : "Mute"}
                  pressed={muted}
                >
                  {muted ? (
                    <VolumeX className="size-4" strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Volume2 className="size-4" strokeWidth={2} aria-hidden="true" />
                  )}
                </ControlButton>
              ) : null}

              <span
                className="type-mono ml-1 text-[0.75rem] tabular-nums text-fg-muted"
                aria-live="off"
              >
                {formatTime(elapsed)}
                <span aria-hidden="true" className="px-1 text-fg-subtle">
                  /
                </span>
                {duration ? formatTime(duration) : "—"}
              </span>

              <ControlButton
                onClick={toggleFullscreen}
                label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                pressed={fullscreen}
                className="ml-auto"
              >
                {fullscreen ? (
                  <Minimize2 className="size-4" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Maximize2 className="size-4" strokeWidth={2} aria-hidden="true" />
                )}
              </ControlButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ControlButton({
  onClick,
  label,
  pressed,
  children,
  className,
}: {
  onClick: () => void;
  label: string;
  /** Reflects toggle state for assistive tech. */
  pressed?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        // 44px hit area, 32px visual — a touch target that respects phones
        // without a control bar that looks built for a mouse.
        "flex size-11 items-center justify-center rounded-pill text-fg",
        "transition-colors duration-300 hover:bg-fg/10 hover:text-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}
