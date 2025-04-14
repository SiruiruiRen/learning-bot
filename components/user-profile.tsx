"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

export interface UserProfileFormData {
  email: string;
  full_name?: string;
  education_level?: string;
  background?: string;
  preferences?: {
    learning_style?: string;
    preferred_resources?: string[];
    pace?: string;
  };
}

interface UserProfileProps {
  onSubmit: (data: UserProfileFormData) => Promise<void>;
  initialData?: UserProfileFormData;
  isEditing?: boolean;
}

export function UserProfile({ onSubmit, initialData, isEditing = false }: UserProfileProps) {
  const [formData, setFormData] = useState<UserProfileFormData>(
    initialData || {
      email: "",
      full_name: "",
      education_level: "",
      background: "",
      preferences: {
        learning_style: "visual",
        preferred_resources: [],
        pace: "medium",
      },
    }
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Profile" : "Create Profile"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update your profile information" 
            : "Enter your information to get started. Only email is required."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name (Optional)</Label>
            <Input
              id="full_name"
              value={formData.full_name || ""}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Your Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="education_level">Education Level (Optional)</Label>
            <Select
              value={formData.education_level || ""}
              onValueChange={(value) => handleChange("education_level", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select education level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high_school">High School</SelectItem>
                <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                <SelectItem value="masters">Master's Degree</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="background">Background Knowledge (Optional)</Label>
            <Textarea
              id="background"
              value={formData.background || ""}
              onChange={(e) => handleChange("background", e.target.value)}
              placeholder="Briefly describe your background knowledge in the subject"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="learning_style">Preferred Learning Style (Optional)</Label>
            <Select
              value={formData.preferences?.learning_style || "visual"}
              onValueChange={(value) => handlePreferenceChange("learning_style", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select learning style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visual">Visual</SelectItem>
                <SelectItem value="auditory">Auditory</SelectItem>
                <SelectItem value="reading">Reading/Writing</SelectItem>
                <SelectItem value="kinesthetic">Kinesthetic (hands-on)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pace">Learning Pace (Optional)</Label>
            <Select
              value={formData.preferences?.pace || "medium"}
              onValueChange={(value) => handlePreferenceChange("pace", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select learning pace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow - Detailed Explanations</SelectItem>
                <SelectItem value="medium">Medium - Balanced</SelectItem>
                <SelectItem value="fast">Fast - Quick and Concise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </CardContent>
        
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Profile" : "Create Profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 