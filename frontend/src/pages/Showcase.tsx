import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Search, ExternalLink, Github, Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";

interface ShowcaseItem {
  id: string;
  developerId: string;
  developerName: string;
  developerAvatar: string | null;
  developerRating: number;
  title: string;
  tagline: string;
  techStack: string[];
  projectUrl?: string;
  repoUrl?: string;
  imageUrl?: string;
  category: string;
  lookingFor: string;
  likes: number;
  createdAt: string;
}

interface ShowcaseResponse {
  showcases: ShowcaseItem[];
  total: number;
  page: number;
  pages: number;
}

const categoryColors: Record<string, string> = {
  web: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  mobile: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  api: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
  data: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  ai: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
  design: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
};

const lookingForLabel: Record<string, { label: string; color: string }> = {
  employers: { label: "Hiring", color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" },
  investors: { label: "Seeking Investment", color: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  both: { label: "Open to Both", color: "bg-primary/10 text-primary" }
};

const Showcase = () => {
  const [data, setData] = useState<ShowcaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [lookingFor, setLookingFor] = useState("all");
  const [page, setPage] = useState(1);

  const fetchShowcases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (lookingFor !== "all") params.set("lookingFor", lookingFor);
      const result = await api<ShowcaseResponse>(`/showcases?${params}`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, lookingFor]);

  useEffect(() => { fetchShowcases(); }, [fetchShowcases]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShowcases();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* Hero header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3">
              Developer <span className="text-primary">Showcase</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Discover innovative products built by top developers. Connect, hire, or invest.
            </p>
          </div>

          {/* Filters */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, tech, or keyword…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="api">API / Backend</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="ai">AI / ML</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lookingFor} onValueChange={(v) => { setLookingFor(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Looking for" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="employers">Hiring</SelectItem>
                <SelectItem value="investors">Investors</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="shrink-0">Search</Button>
          </form>

          {/* Results count */}
          {!loading && data && (
            <p className="text-sm text-muted-foreground mb-5">
              {data.total} project{data.total !== 1 ? "s" : ""} found
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : data?.showcases.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No showcases found.</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to showcase your product!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.showcases.map((item) => {
                const lf = lookingForLabel[item.lookingFor] ?? lookingForLabel.both;
                return (
                  <Link
                    key={item.id}
                    to={`/showcase/${item.id}`}
                    className="group border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Image / placeholder */}
                    <div className="relative h-44 bg-muted overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <span className="text-4xl font-heading font-bold text-primary/20">
                            {item.title.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[item.category] ?? categoryColors.other}`}>
                          {item.category.toUpperCase()}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lf.color}`}>
                          {lf.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.tagline}</p>

                      {/* Tech stack */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {item.techStack.slice(0, 4).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                        {item.techStack.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{item.techStack.length - 4}</Badge>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          {item.developerAvatar ? (
                            <img src={item.developerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-primary">
                                {item.developerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <span className="truncate max-w-[100px]">{item.developerName}</span>
                          {item.developerRating > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {item.developerRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" /> {item.likes}
                          </span>
                          {item.projectUrl && <ExternalLink className="h-3.5 w-3.5" />}
                          {item.repoUrl && <Github className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Showcase;
