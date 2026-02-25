import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Star, Github, ExternalLink, MessageSquare, ArrowLeft } from "lucide-react";
import ResumeViewer from "@/components/ResumeViewer";

interface Developer {
  id: string;
  fullName: string;
  email: string;
  bio: string;
  skills: string[];
  yearsExperience: number;
  portfolioLinks: string[];
  githubUrl: string;
  resumeUrl: string;
  availability: string;
  rateType: string;
  rateAmount: number;
  ratingAvg: number;
  location: string;
  avatarUrl?: string;
}

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const DeveloperProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devData, reviewsData] = await Promise.all([
          api<Developer>(`/developers/${id}`),
          api<Review[]>(`/reviews/user/${id}`)
        ]);
        setDeveloper(devData);
        setReviews(reviewsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <p>Developer not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" className="mb-4 -ml-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {developer.avatarUrl ? (
                        <img src={developer.avatarUrl} alt={developer.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl sm:text-2xl font-heading font-bold text-primary">
                          {developer.fullName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl sm:text-2xl mb-1 break-words">{developer.fullName}</CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {developer.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {developer.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          {developer.ratingAvg || "New"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {developer.bio && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">About</h3>
                      <p className="text-muted-foreground">{developer.bio}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {developer.skills?.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {developer.githubUrl && (
                      <a href={developer.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </Button>
                      </a>
                    )}
                    {developer.portfolioLinks?.map((link, i) => (
                      <a key={i} href={link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Portfolio
                        </Button>
                      </a>
                    ))}
                    {developer.resumeUrl && (
                      <ResumeViewer url={developer.resumeUrl} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No reviews yet</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{review.reviewerName}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary">
                      ${developer.rateAmount}
                    </div>
                    <div className="text-sm text-muted-foreground">per {developer.rateType}</div>
                  </div>

                  {user?.role === "employer" && (
                    <Button
                      className="w-full mb-4"
                      onClick={() =>
                        navigate(
                          `/messages?recipientId=${id}&recipientName=${encodeURIComponent(developer.fullName)}`
                        )
                      }
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Developer
                    </Button>
                  )}

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experience</span>
                      <span>{developer.yearsExperience} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Availability</span>
                      <span className="capitalize">{developer.availability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate Type</span>
                      <span className="capitalize">{developer.rateType}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DeveloperProfile;
