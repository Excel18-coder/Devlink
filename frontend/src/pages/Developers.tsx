import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

interface Developer {
  id: string;
  fullName: string;
  bio: string;
  skills: string[];
  yearsExperience: number;
  availability: string;
  rateType: string;
  rateAmount: number;
  ratingAvg: number;
  location: string;
  avatarUrl?: string;
}

const Developers = () => {
  useSEO({
    title: "Hire Vetted Software Developers – Africa & Worldwide | Devlink",
    description: "Browse 10,000+ vetted software developers on Devlink. Filter by skills, hourly rate, availability, and location. Hire the best tech talent for remote, contract, or full-time roles.",
    canonical: "https://devlink.co.ke/developers",
  });
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async (searchTerm?: string) => {
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const data = await api<Developer[]>(`/developers${params}`);
      setDevelopers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchDevelopers(search);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-24">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">Find Developers</h1>
            <p className="text-muted-foreground">Browse verified talent from around the world.</p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by skill, name, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-body"
              />
            </div>
            <Button variant="outline" size="default" onClick={handleSearch}>Search</Button>
          </div>

          {/* Developer Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : developers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No developers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {developers.map((dev) => (
                <div key={dev.id} className="bg-card border border-border rounded-xl p-6 card-elevated">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 overflow-hidden">
                        {dev.avatarUrl ? (
                          <img src={dev.avatarUrl} alt={dev.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-heading font-bold text-primary">
                            {dev.fullName?.split(" ").map(n => n[0]).join("") || "?"}
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading font-semibold text-card-foreground">{dev.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{dev.yearsExperience} years experience</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-heading font-bold text-primary">${dev.rateAmount}/{dev.rateType}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                        <span className="text-sm text-muted-foreground">{dev.ratingAvg || "New"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{dev.location || "Remote"}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className={dev.availability === "full-time" ? "text-accent" : ""}>{dev.availability}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {dev.skills?.slice(0, 5).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs font-body">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <Link to={`/developers/${dev.id}`}>
                    <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Developers;
