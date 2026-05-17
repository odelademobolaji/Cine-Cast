import { notFound } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { getTvDetail, getTvSources, pickBestSource, getProxiedVideoUrl } from "@/lib/api";

interface TvPlayerPageProps {
  params: { id: string };
  searchParams: { season?: string; episode?: string };
}

export default async function TvPlayerPage({ params, searchParams }: TvPlayerPageProps) {
  const tvId = parseInt(params.id, 10);
  const season = parseInt(searchParams.season || "1", 10);
  const episode = parseInt(searchParams.episode || "1", 10);
  if (isNaN(tvId)) notFound();

  const tvData = await getTvDetail(tvId);
  let videoUrl: string | null = null;
  let fallbackVideoUrls: string[] = [];
  let videoTitle = tvData.name || tvData.title || "Unknown";
  let sourceInfo: { provider: string; quality?: string; type?: string; count: number } | null = null;

  try {
    const sourceResponse = await getTvSources(tvId, season, episode);
    const bestSource = pickBestSource(sourceResponse.sources);
    if (bestSource) {
      const orderedSources = [
        bestSource,
        ...sourceResponse.sources.filter((source) => source.url !== bestSource.url),
      ];
      const playableUrls = orderedSources.map((source) => getProxiedVideoUrl(source.url));
      videoUrl = playableUrls[0] || null;
      fallbackVideoUrls = playableUrls.slice(1);
      videoTitle = `${sourceResponse.title} - S${season}E${episode}`;
      sourceInfo = { provider: bestSource.provider, quality: bestSource.quality, type: bestSource.type, count: sourceResponse.sources.length };
    }
  } catch (error) {
    console.error("Failed to fetch Cineby TV sources:", error);
  }

  return (
    <div className="player-wrap">
      <a href={`/tv/${tvId}`} className="player-back">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        Back
      </a>
      {videoUrl ? (
        <VideoPlayer
          src={videoUrl}
          fallbackSources={fallbackVideoUrls}
          poster={tvData.backdrop_path ? `https://image.tmdb.org/t/p/original${tvData.backdrop_path}` : undefined}
          title={videoTitle}
        />
      ) : (
        <div className="vp-container">
          <div className="vp-video" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", padding: 24, textAlign: "center" }}>
            No playable API source was returned for this episode.
          </div>
        </div>
      )}
      <div style={{ marginTop: 16, color: "#aaa", fontSize: 14 }}>
        <h2 style={{ color: "#fff", marginBottom: 8 }}>{tvData.name || tvData.title}</h2>
        <p>Season {season}, Episode {episode}</p>
        <p>{tvData.overview}</p>
        {sourceInfo && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#888" }}>
            Source: {sourceInfo.provider}
            {sourceInfo.quality && ` · ${sourceInfo.quality}`}
            {sourceInfo.type && ` · ${sourceInfo.type.toUpperCase()}`}
          </div>
        )}
      </div>
    </div>
  );
}
