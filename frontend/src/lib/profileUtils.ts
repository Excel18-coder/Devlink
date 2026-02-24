export interface DeveloperProfileFields {
  bio?: string;
  skills?: string[];
  yearsExperience?: number;
  location?: string;
  rateAmount?: number;
  avatarUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
}

export const REQUIRED_FIELD_LABELS: Record<string, string> = {
  bio:              "Bio (at least 10 characters)",
  skills:           "Skills",
  yearsExperience:  "Years of experience",
  location:         "Location",
  rateAmount:       "Hourly / project rate",
  avatarUrl:        "Profile photo",
  githubUrl:        "GitHub profile URL",
  resumeUrl:        "Resume (PDF)",
};

export function getMissingProfileFields(profile: DeveloperProfileFields): string[] {
  const missing: string[] = [];
  if (!profile.bio || profile.bio.trim().length < 10) missing.push("bio");
  if (!profile.skills || profile.skills.length === 0) missing.push("skills");
  if (!profile.yearsExperience) missing.push("yearsExperience");
  if (!profile.location) missing.push("location");
  if (!profile.rateAmount) missing.push("rateAmount");
  if (!profile.avatarUrl) missing.push("avatarUrl");
  if (!profile.githubUrl || !profile.githubUrl.trim()) missing.push("githubUrl");
  if (!profile.resumeUrl || !profile.resumeUrl.trim()) missing.push("resumeUrl");
  return missing;
}

export function isProfileComplete(profile: DeveloperProfileFields): boolean {
  return getMissingProfileFields(profile).length === 0;
}
