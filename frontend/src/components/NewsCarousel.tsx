import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "@/lib/api";
import { Newspaper, ChevronLeft, ChevronRight } from "lucide-react";

interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt?: string;
}

const NewsCarousel = () => {
  const [items, setItems]   = useState<NewsItem[]>([]);
  const [idx, setIdx]       = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/news?limit=20`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.posts?.length) setItems(data.posts);
      })
      .catch(() => {});
  }, []);

  const advance = (dir: 1 | -1) => {
    setIdx((i) => (i + dir + items.length) % items.length);
    setAnimKey((k) => k + 1);
  };

  const goTo = (i: number) => {
    setIdx(i);
    setAnimKey((k) => k + 1);
  };

  // Auto-advance every 5 s
  useEffect(() => {
    if (!items.length || paused) return;
    const t = setInterval(() => advance(1), 5000);
    return () => clearInterval(t);
  }, [items.length, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items.length) return null;

  const item = items[idx];

  return (
    <>
      <style>{`
        @keyframes slideInNews {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .news-slide-in { animation: slideInNews 0.35s ease both; }
      `}</style>

      <div
        className="relative h-28 border-b-2 border-primary/40 flex items-stretch overflow-hidden shadow-sm"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Full-bleed background image */}
        {item.imageUrl && (
          <img
            key={`bg-${animKey}`}
            src={item.imageUrl}
            alt=""
            aria-hidden="true"
            className="news-slide-in absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Dark overlay so text is always readable */}
        <div
          className={`absolute inset-0 ${
            item.imageUrl
              ? "bg-black/55"
              : "bg-secondary"
          }`}
        />

        {/* All content sits above the overlay */}
        <div className="relative z-10 flex items-stretch w-full">

          {/* LATEST badge */}
          <div className="shrink-0 flex flex-col items-center justify-center gap-1.5 px-4 bg-primary text-primary-foreground min-w-[70px]">
            <Newspaper className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest leading-none">Latest</span>
          </div>

          {/* Slide — whole area is a link to the news detail */}
          <Link
            key={animKey}
            to={`/news/${item.slug}`}
            className="news-slide-in flex-1 flex items-center gap-4 px-5 overflow-hidden min-w-0 group"
          >
            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className={`text-base font-bold truncate leading-snug transition-colors group-hover:text-primary ${item.imageUrl ? "text-white" : "text-secondary-foreground"}`}>
                {item.title}
              </p>
              {item.excerpt && (
                <p className={`text-sm truncate mt-1 ${item.imageUrl ? "text-white/80" : "text-secondary-foreground/80"}`}>
                  {item.excerpt}
                </p>
              )}
              {item.publishedAt && (
                <p className={`text-xs mt-1 font-medium ${item.imageUrl ? "text-white/60" : "text-secondary-foreground/60"}`}>
                  {new Date(item.publishedAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              )}
            </div>
          </Link>

          {/* Prev / Next + counter */}
          <div className="shrink-0 flex items-center gap-1 px-3 border-l border-white/20">
            <button
              onClick={() => advance(-1)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/15 ${item.imageUrl ? "text-white" : "text-secondary-foreground"}`}
              aria-label="Previous news"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className={`text-xs font-semibold tabular-nums w-10 text-center ${item.imageUrl ? "text-white/70" : "text-secondary-foreground/70"}`}>
              {idx + 1}&thinsp;/&thinsp;{items.length}
            </span>
            <button
              onClick={() => advance(1)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/15 ${item.imageUrl ? "text-white" : "text-secondary-foreground"}`}
              aria-label="Next news"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="shrink-0 hidden sm:flex flex-col justify-center gap-1.5 px-3 border-l border-white/20">
            {items.slice(0, Math.min(items.length, 8)).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-5 bg-primary" : "w-2 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Go to news ${i + 1}`}
              />
            ))}
          </div>

          {/* All news link */}
          <Link
            to="/news"
            className={`shrink-0 flex items-center px-4 text-xs font-bold transition-colors border-l border-white/20 whitespace-nowrap uppercase tracking-wider ${item.imageUrl ? "text-white hover:text-primary" : "text-primary hover:text-primary/70"}`}
          >
            All News →
          </Link>
        </div>
      </div>
    </>
  );
};

export default NewsCarousel;
