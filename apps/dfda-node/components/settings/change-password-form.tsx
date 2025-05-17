'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { logger } from '@/lib/logger';
import { changePasswordAction } from '@/app/user/settings/actions';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Zod schema for the form
const formSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(8, { message: 'New password must be at least 8 characters' }),
  confirmPassword: z.string().min(8, { message: 'Confirm password must be at least 8 characters' })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"], // path of error
});

type FormData = z.infer<typeof formSchema>;

export default function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [actionError, setActionError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
  });

  const onSubmit = (values: FormData) => {
    setActionError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append('currentPassword', values.currentPassword);
      formData.append('newPassword', values.newPassword);
      formData.append('confirmPassword', values.confirmPassword);

      try {
        logger.info("[ChangePasswordForm] Calling changePasswordAction");
        const result = await changePasswordAction(formData);
        
        if (result.success) {
          toast({
            title: "Success",
            description: result.message,
          });
          form.reset(); // Clear form on success
          logger.info("[ChangePasswordForm] Password change successful.");
        } else {
          setActionError(result.message);
          logger.warn("[ChangePasswordForm] Password change failed.", { error: result.message });
        }
      } catch (error) {
        logger.error("[ChangePasswordForm] Error calling action:", { error });
        setActionError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input 
          id="currentPassword" 
          type="password" 
          {...form.register("currentPassword")} 
        />
        {form.formState.errors.currentPassword && (
          <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input 
          id="newPassword" 
          type="password" 
          {...form.register("newPassword")} 
        />
        {form.formState.errors.newPassword && (
          <p className="text-sm text-destructive">{form.formState.errors.newPassword.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input 
          id="confirmPassword" 
          type="password" 
          {...form.register("confirmPassword")} 
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
} 