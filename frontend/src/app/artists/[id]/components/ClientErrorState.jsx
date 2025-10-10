"use client";

import { ErrorEmptyState } from "../../../../design-system/components/feedback/EmptyState";

export default function ClientErrorState({ title, description }) {
  const handleGoHome = () => {
    window.location.href = "/artists";
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <ErrorEmptyState
      title={title}
      description={description}
      onGoHome={handleGoHome}
      onRetry={handleRetry}
    />
  );
}