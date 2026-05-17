/**
 * Movies listing page — Server Component with Streaming SSR + Suspense.
 */
import { Suspense } from 'react';
import { MovieRow } from '@/components/MovieRow';
import { MovieRowSkeleton } from '@/components/MovieRowSkeleton';

export const metadata = {
  title: 'Movies — CineCast',
};

export default function MoviesPage() {
  return (
    <>
      <h2 className="page-title">Movies</h2>
      <Suspense fallback={<MovieRowSkeleton title="Popular Movies" />}>
        <MovieRow title="Popular Movies" source="popularMovies" />
      </Suspense>
      <Suspense fallback={<MovieRowSkeleton title="Top Rated" />}>
        <MovieRow title="Top Rated" source="topRated" />
      </Suspense>
      <Suspense fallback={<MovieRowSkeleton title="Trending" />}>
        <MovieRow title="Trending" source="trending" />
      </Suspense>
    </>
  );
}
