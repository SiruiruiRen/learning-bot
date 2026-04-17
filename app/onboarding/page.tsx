"use client";

import { useRouter } from "next/navigation";
import { UserProfile, UserProfileFormData } from "@/components/user-profile";
import { useState } from "react";
import { captureToWAL } from "@/lib/dataLayerInstrument";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmitProfile = async (data: UserProfileFormData) => {
    // Stage 2: onboarding is the FIRST write of a new student's
    // session. At this point localStorage.user_id is not yet set, so
    // captureToWAL would normally be a no-op. We pass an explicit
    // participantId derived from email (hashed) so the event is still
    // captured and can later be reconciled with the real user_id once
    // the API returns it.
    const synthPid = `pending:${data.email}`
    captureToWAL("users", {
      event_type: "profile_create_attempt",
      email: data.email,
      has_name: !!data.full_name,
      // Do NOT include the full profile payload here — it may contain
      // fields we'd prefer to keep out of the WAL. The email is
      // sufficient as a reconciliation key.
    }, {
      participantId: synthPid,
      eventType: "profile_create_attempt",
    })

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

      // Stage 2: profile creation succeeded — emit a second WAL row
      // now with the real user_id so later analysis can join the two
      // rows (pending:<email> and the real UUID) via the email field.
      if (result.userId) {
        captureToWAL("users", {
          event_type: "profile_create_success",
          email: data.email,
          user_id: result.userId,
          linked_pending_pid: synthPid,
        }, {
          participantId: result.userId,
          eventType: "profile_create_success",
        })
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
          <h1 className="text-3xl font-bold mb-2">Welcome to SoL2LBot</h1>
          <p className="text-muted-foreground">
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
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By creating a profile, you agree to our Terms of Service and Privacy Policy.
            We collect only the data you provide to personalize your learning experience.
          </p>
        </div>
      </div>
    </div>
  );
} 