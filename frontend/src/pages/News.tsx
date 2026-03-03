import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, Calendar, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

interface NewsPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  imageUrl?: string;
  authorName: string;
  publishedAt?: string;
  createdAt: string;
}

interface NewsResponse {
  posts: NewsPost[];
  total: number;
  page: number;
  pages: number;
}

const CATEGORIES = ["all", "jobs", "platform", "announcement", "industry", "general"] as const;

const categoryColor: Record<string, string> = {
  jobs:         "bg-primary/10 text-primary",
  platform:     "bg-accent/10 text-accent",
  announcement: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  industry:     "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  general:      "bg-muted text-muted-foreground",
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const News = () => {
  useSEO({
    title: "News & Updates – Devlink",
    description: "Stay up to date with the latest news, job market insights, platform updates, and industry announcements from Devlink.",
    canonical: "https://devlink.co.ke/news",
  });

  const [page,     setPage]     = useState(1);
  const [category, setCategory] = useState("all");

  const { data, isLoading, isFetching } = useQuery<NewsResponse>({
    queryKey: ["news", category, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "9" });
      if (category !== "all") params.set("category", category);
      return api<NewsResponse>(`/news?${params}`);
    },
    placeholderData: (prev) => prev,
  });

  const posts      = data?.posts ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Newspaper className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">News &amp; Updates</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
              Latest from Devlink
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Job market insights, platform updates, industry trends, and community announcements.
            </p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-card border border-border overflow-hidden animate-pulse">
                  <div className="h-44 bg-muted" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-24 text-muted-foreground">
              <Newspaper className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm mt-1">Check back soon for news and updates.</p>
            </div>
          )}

          {/* Post grid */}
          {!isLoading && posts.length > 0 && (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/news/${post.slug || post._id}`}
                  className="group rounded-xl bg-card border border-border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all flex flex-col"
                >
                  {/* Image */}
                  {post.imageUrl ? (
                    <div className="h-44 overflow-hidden bg-muted">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-primary/10 via-accent/5 to-muted flex items-center justify-center">
                      <Newspaper className="h-10 w-10 text-primary/30" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColor[post.category] ?? categoryColor.general}`}>
                        {post.category}
                      </span>
                    </div>

                    <h2 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-auto text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </span>
                      <span>·</span>
                      <span>{post.authorName}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default News;
