'use client';

import { useEffect, useRef, useState } from 'react';
import { getDictionary, type Locale } from '../i18n';

export function shouldPlayHero(reducedMotion: boolean | null, paused: boolean) {
  return reducedMotion === false && !paused;
}

export default function HeroMedia({ locale = 'es' }: { locale?: Locale }) {
  const t = getDictionary(locale).heroMedia;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const enabled = shouldPlayHero(reducedMotion, paused);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    if (!enabled) {
      video.pause();
      if (reducedMotion === true) video.load();
      return;
    }
    let cancelled = false;
    void video.play().catch(() => {
      if (!cancelled) setPaused(true);
    });
    return () => {
      cancelled = true;
      video.pause();
    };
  }, [enabled, failed, reducedMotion]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      setPaused(true);
      video.pause();
    } else {
      setPaused(false);
      // Explicit user interaction can retry browser-blocked autoplay.
      void video.play().catch(() => setPaused(true));
    }
  }

  return (
    <figure className="hero-media" aria-label={t.label}>
      <div className="hero-media-stage">
        {failed ? (
          // A real frame preserves the composition if the browser cannot decode the video.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="hero-media-image" src="/videos/devtecia-hero-poster.jpg" alt={t.fallbackAlt} width={1280} height={720} />
        ) : (
          <video
            ref={videoRef}
            className="hero-media-video"
            muted
            loop
            playsInline
            preload="none"
            poster="/videos/devtecia-hero-poster.jpg"
            width={1280}
            height={720}
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => { setPlaying(false); setFailed(true); }}
          >
            {reducedMotion === false && <>
              <source src="/videos/devtecia-hero.webm" type="video/webm" />
              <source src="/videos/devtecia-hero.mp4" type="video/mp4" />
            </>}
          </video>
        )}
        <div className="hero-media-header" aria-hidden="true">
          <span>{t.header[0]}</span><span>{t.header[1]}</span>
        </div>
        <div className="hero-media-footer">
          <p>{t.quote[0]}<br /><strong>{t.quote[1]}</strong></p>
          {reducedMotion === false && !failed && (
            <button className="hero-media-control" type="button" onClick={togglePlayback} aria-label={playing ? t.pauseLabel : t.playLabel}>
              <span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span>
              {playing ? t.pause : t.play}
            </button>
          )}
        </div>
      </div>
      <figcaption><span>{t.caption[0]}</span><span>{t.caption[1]}</span></figcaption>
    </figure>
  );
}
