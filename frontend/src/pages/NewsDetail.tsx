import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Tag, Newspaper } from "lucide-react";
import { api } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

interface NewsPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  imageUrl?: string;
  authorName: string;
  publishedAt?: string;
  createdAt: string;
}

const categoryColor: Record<string, string> = {
  jobs:         "bg-primary/10 text-primary",
  platform:     "bg-accent/10 text-accent",
  announcement: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  industry:     "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  general:      "bg-muted text-muted-foreground",
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const NewsDetail = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, isError } = useQuery<NewsPost>({
    queryKey: ["news-post", idOrSlug],
    queryFn: () => api<NewsPost>(`/news/${idOrSlug}`),
    enabled: !!idOrSlug,
    staleTime: 10 * 60 * 1000,
  });

  useSEO({
    title: post ? `${post.title} – Devlink News` : "News – Devlink",
    description: post?.excerpt || "Read the latest news and updates from Devlink.",
    canonical: post ? `https://devlink.co.ke/news/${post.slug || post._id}` : undefined,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-36 pb-16 container mx-auto px-4 max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-72 bg-muted rounded-xl" />
            <div className="space-y-2 mt-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-16 text-center">
          <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">Post not found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This post may have been removed or the link is incorrect.
          </p>
          <Button variant="outline" onClick={() => navigate("/news")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to News
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-36 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back link */}
          <Link
            to="/news"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>

          {/* Category badge */}
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${categoryColor[post.category] ?? categoryColor.general}`}>
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground leading-tight mb-5">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-base text-muted-foreground mb-8 pb-8 border-b border-border font-medium">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Devlink Team
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
          </div>

          {/* Hero image */}
          {post.imageUrl && (
            <div className="rounded-xl overflow-hidden mb-8 bg-muted">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full object-cover max-h-96"
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-foreground/80 leading-relaxed mb-8 font-medium italic border-l-4 border-primary/50 pl-5">
              {post.excerpt}
            </p>
          )}

          {/* Body — render newlines as paragraphs */}
          <div className="prose prose-base sm:prose-lg max-w-none text-foreground">
            {post.body.split("\n\n").map((para, i) => (
              <p key={i} className="mb-5 leading-relaxed text-foreground text-base sm:text-lg">
                {para.trim()}
              </p>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between flex-wrap gap-4">
            <Link to="/news" className="text-sm text-primary hover:underline font-medium">
              ← More News
            </Link>
            <Link to="/jobs">
              <Button variant="default" size="sm">Browse Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NewsDetail;
