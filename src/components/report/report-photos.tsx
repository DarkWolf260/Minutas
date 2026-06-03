import React, { useState, useRef, useCallback } from 'react';
import { Camera, Trash2, Plus, Eye, FileImage, Pencil, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ReportPhoto } from '@/lib/types';
import { toast } from 'sonner';
import { PhotoEditor } from './photo-editor';

interface ReportPhotosProps {
  photos: ReportPhoto[];
  onChange: (photos: ReportPhoto[]) => void;
  disabled?: boolean;
}

// Helper function to compress images using Canvas with high quality preservation
const compressImage = (file: File, maxWidth = 2048, maxHeight = 2048, quality = 0.9): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const ReportPhotos: React.FC<ReportPhotosProps> = ({
  photos = [],
  onChange,
  disabled = false,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<ReportPhoto | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<ReportPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Use a counter to handle nested drag enter/leave events correctly
  const dragCounterRef = useRef(0);

  const processFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const loadingToast = toast.loading('Procesando y comprimiendo imágenes...');
    const newPhotos: ReportPhoto[] = [...photos];
    let added = 0;

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`El archivo "${file.name}" no es una imagen válida.`);
          continue;
        }

        const MAX_FILE_SIZE_MB = 10;
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(`El archivo "${file.name}" excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB.`);
          continue;
        }

        const compressedBase64 = await compressImage(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: compressedBase64,
          name: file.name,
          description: '',
        });
        added++;
      }

      if (added > 0) {
        onChange(newPhotos);
        toast.success(
          added === 1 ? 'Imagen añadida al reporte.' : `${added} imágenes añadidas al reporte.`,
          { id: loadingToast }
        );
      } else {
        toast.dismiss(loadingToast);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar las imágenes.', { id: loadingToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [photos, onChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(Array.from(e.target.files || []));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (disabled) return;
    await processFiles(Array.from(e.dataTransfer.files));
  };

  const handleDescriptionChange = (photoId: string, description: string) => {
    onChange(photos.map((p) => (p.id === photoId ? { ...p, description } : p)));
  };

  const handleRemovePhoto = (photoId: string) => {
    onChange(photos.filter((p) => p.id !== photoId));
    toast.success('Foto eliminada del reporte.');
  };

  // Drag event props shared between zones
  const dropZoneProps = disabled
    ? {}
    : {
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
      };

  return (
    <div className="space-y-6 pt-4 border-t border-muted/20" id="report-photos-section">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary animate-pulse" />
            Evidencias Fotográficas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Añade imágenes de soporte al reporte. Puedes arrastrarlas directamente aquí.
          </p>
        </div>

        {!disabled && (
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
              id="report-photo-upload"
              name="report-photo-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto relative overflow-hidden group shadow-sm border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 rounded-xl px-4 py-2 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4 text-primary transition-transform group-hover:rotate-90 duration-300" />
              <span>Añadir Fotos</span>
            </Button>
          </div>
        )}
      </div>

      {/* ── Empty state / full drop zone ─────────────────────────────────────── */}
      {photos.length === 0 ? (
        <div {...dropZoneProps}>
          <Card
            className={`border-2 border-dashed rounded-2xl transition-all duration-200 ${!disabled ? 'cursor-pointer' : ''}
              ${isDragging
                ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]'
                : 'border-muted/40 bg-muted/5 hover:bg-muted/10 hover:border-muted/60'
              }`}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center justify-center py-12 text-center select-none">
              {isDragging ? (
                <>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary animate-bounce">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold text-primary">Suelta las imágenes aquí</p>
                  <p className="text-xs text-primary/70 mt-1">Se añadirán automáticamente al reporte</p>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-4 text-muted-foreground/60">
                    <FileImage className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No hay fotos en este reporte</p>
                  {!disabled && (
                    <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-[260px]">
                      Haz clic o{' '}
                      <span className="font-semibold text-primary/80">arrastra imágenes</span>{' '}
                      aquí para añadirlas
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ── Grid + bottom drop strip ────────────────────────────────────────── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <Card
                key={photo.id}
                className="group overflow-hidden border border-muted/20 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative"
              >
                {/* Image Preview */}
                <div className="relative aspect-video min-h-[160px] w-full bg-muted/30 overflow-hidden flex items-center justify-center">
                  <img
                    src={photo.url}
                    alt={photo.name || 'Evidencia'}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 rounded-xl shadow-lg bg-background/90 text-foreground hover:bg-background"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {!disabled && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-xl shadow-lg bg-background/90 text-foreground hover:bg-background"
                        onClick={() => setEditingPhoto(photo)}
                        title="Editar Imagen (Pixelear / Dibujar)"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}

                    {!disabled && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-9 w-9 rounded-xl shadow-lg bg-destructive/90 text-destructive-foreground hover:bg-destructive"
                        onClick={() => handleRemovePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Caption */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                  <Input
                    type="text"
                    placeholder="Añadir pie de foto / descripción..."
                    value={photo.description || ''}
                    onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                    disabled={disabled}
                    className="h-8 text-xs border-muted/30 focus-visible:ring-primary/40 rounded-lg px-2 bg-muted/10 focus:bg-background"
                    id={`photo-desc-${photo.id}`}
                    name={`photo-desc-${photo.id}`}
                  />
                  {photo.name && (
                    <span className="text-[10px] text-muted-foreground/60 truncate" title={photo.name}>
                      {photo.name}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Drop strip */}
          {!disabled && (
            <div
              {...dropZoneProps}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                flex items-center justify-center gap-3 py-4 px-6 select-none
                ${isDragging
                  ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_hsl(var(--primary)/0.12)] text-primary'
                  : 'border-muted/30 text-muted-foreground/60 hover:border-primary/40 hover:text-primary/70 hover:bg-primary/[0.03]'
                }`}
            >
              {isDragging ? (
                <UploadCloud className="h-5 w-5 animate-bounce shrink-0" />
              ) : (
                <Plus className="h-4 w-4 shrink-0" />
              )}
              <span className="text-xs font-medium">
                {isDragging
                  ? 'Suelta aquí para añadir más imágenes'
                  : 'Arrastrar o hacer clic para añadir más fotos'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-4xl p-0 border border-muted/20 bg-background/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="p-4 border-b border-muted/10 absolute top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-10 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-semibold truncate pr-8">
              {selectedPhoto?.description || selectedPhoto?.name || 'Vista previa de evidencia'}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-14 pb-4 px-4 flex flex-col items-center justify-center bg-black/5 min-h-[50vh] max-h-[80vh] overflow-y-auto">
            {selectedPhoto && (
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.description || 'Evidencia'}
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-muted/15"
              />
            )}
            {selectedPhoto?.description && (
              <p className="mt-4 text-sm font-medium text-center text-foreground/90 max-w-xl bg-card border border-muted/20 rounded-xl px-4 py-2 shadow-sm">
                {selectedPhoto.description}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Photo Editor ─────────────────────────────────────────────────────── */}
      {editingPhoto && (
        <PhotoEditor
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          photoUrl={editingPhoto.url}
          photoName={editingPhoto.name}
          onSave={(updatedUrl) => {
            onChange(photos.map((p) => (p.id === editingPhoto.id ? { ...p, url: updatedUrl } : p)));
          }}
        />
      )}
    </div>
  );
};
