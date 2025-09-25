"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    <span className="ml-2 text-neutral-600">Redirecting to Home page...</span>
  </div>
);

export default function StatusPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the home page instead of loading complex status page
    router.replace("/");
  }, [router]);

  return <LoadingSpinner />;
}
