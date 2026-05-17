/**
 * TV listing page — Server Component with Streaming SSR + Suspense.
 */
import { Suspense } from 'react';
import { MovieRow } from '@/components/MovieRow';
import { MovieRowSkeleton } from '@/components/MovieRowSkeleton';

export const metadata = {
  title: 'TV — CineCast',
};

export default function TvPage() {
  return (
    <>
      <h2 className="page-title">TV Shows</h2>
      <Suspense fallback={<MovieRowSkeleton title="Popular TV" />}>
        <MovieRow title="Popular TV" source="popularTV" mediaType="tv" />
      </Suspense>
    </>
  );
}
