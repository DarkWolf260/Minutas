import React, { memo, useState, useRef, useEffect } from 'react';
import {
  Check,
  CheckCheck,
  Send,
  Copy,
  Image as ImageIcon,
  ZoomIn,
  Download,
  X,
  Mic,
  FileText,
  Loader2,
  Play,
  Pause,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Report } from '@/lib/types';
import type { WhatsAppMessage } from '@/hooks/whatsapp';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface WhatsAppChatBubbleProps {
  report?: Report;
  message?: WhatsAppMessage;
  isSelected?: boolean;
  onSelectReport?: (id: string) => void;
  onSendReportToChat?: (report: Report) => void;
  isBotReady?: boolean;
  isGroup?: boolean;
}

function formatDisplayName(name?: string | null): string {
  if (!name) return '';
  const clean = name.trim();
  // Formatear números telefónicos venezolanos (+58 4xx-xxx-xxxx)
  const phoneMatch = clean.match(/^(\+?58)?(4\d{2})(\d{3})(\d{4})$/);
  if (phoneMatch) {
    return `+58 ${phoneMatch[2]}-${phoneMatch[3]}-${phoneMatch[4]}`;
  }
  // Si es un número numérico largo genérico sin formato
  if (/^\d{9,15}$/.test(clean)) {
    return `+${clean}`;
  }
  return clean;
}

function formatTime(timestamp?: string | number): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function downloadImage(url: string, filename = 'whatsapp-image.jpg') {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function WhatsAppImagePreview({
  mediaUrl,
  thumbnail,
  alt,
  onClick
}: {
  mediaUrl?: string | null;
  thumbnail?: string | null;
  alt?: string;
  onClick: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Intentar cargar mediaUrl primero; si no existe, usar thumbnail
  const initialSrc = mediaUrl || thumbnail;
  const [src, setSrc] = useState<string | null>(initialSrc || null);

  React.useEffect(() => {
    setSrc(mediaUrl || thumbnail || null);
    setHasError(false);
    setIsLoading(true);
  }, [mediaUrl, thumbnail]);

  const handleImageError = () => {
    // Si falló la descarga de resolución completa pero hay thumbnail, reintentar con thumbnail
    if (src === mediaUrl && thumbnail) {
      setSrc(thumbnail);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!src || (hasError && !thumbnail)) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-2 p-3 rounded-xl bg-black/5 dark:bg-black/20 text-xs text-muted-foreground hover:bg-black/10 transition-colors cursor-pointer"
      >
        <ImageIcon className="h-5 w-5 text-emerald-600 shrink-0" />
        <span className="truncate italic">Imagen multimedia (clic para abrir)</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-xl max-h-80 sm:max-h-96 flex items-center justify-center bg-black/5 dark:bg-black/30 group cursor-pointer"
    >
      {/* Indicador de carga progresiva */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-white/5 backdrop-blur-xs z-10">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      )}

      <img
        src={src}
        alt={alt || 'Imagen de WhatsApp'}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
        className={cn(
          'w-full max-h-80 sm:max-h-96 object-cover rounded-xl transition-all duration-300',
          'group-hover:scale-[1.015]',
          isLoading ? 'opacity-60 blur-xs' : 'opacity-100 blur-none'
        )}
      />

      {/* Botón flotante para ampliar imagen */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-md shadow-md scale-90 group-hover:scale-100 transition-transform">
          <ZoomIn className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function WhatsAppAudioPlayer({
  mediaUrl,
  isFromMe
}: {
  mediaUrl?: string | null;
  isFromMe: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
  }, [mediaUrl]);

  const togglePlay = () => {
    if (!audioRef.current || !mediaUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      audioRef.current.play().catch(err => {
        console.warn('Error reproduciendo audio:', err);
        setHasError(true);
        setIsLoading(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length]!;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!mediaUrl || hasError) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-xl bg-black/5 dark:bg-black/20 text-xs text-muted-foreground">
        <Mic className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="italic">Audio no disponible para reproducir</span>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-1 w-full min-w-[240px] sm:min-w-[270px]">
      <audio
        ref={audioRef}
        src={mediaUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />

      {/* Header con icono y selector de velocidad */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 px-0.5">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Mic className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span>Nota de voz</span>
        </div>

        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-emerald-800 dark:text-emerald-200 transition-colors"
          title="Cambiar velocidad de reproducción"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Barra de Controles y Duración */}
      <div className="flex items-center gap-2.5 pt-1 pb-0.5">
        {/* Botón Circular Grande de Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="h-10 w-10 rounded-full flex items-center justify-center shadow-xs shrink-0 transition-all active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white"
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Barra de Progreso y Tiempo */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={duration === 0}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-400 focus:outline-none"
              style={{
                background: `linear-gradient(to right, rgb(5 150 105) ${progressPercent}%, rgba(0, 0, 0, 0.15) ${progressPercent}%)`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono leading-none px-0.5">
            <span className="font-medium text-foreground/85">
              {formatSeconds(currentTime)}
            </span>
            <span>
              {formatSeconds(duration || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const WhatsAppChatBubble = memo(function WhatsAppChatBubble({
  report,
  message,
  isSelected,
  onSelectReport,
  onSendReportToChat,
  isBotReady,
  isGroup
}: WhatsAppChatBubbleProps) {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Scenario 1: Report / Novedad bubble
  if (report) {
    const isFinalizado = report.status?.toLowerCase() === 'finalizado';
    const photos = report.photos || [];
    const formattedTime = formatTime(report.timestamp);

    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      const textToCopy = `📋 *${report.title}*\n\n${report.content || ''}`.trim();
      navigator.clipboard.writeText(textToCopy);
      toast.success('Contenido copiado al portapapeles');
    };

    const handleSend = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSendReportToChat?.(report);
    };

    return (
      <>
        <div className="flex justify-end my-1.5 px-2 group">
          <div
            onClick={() => onSelectReport?.(report.id)}
            className={cn(
              'relative max-w-[88%] sm:max-w-[82%] rounded-2xl p-3 shadow-sm cursor-pointer transition-all border',
              'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef]',
              'rounded-tr-xs border-emerald-500/20 hover:border-emerald-500/50',
              isSelected && 'ring-2 ring-emerald-500 shadow-md scale-[1.01]'
            )}
          >
            {/* Header of Novedad: Title & Status */}
            <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-black/5 dark:border-white/10 pb-1">
              <span className="font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 line-clamp-1">
                {report.title}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={cn(
                    'text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                    isFinalizado
                      ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  )}
                >
                  {report.status || 'En proceso'}
                </span>
              </div>
            </div>

            {/* Photo Gallery preview (if report has photos) */}
            {photos.length > 0 && (
              <div className="mb-2">
                <div
                  className={cn(
                    'grid gap-1 rounded-xl overflow-hidden max-h-48 bg-black/5 dark:bg-black/20',
                    photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                  )}
                >
                  {photos.slice(0, 3).map((photo, i) => (
                    <div
                      key={photo.id || i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoUrl(photo.url);
                        setPreviewTitle(photo.name || report.title);
                      }}
                      className="relative aspect-video bg-muted overflow-hidden cursor-pointer group/img"
                    >
                      <img
                        src={photo.url}
                        alt={photo.name || 'Foto adjunta'}
                        className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                        loading="lazy"
                      />
                      {i === 2 && photos.length > 3 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                          +{photos.length - 3}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Content */}
            <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words pr-2">
              {report.content ? (
                report.content.length > 300 ? (
                  <>
                    {report.content.substring(0, 300)}...
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold ml-1">
                      [Ver más]
                    </span>
                  </>
                ) : (
                  report.content
                )
              ) : (
                <span className="italic text-muted-foreground">Sin descripción</span>
              )}
            </div>

            {/* Bottom row: Time, Ticks, Quick Actions */}
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px]">
              {/* Quick Actions on Hover */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copiar texto"
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {isBotReady && (
                  <button
                    type="button"
                    onClick={handleSend}
                    title="Enviar por WhatsApp"
                    className="p-1 rounded hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-0.5"
                  >
                    <Send className="h-2.5 w-2.5" />
                    <span className="text-[9px]">Enviar</span>
                  </button>
                )}
              </div>

              {/* Time & Delivery ticks */}
              <div className="flex items-center gap-1 text-muted-foreground/80 dark:text-white/60 ml-auto">
                <span>{formattedTime}</span>
                {isFinalizado ? (
                  <CheckCheck className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox Dialog */}
        <Dialog open={!!selectedPhotoUrl} onOpenChange={(open) => !open && setSelectedPhotoUrl(null)}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 border border-muted/20 bg-background/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
            <DialogHeader className="p-3.5 border-b border-border/50 bg-background/80 backdrop-blur-md flex flex-row items-center justify-between">
              <DialogTitle className="text-xs sm:text-sm font-semibold truncate pr-4">
                {previewTitle || 'Vista previa de imagen'}
              </DialogTitle>
              <div className="flex items-center gap-1">
                {selectedPhotoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => downloadImage(selectedPhotoUrl, `novedad-${Date.now()}.jpg`)}
                    title="Descargar imagen"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => setSelectedPhotoUrl(null)}
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="p-4 flex items-center justify-center bg-black/40 min-h-[50vh] max-h-[80vh] overflow-hidden">
              {selectedPhotoUrl && (
                <img
                  src={selectedPhotoUrl}
                  alt={previewTitle || 'Foto adjunta'}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Scenario 2: Real WhatsApp message bubble
  if (message) {
    const isFromMe = message.fromMe;
    const formattedTime = formatTime(message.timestamp);

    const isRevoked = Boolean(
      message.isRevoked ||
      message.type === 'revoked' ||
      message.body === 'Este mensaje fue eliminado' ||
      message.body === 'Eliminaste este mensaje'
    );

    const isImage =
      !isRevoked &&
      (message.type === 'image' ||
        message.type === 'sticker' ||
        (message.hasMedia && !['ptt', 'audio', 'document', 'video', 'call_log', 'revoked'].includes(message.type)));
    const isAudio = !isRevoked && (message.type === 'ptt' || message.type === 'audio');
    const isDocument = !isRevoked && message.type === 'document';

    const hasMediaPreview = Boolean(message.mediaUrl || message.thumbnail);

    return (
      <>
        <div
          className={cn(
            'flex my-1 px-2 group',
            isFromMe ? 'justify-end' : 'justify-start'
          )}
        >
          <div
            className={cn(
              'relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 shadow-sm border text-xs sm:text-sm',
              isAudio && 'min-w-[270px] sm:min-w-[310px]',
              isRevoked && 'opacity-85 select-none',
              isFromMe
                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-xs border-emerald-500/20'
                : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-xs border-border/40'
            )}
          >
            {/* Sender name for group chats only (incoming only, non-revoked) */}
            {!isFromMe && isGroup && message.senderName && !isRevoked && (
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                {formatDisplayName(message.senderName)}
              </div>
            )}

            {/* Mensaje Eliminado (Revoked) */}
            {isRevoked ? (
              <div className="flex items-center gap-1.5 py-0.5 text-muted-foreground/80 dark:text-muted-foreground/70 italic text-xs select-none">
                <Ban className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <span>{isFromMe ? 'Eliminaste este mensaje' : 'Este mensaje fue eliminado'}</span>
              </div>
            ) : (
              <>
                {/* Mensaje Respondido / Citado (Quoted Message) */}
                {message.quotedMsg && (
                  <div
                    className={cn(
                      'mb-1.5 p-1.5 sm:p-2 rounded-xl border-l-[3.5px] text-xs flex items-center justify-between gap-2 overflow-hidden select-none transition-colors',
                      isFromMe
                        ? 'bg-black/5 dark:bg-black/25 border-emerald-600 dark:border-emerald-400'
                        : 'bg-black/5 dark:bg-black/25 border-emerald-600 dark:border-emerald-400'
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-1">
                      {/* Remitente del mensaje citado */}
                      <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate">
                        {message.quotedMsg.fromMe ? 'Tú' : formatDisplayName(message.quotedMsg.senderName) || 'Contacto'}
                      </div>

                      {/* Contenido / extracto del mensaje citado */}
                      <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        {message.quotedMsg.isRevoked ? (
                          <span className="italic flex items-center gap-1 text-muted-foreground/70">
                            <Ban className="h-3 w-3 shrink-0" />
                            Este mensaje fue eliminado
                          </span>
                        ) : (
                          <>
                            {message.quotedMsg.hasMedia && !message.quotedMsg.body && (
                              <span className="flex items-center gap-1">
                                <ImageIcon className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>Foto</span>
                              </span>
                            )}
                            {message.quotedMsg.body && (
                              <span className="truncate">{message.quotedMsg.body}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Miniatura si el mensaje respondido tenía foto */}
                    {message.quotedMsg.hasMedia && (message.quotedMsg.thumbnail || message.quotedMsg.mediaUrl) && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const target = message.quotedMsg?.mediaUrl || message.quotedMsg?.thumbnail;
                          if (target) {
                            setSelectedPhotoUrl(target);
                            setPreviewTitle(message.quotedMsg?.body || 'Foto del mensaje respondido');
                          }
                        }}
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg bg-black/10 dark:bg-white/10 shrink-0 overflow-hidden cursor-pointer group/qthumb relative border border-black/5"
                        title="Ver foto citada"
                      >
                        <img
                          src={message.quotedMsg.thumbnail || message.quotedMsg.mediaUrl || ''}
                          alt="Foto respondida"
                          className="w-full h-full object-cover transition-transform group-hover/qthumb:scale-105"
                          onError={(e) => {
                            if (message.quotedMsg?.thumbnail && e.currentTarget.src !== message.quotedMsg.thumbnail) {
                              e.currentTarget.src = message.quotedMsg.thumbnail;
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Render Imagen real */}
                {isImage && (
                  <div className="mb-1.5">
                    <WhatsAppImagePreview
                      mediaUrl={message.mediaUrl}
                      thumbnail={message.thumbnail}
                      alt={message.body || 'Imagen de WhatsApp'}
                      onClick={() => {
                        const target = message.mediaUrl || message.thumbnail;
                        if (target) {
                          setSelectedPhotoUrl(target);
                          setPreviewTitle(message.body || (message.senderName ? `Foto de ${message.senderName}` : 'Foto de WhatsApp'));
                        }
                      }}
                    />
                  </div>
                )}

                {/* Audio / Nota de voz */}
                {isAudio && (
                  <WhatsAppAudioPlayer
                    mediaUrl={message.mediaUrl}
                    isFromMe={isFromMe}
                  />
                )}

                {/* Documento */}
                {isDocument && (
                  <div className="flex items-center gap-2.5 p-2.5 mb-1.5 rounded-xl bg-black/5 dark:bg-black/20 text-xs">
                    <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{message.body || 'Documento adjunto'}</div>
                      <span className="text-[10px] text-muted-foreground">Documento</span>
                    </div>
                    {message.mediaUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full shrink-0"
                        onClick={() => downloadImage(message.mediaUrl!, 'documento')}
                        title="Descargar documento"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Placeholder fallback para otros tipos no reconocidos */}
                {message.hasMedia && !isImage && !isAudio && !isDocument && (
                  <div className="flex items-center gap-2 p-2 mb-1.5 rounded-lg bg-black/5 dark:bg-black/20 text-xs">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                    <span className="italic text-muted-foreground">Archivo multimedia</span>
                  </div>
                )}

                {/* Message text / caption */}
                {message.body && (
                  <div className="whitespace-pre-wrap break-words leading-relaxed pr-2">
                    {message.body}
                  </div>
                )}
              </>
            )}

            {/* Timestamp and delivery ticks */}
            <div
              className={cn(
                'flex items-center justify-end gap-1 mt-1 text-[10px]',
                !message.body && !message.quotedMsg && isImage && hasMediaPreview
                  ? 'absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm z-10'
                  : 'text-muted-foreground/80 dark:text-white/60'
              )}
            >
              <span>{formattedTime}</span>
              {isFromMe && !isRevoked && (
                message.ack && message.ack >= 3 ? (
                  <CheckCheck className={cn('h-3.5 w-3.5', message.ack === 4 ? 'text-blue-500' : '')} />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )
              )}
            </div>
          </div>
        </div>

        {/* Lightbox Dialog for Real WhatsApp Images */}
        <Dialog open={!!selectedPhotoUrl} onOpenChange={(open) => !open && setSelectedPhotoUrl(null)}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 border border-muted/20 bg-background/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
            <DialogHeader className="p-3.5 border-b border-border/50 bg-background/80 backdrop-blur-md flex flex-row items-center justify-between">
              <DialogTitle className="text-xs sm:text-sm font-semibold truncate pr-4">
                {previewTitle || 'Vista previa de imagen'}
              </DialogTitle>
              <div className="flex items-center gap-1">
                {selectedPhotoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => downloadImage(selectedPhotoUrl, `whatsapp-${Date.now()}.jpg`)}
                    title="Descargar imagen"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={() => setSelectedPhotoUrl(null)}
                  title="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="p-4 flex items-center justify-center bg-black/40 min-h-[50vh] max-h-[80vh] overflow-hidden">
              {selectedPhotoUrl && (
                <img
                  src={selectedPhotoUrl}
                  alt={previewTitle || 'Imagen ampliada'}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
});
