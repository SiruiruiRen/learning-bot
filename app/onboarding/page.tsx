"use client";

import { useRouter } from "next/navigation";
import { UserProfile, UserProfileFormData } from "@/components/user-profile";
import { useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmitProfile = async (data: UserProfileFormData) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      const result = await response.json();
      
      // Store user ID in localStorage for future reference
      if (result.userId) {
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("userEmail", data.email);
      }
      
      // Navigate to the first learning phase or dashboard
      router.push("/phase1");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to SoLBot</h1>
          <p className="text-gray-600">
            Create your profile to personalize your learning experience. 
            Only your email is required; other fields are optional.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        <UserProfile onSubmit={handleSubmitProfile} />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            By creating a profile, you agree to our Terms of Service and Privacy Policy.
            We collect only the data you provide to personalize your learning experience.
          </p>
        </div>
      </div>
    </div>
  );
} 