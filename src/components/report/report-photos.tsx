import React, { useState, useRef } from 'react';
import { Camera, Trash2, X, Plus, Eye, FileImage, Pencil } from 'lucide-react';
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

        // Calculate new dimensions
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const loadingToast = toast.loading('Procesando y comprimiendo imágenes...');
    const newPhotos: ReportPhoto[] = [...photos];

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`El archivo ${file.name} no es una imagen válida.`);
          continue;
        }

        // Limit original file size to 10MB to avoid browser performance hits
        const MAX_FILE_SIZE_MB = 10;
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(`El archivo ${file.name} excede el tamaño máximo permitido de ${MAX_FILE_SIZE_MB}MB.`);
          continue;
        }

        // Compress image using canvas
        const compressedBase64 = await compressImage(file);
        
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: compressedBase64,
          name: file.name,
          description: '',
        });
      }
      
      onChange(newPhotos);
      toast.success('Imágenes añadidas exitosamente', { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar las imágenes.', { id: loadingToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDescriptionChange = (photoId: string, description: string) => {
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, description } : p
    );
    onChange(updated);
  };

  const handleRemovePhoto = (photoId: string) => {
    const updated = photos.filter((p) => p.id !== photoId);
    onChange(updated);
    toast.success('Foto eliminada del reporte.');
  };

  return (
    <div className="space-y-6 pt-4 border-t border-muted/20" id="report-photos-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary animate-pulse" />
            Evidencias Fotográficas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Añade imágenes de soporte al reporte. Las imágenes se almacenan localmente y de forma optimizada.
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

      {photos.length === 0 ? (
        <Card className="border border-dashed border-muted/30 bg-muted/5 rounded-2xl transition-all hover:bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center mb-4 text-muted-foreground/60">
              <FileImage className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No hay fotos en este reporte</p>
            {!disabled && (
              <p className="text-xs text-muted-foreground/80 mt-1 max-w-[280px]">
                Haz clic en "Añadir Fotos" arriba para capturar o subir imágenes de soporte.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <Card
              key={photo.id}
              className="group overflow-hidden border border-muted/20 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video min-h-[160px] w-full bg-muted/30 overflow-hidden flex items-center justify-center">
                <img
                  src={photo.url}
                  alt={photo.name || 'Evidencia'}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                  loading="lazy"
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

              {/* Caption details */}
              <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                <Input
                  type="text"
                  placeholder="Añadir pie de foto / descripción..."
                  value={photo.description || ''}
                  onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-xs border-muted/30 focus-visible:ring-primary/40 rounded-lg px-2 bg-muted/10 focus:bg-background"
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
      )}

      {/* Lightbox / Preview Dialog */}
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

      {/* Interactive Photo Editor Modal (Pen, Pixelation, Undo, Colors) */}
      {editingPhoto && (
        <PhotoEditor
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          photoUrl={editingPhoto.url}
          photoName={editingPhoto.name}
          onSave={(updatedUrl) => {
            const updated = photos.map((p) =>
              p.id === editingPhoto.id ? { ...p, url: updatedUrl } : p
            );
            onChange(updated);
          }}
        />
      )}
    </div>
  );
};
