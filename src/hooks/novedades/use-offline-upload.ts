'use client';

import { useEffect, useRef } from 'react';
import { useDatabase } from '@/lib/db/db-context';
import { OfflinePhotosDB } from '@/lib/offline-photos';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Replace non-safe URL chars with underscore
    .replace(/__+/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores
}

/**
 * Background hook that monitors local RxDB reports.
 * When online, it uploads any photos marked as `pending_upload` to Supabase Storage,
 * updates the report url in the database, and clears the local offline IndexedDB cache.
 */
export function useOfflineUpload() {
  const db = useDatabase();
  const uploadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!db) return;

    let active = true;

    // Monitor reports collection for changes
    const sub = db.reports.find().$.subscribe(async (reports) => {
      if (!navigator.onLine) return;

      for (const reportDoc of reports) {
        if (!active) break;
        const report = reportDoc.toJSON();
        const photos = report.photos || [];
        
        // Find photos that need to be uploaded
        // Either they have pending_upload = true, or their URL is still a blob URL (self-healing)
        const pendingPhotos = photos.filter(p => 
          (p.pending_upload && p.local_blob_id) || 
          (p.url && p.url.startsWith('blob:'))
        );
        if (pendingPhotos.length === 0) continue;

        let updatedPhotos = [...photos];
        let hasChanges = false;

        for (const photo of pendingPhotos) {
          const photoId = photo.id;
          
          // Prevent duplicate concurrent uploads for the same photo
          if (uploadingRef.current.has(photoId)) continue;
          uploadingRef.current.add(photoId);

          try {
            let blob: Blob | null = null;

            // 1. Try to load from OfflinePhotosDB
            if (photo.local_blob_id) {
              blob = await OfflinePhotosDB.get(photo.local_blob_id);
            }
            if (!blob) {
              blob = await OfflinePhotosDB.get(photoId);
            }



            if (!blob) {
              // We don't have the binary data on this device.
              // Just skip and let the original device handle it when it logs in.
              uploadingRef.current.delete(photoId);
              continue;
            }

            logger.info(`Uploading photo to Supabase Storage (Self-healing/Sync): ${photoId}`);
            
            // Upload to Supabase Storage using the custom filename (sanitized)
            const filePath = sanitizeFilename(photo.name || `${photoId}.jpg`);
            
            const { data, error } = await supabase.storage
              .from('activity-images')
              .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: true
              });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('activity-images')
              .getPublicUrl(filePath);

            // Update photo URL and clean offline flags
            updatedPhotos = updatedPhotos.map(p => 
              p.id === photoId 
                ? { ...p, url: publicUrl, pending_upload: false, local_blob_id: undefined } 
                : p
            );
            hasChanges = true;

            // Delete the file from local IndexedDB if it was there
            if (photo.local_blob_id) {
              await OfflinePhotosDB.delete(photo.local_blob_id);
            }
            await OfflinePhotosDB.delete(photoId);
            
            logger.info(`Photo uploaded and cleaned up: ${photoId}`);
            toast.success(`Imagen "${photo.name || 'Evidencia'}" sincronizada en la nube.`);
          } catch (err) {
            logger.error(`Failed to upload photo: ${photoId}`, err);
          } finally {
            uploadingRef.current.delete(photoId);
          }
        }

        if (hasChanges && active) {
          try {
            // Update the report doc in RxDB (this will trigger replication push to Supabase)
            await db.reports.upsert({
              ...(report as any),
              photos: updatedPhotos,
              modified: new Date().toISOString()
            });
          } catch (dbErr) {
            logger.error('Failed to update report with synced photos:', dbErr);
          }
        }
      }
    });

    const handleOnline = () => {
      logger.info('Network is back online, triggering background upload sync...');
    };

    window.addEventListener('online', handleOnline);

    return () => {
      active = false;
      sub.unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, [db]);
}
