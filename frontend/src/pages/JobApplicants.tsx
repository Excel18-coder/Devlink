import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Applicant {
  id: string;
  developerId: string;
  fullName: string;
  skills: string[];
  yearsExperience: number;
  rateAmount: number;
  coverLetter: string;
  status: string;
  createdAt: string;
}

const JobApplicants = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const fetchApplicants = async () => {
    try {
      const data = await api<Applicant[]>(`/applications/job/${id}`);
      setApplicants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appId: string, status: string) => {
    try {
      await api(`/applications/${appId}/status`, { method: "PATCH", body: { status } });
      toast({ title: `Application ${status}` });
      fetchApplicants();
    } catch (err) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="sm" className="-ml-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-3xl font-heading font-bold">Job Applicants</h1>
          </div>

          {applicants.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No applicants yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applicants.map((applicant) => (
                <Card key={applicant.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{applicant.fullName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {applicant.yearsExperience} years experience • ${applicant.rateAmount}/hr
                        </p>
                      </div>
                      <Badge
                        variant={
                          applicant.status === "accepted"
                            ? "default"
                            : applicant.status === "rejected"
                            ? "destructive"
                            : applicant.status === "shortlisted"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {applicant.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {applicant.skills?.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    {applicant.coverLetter && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Cover Letter</p>
                        <p className="text-sm text-muted-foreground">{applicant.coverLetter}</p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {applicant.status === "submitted" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(applicant.id, "shortlisted")}
                          >
                            Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(applicant.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {applicant.status === "shortlisted" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(applicant.id, "accepted")}
                          >
                            Accept &amp; Hire
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(applicant.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {applicant.status === "accepted" && (
                        <Link to={`/contracts/create?developerId=${applicant.developerId}&jobId=${id}`}>
                          <Button size="sm">Create Contract</Button>
                        </Link>
                      )}
                      <Link to={`/developers/${applicant.developerId}`}>
                        <Button size="sm" variant="ghost">View Profile</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobApplicants;
