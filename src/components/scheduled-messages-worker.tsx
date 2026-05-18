'use client';

import { useScheduledMessages } from '@/hooks/use-scheduled-messages';

export function ScheduledMessagesWorker() {
  // This hook runs the background worker to check and send messages
  useScheduledMessages();
  
  // This component doesn't render anything
  return null;
}
