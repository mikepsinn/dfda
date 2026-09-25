'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';
import { useToast } from "@/components/ui/use-toast";
import { ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';

// NOTE: This is a basic placeholder. Full MFA implementation is complex.
// It requires server-side logic for enrollment, verification, challenge, etc.

export default function MfaSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false); // Placeholder state
  const [isToggling, setIsToggling] = useState(false);
  const { toast } = useToast();

  // TODO: In a real implementation, fetch the user's actual MFA status 
  // from Supabase Auth on component mount.
  useEffect(() => {
    const fetchMfaStatus = async () => {
      setIsLoading(true);
      try {
        // const supabase = createClient();
        // const { data: { user }, error } = await supabase.auth.getUser();
        // if (error || !user) {
        //   throw new Error("User not authenticated");
        // }
        // const { data, error: listError } = await supabase.auth.mfa.listFactors();
        // if (listError) throw listError;
        // setIsMfaEnabled(data.totp.length > 0); // Check if any TOTP factors exist
        logger.info("[MfaSettings] TODO: Fetch actual MFA status");
        // For now, simulate a status (e.g., false)
        setIsMfaEnabled(false); 
      } catch (error: any) {
        logger.error("[MfaSettings] Error fetching MFA status:", { error: error.message });
        toast({ title: "Error", description: "Could not load MFA status.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMfaStatus();
  }, [toast]);

  const handleManageMfa = () => {
    setIsToggling(true);
    // TODO: Implement navigation or modal opening for MFA enrollment/management flow.
    logger.info("[MfaSettings] Clicked Manage MFA button (placeholder)");
    toast({ title: "Manage MFA", description: "MFA management flow not yet implemented." });
    // Simulate action completion
    setTimeout(() => setIsToggling(false), 1000);
  };

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading MFA status...
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isMfaEnabled ? (
              <ShieldCheck className="mr-2 h-5 w-5 text-green-600" />
            ) : (
              <ShieldOff className="mr-2 h-5 w-5 text-muted-foreground" />
            )}
            <span>Status: {isMfaEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManageMfa}
            disabled={isToggling}
          >
             {isToggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Manage MFA
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Add an extra layer of security using an authenticator app.
      </p>
    </div>
  );
} 