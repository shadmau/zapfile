"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function DownloadPage() {
  const params = useParams();
  const hash = params.hash as string;

  useEffect(() => {
    // Immediately redirect to download endpoint
    // Backend will handle showing HTML message or downloading file
    window.location.href = `/api/download/${hash}`;
  }, [hash]);

  // Show simple loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-orange-500"></div>
        <p className="text-zinc-400">Redirecting...</p>
      </div>
    </div>
  );
}
