/**
 * Home page — Server Component.
 *
 * No 'use client' here. This file runs ONLY on the server.
 * Async, so it can fetch data directly. Each <Suspense> wraps an
 * async child that streams independently — slow rows don't block fast ones.
 *
 * This is the streaming SSR pattern from PDF section 1.2.
 */
import { Suspense } from 'react';
import { HeroSection } from '@/components/HeroSection';
import { MovieRow } from '@/components/MovieRow';
import { MovieRowSkeleton } from '@/components/MovieRowSkeleton';

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      <Suspense fallback={<MovieRowSkeleton title="Trending now" />}>
        <MovieRow title="Trending now" source="trending" />
      </Suspense>

      <Suspense fallback={<MovieRowSkeleton title="Top rated" />}>
        <MovieRow title="Top rated" source="topRated" />
      </Suspense>

      <Suspense fallback={<MovieRowSkeleton title="Popular TV" />}>
        <MovieRow title="Popular TV" source="popularTV" mediaType="tv" />
      </Suspense>
    </>
  );
}

function HeroSkeleton() {
  return <div className="hero" style={{ minHeight: 360, opacity: 0.3 }} />;
}
