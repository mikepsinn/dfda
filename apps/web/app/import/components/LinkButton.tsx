'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVitalLink } from "@tryvital/vital-link";

interface LinkButtonProps {
  userID: string | null;
}

export function LinkButton({ userID }: LinkButtonProps) {
  const [isLoading, setLoading] = useState(false);

  const onSuccess = (metadata: unknown) => {
    console.log("onSuccess", metadata);
  };

  const onExit = (metadata: unknown) => {
    console.log("onExit", metadata);
  };

  const onError = (metadata: unknown) => {
    console.log("onError", metadata);
  };

  const config = {
    onSuccess,
    onExit,
    onError,
    env: process.env.NEXT_PUBLIC_VITAL_ENV as string,
    region: process.env.NEXT_PUBLIC_VITAL_REGION as string,
  };

  const { open, ready } = useVitalLink(config);

  const handleVitalOpen = async () => {
    if (!userID) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/import/token/${userID}`);
      const data = await response.json();
      open(data.link_token);
    } catch (error) {
      console.error('Failed to get token:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleVitalOpen}
      disabled={!userID || !ready}
      className="px-2 py-0 text-xs"
    >
      {isLoading ? "Connecting..." : "Connect"}
    </Button>
  );
}
