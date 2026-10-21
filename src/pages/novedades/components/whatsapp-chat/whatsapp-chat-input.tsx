import React, { useRef, useEffect } from 'react';
import { Send, Plus, Loader2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UseWhatsAppChatReturn } from '@/hooks/whatsapp';

interface WhatsAppChatInputProps {
  chatHook: UseWhatsAppChatReturn;
  onOpenCreateDialog?: () => void;
}

export function WhatsAppChatInput({
  chatHook,
  onOpenCreateDialog
}: WhatsAppChatInputProps) {
  const {
    messageText,
    setMessageText,
    handleSendMessage,
    isSending,
    activeChatId,
    currentChat,
    isBotReady,
    guardiaAbierta
  } = chatHook;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messageText.trim() && !isSending) {
        handleSendMessage();
      }
    }
  };

  const isRealChatWithoutBot = !currentChat.isGuardNovedades && !isBotReady;

  return (
    <div className="p-2 sm:p-3 border-t bg-card/95 backdrop-blur-sm z-10 space-y-1.5">
      {/* Notice if trying to type into a real WhatsApp chat but bot is offline */}
      {isRealChatWithoutBot && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>Bot de WhatsApp desconectado. Inicia el bot para enviar a este chat.</span>
        </div>
      )}

      <div className="flex items-end gap-1.5 sm:gap-2">
        {/* Template / New Novedad Quick Button */}
        {onOpenCreateDialog && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenCreateDialog}
            disabled={!guardiaAbierta}
            title="Crear nueva novedad oficial (Plantilla)"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        {/* Text Input Area */}
        <div className="flex-1 relative bg-muted/60 focus-within:bg-background border rounded-2xl transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || isRealChatWithoutBot}
            placeholder={
              currentChat.isGuardNovedades
                ? 'Escribe un mensaje o nota rápida...'
                : `Mensaje para ${currentChat.name}...`
            }
            className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm resize-none focus:outline-none max-h-24 min-h-[36px] placeholder:text-muted-foreground/60 leading-normal"
          />
        </div>

        {/* Send Button */}
        <Button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!messageText.trim() || isSending || isRealChatWithoutBot}
          size="icon"
          className={cn(
            'h-9 w-9 rounded-full shrink-0 shadow-sm transition-all',
            'bg-emerald-600 hover:bg-emerald-700 text-white',
            (!messageText.trim() || isSending || isRealChatWithoutBot) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 ml-0.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
