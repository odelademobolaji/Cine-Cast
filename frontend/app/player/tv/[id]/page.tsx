'use client';
import { useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const SOURCES = [
  { label: 'VidLink', url: (id: string, s: number, e: number) => `https://www.vidlink.pro/tv/${id}/${s}/${e}` },
  { label: 'VidNest', url: (id: string, s: number, e: number) => `https://vidnest.fun/tv/${id}/${s}/${e}` },
];

export default function TvPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const season = parseInt(searchParams.get('season') || '1', 10);
  const episode = parseInt(searchParams.get('episode') || '1', 10);
  const [active, setActive] = useState(0);
  const embedUrl = SOURCES[active].url(id, season, episode);

  return (
    <div className="player-wrap">
      <a href={`/tv/${id}`} className="player-back">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back
      </a>

      <div className="source-tabs">
        {SOURCES.map((s, i) => (
          <button
            key={s.label}
            className={`source-tab${active === i ? ' active' : ''}`}
            onClick={() => setActive(i)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <iframe
        key={embedUrl}
        className="embed-player"
        src={embedUrl}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
