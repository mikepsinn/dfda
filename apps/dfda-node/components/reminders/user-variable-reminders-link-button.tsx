import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';

interface UserVariableRemindersLinkButtonProps {
  userVariableId: string;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  className?: string;
}

export const UserVariableRemindersLinkButton: React.FC<UserVariableRemindersLinkButtonProps> = ({
  userVariableId,
  variant = "outline", // Default style
  size = "sm",         // Default size
  className,
}) => {
  if (!userVariableId) {
    return null; // Don't render if no ID is provided
  }

  const href = `/patient/reminders/${userVariableId}`;

  return (
    <Link href={href} passHref legacyBehavior>
      <Button variant={variant} size={size} className={className}>
        <BellRing className="mr-2 h-4 w-4" />
        Manage Reminders
      </Button>
    </Link>
  );
}; 