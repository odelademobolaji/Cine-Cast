/**
 * Movie detail — dynamic Server Component route.
 *
 * `params.id` comes from the URL. Async function = direct data fetch,
 * no useEffect needed. Zero client JS shipped for this page.
 */
import Link from 'next/link';
import { api, posterUrl } from '@/lib/api';

type Genre = {
  id: number;
  name: string;
};

export default async function MovieDetail({
  params,
}: {
  params: { id: string };
}) {
  const movie = await api.movie(parseInt(params.id, 10));
  const year = (movie.release_date || '').slice(0, 4);
  const rating = movie.vote_average?.toFixed(1) ?? '—';

  return (
    <>
      <Link href="/" className="back">
        ← Back
      </Link>
      <div className="detail-grid">
        <div
          className="detail-poster"
          style={{ backgroundImage: `url(${posterUrl(movie.poster_path)})` }}
        />
        <div>
          <h1 className="detail-title">{movie.title}</h1>
          <div className="detail-tags">
            <span className="tag rating">★ {rating}</span>
            {year && <span className="tag">{year}</span>}
            {movie.runtime && <span className="tag">{movie.runtime}m</span>}
            {movie.genres?.slice(0, 3).map((g: Genre) => (
              <span key={g.id} className="tag">
                {g.name}
              </span>
            ))}
          </div>
          {movie.tagline && (
            <p
              style={{
                fontStyle: 'italic',
                color: '#888',
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              "{movie.tagline}"
            </p>
          )}
          <p className="detail-overview">{movie.overview}</p>
          <div className="actions">
            <Link href={`/player/movie/${movie.id}`} className="btn primary">
              ▶ Watch now
            </Link>
            <button className="btn">+ My list</button>
          </div>
        </div>
      </div>
    </>
  );
}
