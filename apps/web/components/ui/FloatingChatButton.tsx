'use client';

import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import AIMessageBar from '@/components/ui/ai-assistant';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from 'usehooks-ts';
import { cn } from "@/lib/utils";

const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      <Button
        onClick={toggleChat}
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-110 active:scale-95"
        aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
      >
        {isChatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {isChatOpen && (
        <div className={cn(
          "transition-all duration-300 ease-out",
          isMobile 
            ? "fixed inset-0 z-[51]"
            : "fixed bottom-24 right-6 z-40"
        )}>
          <AIMessageBar isFullScreen={isMobile} />
        </div>
      )}
    </>
  );
};

export default FloatingChatButton; 