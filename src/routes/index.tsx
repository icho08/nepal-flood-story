import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CHAPTERS } from "@/lib/narration";
import { getNarrationAudio } from "@/lib/tts.functions";

const Scene = lazy(() => import("@/components/flood/Scene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rasuwa Flood 2026 — A 3D Story of Nepal's Bhote Koshi Surge" },
      {
        name: "description",
        content:
          "An animated 3D explainer of the 26 August 2026 Rasuwa flood: the Lhende Khola ice avalanche, the natural dam that broke, and the valleys it destroyed.",
      },
      { property: "og:title", content: "Rasuwa Flood 2026 — A 3D Story" },
      {
        property: "og:description",
        content:
          "How an ice avalanche dammed a Himalayan river and then let go, sending a flood through Rasuwagadhi, Timure and Syabrubesi.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FloodStory,
});

function FloodStory() {
  const progress = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const playingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef(new Map<string, string>());
  const fetchAudio = useServerFn(getNarrationAudio);

  useEffect(() => setMounted(true), []);

  /* progress + chapter tracking ------------------------------------ */
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      progress.current = p;
      const idx = Math.min(
        CHAPTERS.length - 1,
        Math.round(p * (CHAPTERS.length - 1)),
      );
      if (idx !== last) {
        last = idx;
        setChapter(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setNarrating(false);
  }, []);

  const speak = useCallback(
    async (index: number) => {
      const ch = CHAPTERS[index];
      if (!ch) return;
      setVoiceError(null);
      setNarrating(true);
      try {
        let src = cache.current.get(ch.id);
        if (!src) {
          const res = await fetchAudio({ data: { chapterId: ch.id } });
          src = `data:audio/mpeg;base64,${res.audio}`;
          cache.current.set(ch.id, src);
        }
        stopAudio();
        const audio = new Audio(src);
        audioRef.current = audio;
        setNarrating(true);
        audio.onended = () => {
          if (audioRef.current !== audio) return;
          setNarrating(false);
          if (playingRef.current) {
            const next = index + 1;
            if (next < CHAPTERS.length) {
              scrollToChapter(next);
              void speak(next);
            } else {
              playingRef.current = false;
              setPlaying(false);
            }
          }
        };
        await audio.play();
      } catch (err) {
        setNarrating(false);
        setVoiceError(err instanceof Error ? err.message : "Narration failed");
      }
    },
    [fetchAudio, stopAudio],
  );

  const scrollToChapter = (index: number) => {
    const max = document.body.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: (index / (CHAPTERS.length - 1)) * max,
      behavior: "smooth",
    });
  };

  const togglePlay = () => {
    if (playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
      stopAudio();
      return;
    }
    playingRef.current = true;
    setPlaying(true);
    scrollToChapter(chapter);
    void speak(chapter);
  };

  const narrateCurrent = () => {
    if (narrating) {
      stopAudio();
      return;
    }
    void speak(chapter);
  };

  const active = CHAPTERS[chapter]!;

  return (
    <main className="relative">
      {/* 3D stage */}
      <div className="fixed inset-0 -z-10 bg-background">
        {mounted && (
          <Suspense fallback={null}>
            <Scene progress={progress} />
          </Suspense>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[var(--gradient-vignette)]" />
      </div>

      {/* Fixed narrative panel */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 p-5 md:p-10">
        <div className="pointer-events-auto max-w-xl rounded-xl border border-border/70 bg-card/80 p-6 backdrop-blur-md shadow-[var(--shadow-deep)]">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            {active.kicker}
          </p>
          <h2 className="mt-3 font-display text-2xl leading-tight text-foreground md:text-3xl">
            {active.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            {active.body}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={togglePlay}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              {playing ? "Stop cinematic" : "Play cinematic + voiceover"}
            </button>
            <button
              onClick={narrateCurrent}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              {narrating ? "Mute narration" : "Narrate this chapter"}
            </button>
            <span className="font-mono text-xs text-muted-foreground">
              {chapter + 1} / {CHAPTERS.length}
            </span>
          </div>
          {voiceError && (
            <p className="mt-3 text-xs text-destructive">{voiceError}</p>
          )}
        </div>
      </div>

      {/* Chapter rail */}
      <nav className="fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            aria-label={c.title}
            onClick={() => {
              scrollToChapter(i);
              if (playingRef.current || narrating) void speak(i);
            }}
            className={`h-2.5 w-2.5 rounded-full border transition ${
              i === chapter
                ? "scale-125 border-accent bg-accent"
                : "border-border bg-transparent hover:bg-border"
            }`}
          />
        ))}
      </nav>

      {/* Title card */}
      <section className="relative flex h-screen items-center px-6 md:px-16">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Rasuwa · Nepal · 26 August 2026
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-foreground md:text-6xl">
            The river that was dammed by ice — and then let go
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
            Scroll to fly the Bhote Koshi valley, or press play for a narrated
            3D reconstruction of how the flood formed, broke through, and swept
            the border towns below.
          </p>
        </div>
      </section>

      {/* Scroll track — one screen per chapter */}
      {CHAPTERS.slice(1).map((c) => (
        <section key={c.id} className="h-screen" aria-hidden="true" />
      ))}
      <section className="relative flex h-screen items-end px-6 pb-56 md:px-16">
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          Reconstruction based on reporting from the Kathmandu Post, The
          Himalayan Times, OnlineKhabar, Reuters and Fiscal Nepal. Terrain is
          schematic, not survey-accurate. Voiceover generated with AI.
        </p>
      </section>
    </main>
  );
}
