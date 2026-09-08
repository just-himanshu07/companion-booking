'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Star,
  UploadCloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  FileImage,
} from 'lucide-react';

interface AdminPhotoManagerProps {
  userId: string;
  userRole?: string;
  initialPrimaryPhoto: string | null;
  initialGalleryPhotos?: string[];
  onPhotosChange?: (photos: { primaryPhoto: string | null; galleryPhotos: string[] }) => void;
}

interface PendingItem {
  id: string;
  file: File;
  previewUrl: string;
  target: 'primary' | 'gallery';
  slotIndex?: number;
  slotLabel: string;
  status: 'WAITING' | 'UPLOADING' | 'UPLOADED' | 'FAILED' | 'CANCELLED';
  progress: number; // 0..100
  uploadedBytes: number;
  totalBytes: number;
  error?: string;
  validationError?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function AdminPhotoManager({
  userId,
  userRole = 'USER',
  initialPrimaryPhoto,
  initialGalleryPhotos = [],
  onPhotosChange,
}: AdminPhotoManagerProps) {
  const [primaryPhoto, setPrimaryPhoto] = useState<string | null>(initialPrimaryPhoto);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(initialGalleryPhotos);

  // Sync state if props change from outside
  useEffect(() => {
    setPrimaryPhoto(initialPrimaryPhoto);
  }, [initialPrimaryPhoto]);

  useEffect(() => {
    setGalleryPhotos(initialGalleryPhotos || []);
  }, [initialGalleryPhotos]);

  // Multi-File Pending Queue & Progress States
  const [pendingQueue, setPendingQueue] = useState<PendingItem[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [slotLimitNotice, setSlotLimitNotice] = useState<string | null>(null);

  // Single Slot Action States (Replace / Remove / Promote)
  const [singleActionLoading, setSingleActionLoading] = useState(false);
  const [replacingTarget, setReplacingTarget] = useState<{ target: 'primary' | 'gallery'; slotIndex?: number } | null>(null);

  // Notifications
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  // Removal Confirmation Modal
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    target: 'primary' | 'gallery';
    slotIndex?: number;
  } | null>(null);

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  const totalCurrentPhotosCount = (primaryPhoto ? 1 : 0) + galleryPhotos.length;
  const availableSlotsCount = Math.max(0, 5 - totalCurrentPhotosCount);

  /**
   * Helper: Calculate next available slot targets
   */
  const getAvailableSlotTargets = (
    currentPrimary: string | null,
    currentGallery: string[],
    existingQueue: PendingItem[]
  ) => {
    const targets: Array<{ target: 'primary' | 'gallery'; slotIndex?: number; label: string }> = [];

    const isPrimaryOccupied = !!currentPrimary || existingQueue.some((q) => q.target === 'primary');
    if (!isPrimaryOccupied) {
      targets.push({ target: 'primary', label: 'Primary Photo (Photo 1)' });
    }

    for (let i = 0; i < 4; i++) {
      const isGallerySlotOccupied = !!currentGallery[i] || existingQueue.some((q) => q.target === 'gallery' && q.slotIndex === i);
      if (!isGallerySlotOccupied) {
        targets.push({ target: 'gallery', slotIndex: i, label: `Photo ${i + 2}` });
      }
    }

    return targets;
  };

  /**
   * 1. Multi-Select File Handler
   */
  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralError(null);
    setGeneralSuccess(null);
    setSlotLimitNotice(null);

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset input value so same files can be re-selected if needed
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';

    const availableTargets = getAvailableSlotTargets(primaryPhoto, galleryPhotos, pendingQueue);
    const capacity = availableTargets.length;

    if (capacity <= 0) {
      setGeneralError('All 5 photo slots are currently filled. Remove or replace an existing photo to upload new ones.');
      return;
    }

    let filesToProcess = files;
    if (files.length > capacity) {
      filesToProcess = files.slice(0, capacity);
      setSlotLimitNotice(`Only ${capacity} photo slot(s) available. The first ${capacity} photo(s) were added to your upload queue.`);
    }

    const newPendingItems: PendingItem[] = filesToProcess.map((file, idx) => {
      const targetSlot = availableTargets[idx];
      const previewUrl = URL.createObjectURL(file);
      const mimeType = (file.type || '').toLowerCase();
      let valErr: string | undefined = undefined;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        valErr = `File "${file.name}" is larger than 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`;
      } else if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        valErr = `File "${file.name}" has invalid format. Only JPG, PNG, and WEBP are allowed.`;
      }

      return {
        id: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        target: targetSlot.target,
        slotIndex: targetSlot.slotIndex,
        slotLabel: targetSlot.label,
        status: valErr ? 'FAILED' : 'WAITING',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        validationError: valErr,
        error: valErr,
      };
    });

    setPendingQueue((prev) => [...prev, ...newPendingItems]);
  };

  /**
   * Remove single pending file from pre-upload queue
   */
  const handleRemovePendingItem = (id: string) => {
    setPendingQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  /**
   * Cancel all pending items
   */
  const handleCancelAllPending = () => {
    pendingQueue.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setPendingQueue([]);
    setSlotLimitNotice(null);
    setGeneralError(null);
  };

  /**
   * 2. Real-Time XHR Upload Engine
   */
  const uploadSingleFileXHR = (item: PendingItem): Promise<{ primaryPhoto: string | null; galleryPhotos: string[] }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('file', item.file);
      formData.append('target', item.target);
      if (item.slotIndex !== undefined) {
        formData.append('slotIndex', item.slotIndex.toString());
      }

      // Progress Event Listener
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setPendingQueue((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    status: 'UPLOADING',
                    uploadedBytes: e.loaded,
                    totalBytes: e.total,
                    progress: Math.round((e.loaded / e.total) * 100),
                  }
                : p
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setPendingQueue((prev) =>
              prev.map((p) =>
                p.id === item.id
                  ? {
                      ...p,
                      status: 'UPLOADED',
                      progress: 100,
                      uploadedBytes: item.totalBytes,
                    }
                  : p
              )
            );
            resolve({ primaryPhoto: data.primaryPhoto, galleryPhotos: data.galleryPhotos || [] });
          } catch (err) {
            reject(new Error('Invalid response payload from server'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error || `Upload failed with HTTP ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network connection error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload request timed out'));

      xhr.open('POST', '/api/admin/photos', true);
      xhr.send(formData);
    });
  };

  /**
   * Execute Batch Upload (with concurrency pool = 2)
   */
  const handleExecuteBatchUpload = async () => {
    const itemsToUpload = pendingQueue.filter((item) => item.status === 'WAITING' || item.status === 'FAILED');
    if (itemsToUpload.length === 0) return;

    // Check if any items have validation errors
    const invalidItem = itemsToUpload.find((item) => item.validationError);
    if (invalidItem) {
      setGeneralError(`Cannot start upload: ${invalidItem.validationError}`);
      return;
    }

    setIsUploadingBatch(true);
    setGeneralError(null);
    setGeneralSuccess(null);

    // Concurrency queue runner
    const queue = [...itemsToUpload];
    const CONCURRENCY = 2;

    let latestPrimary = primaryPhoto;
    let latestGallery = galleryPhotos;

    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        // Reset progress state for execution
        setPendingQueue((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'UPLOADING', progress: 0, error: undefined } : p))
        );

        try {
          const result = await uploadSingleFileXHR(item);
          latestPrimary = result.primaryPhoto;
          latestGallery = result.galleryPhotos;

          setPrimaryPhoto(result.primaryPhoto);
          setGalleryPhotos(result.galleryPhotos);

          if (onPhotosChange) {
            onPhotosChange({
              primaryPhoto: result.primaryPhoto,
              galleryPhotos: result.galleryPhotos,
            });
          }
        } catch (err: any) {
          setPendingQueue((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, status: 'FAILED', error: err.message || 'Upload failed' } : p))
          );
        }
      }
    };

    // Run workers concurrently
    const workers = Array.from({ length: Math.min(CONCURRENCY, itemsToUpload.length) }, () => worker());
    await Promise.all(workers);

    setIsUploadingBatch(false);

    // Evaluate final queue state
    setPendingQueue((currentQueue) => {
      const allUploaded = currentQueue.every((q) => q.status === 'UPLOADED');
      const failedCount = currentQueue.filter((q) => q.status === 'FAILED').length;

      if (allUploaded) {
        setGeneralSuccess(`✓ All ${currentQueue.length} photo(s) uploaded successfully!`);
        setTimeout(() => {
          handleCancelAllPending();
        }, 2000);
      } else if (failedCount > 0) {
        setGeneralError(`Upload finished with ${failedCount} error(s). Successfully uploaded photos are saved. You can retry failed items.`);
      }

      return currentQueue;
    });
  };

  /**
   * 3. Single Slot Replacement Handler
   */
  const handleSingleReplaceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingTarget) return;

    if (singleFileInputRef.current) singleFileInputRef.current.value = '';

    setSingleActionLoading(true);
    setGeneralError(null);
    setGeneralSuccess(null);

    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('file', file);
      formData.append('target', replacingTarget.target);
      if (replacingTarget.slotIndex !== undefined) {
        formData.append('slotIndex', replacingTarget.slotIndex.toString());
      }

      const res = await fetch('/api/admin/photos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to replace photo');

      setPrimaryPhoto(data.primaryPhoto);
      setGalleryPhotos(data.galleryPhotos || []);

      if (onPhotosChange) {
        onPhotosChange({
          primaryPhoto: data.primaryPhoto,
          galleryPhotos: data.galleryPhotos || [],
        });
      }

      setGeneralSuccess(
        replacingTarget.target === 'primary'
          ? 'Primary Profile Photo replaced successfully!'
          : `Photo ${ (replacingTarget.slotIndex || 0) + 2 } replaced successfully!`
      );
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to replace photo');
    } finally {
      setSingleActionLoading(false);
      setReplacingTarget(null);
    }
  };

  /**
   * 4. Promote Gallery Photo to Primary
   */
  const handleMakePrimary = async (galleryIndex: number) => {
    setSingleActionLoading(true);
    setGeneralError(null);
    setGeneralSuccess(null);

    try {
      const res = await fetch('/api/admin/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'PROMOTE_TO_PRIMARY',
          galleryIndex,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to promote photo');

      setPrimaryPhoto(data.primaryPhoto);
      setGalleryPhotos(data.galleryPhotos || []);

      if (onPhotosChange) {
        onPhotosChange({
          primaryPhoto: data.primaryPhoto,
          galleryPhotos: data.galleryPhotos || [],
        });
      }

      setGeneralSuccess('Selected gallery photo promoted to Primary Profile Photo!');
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to promote photo');
    } finally {
      setSingleActionLoading(false);
    }
  };

  /**
   * 5. Remove Photo Handler
   */
  const handleRemovePhoto = async () => {
    if (!removeConfirm) return;

    setSingleActionLoading(true);
    setGeneralError(null);
    setGeneralSuccess(null);

    try {
      const res = await fetch('/api/admin/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          target: removeConfirm.target,
          slotIndex: removeConfirm.slotIndex,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove photo');

      setPrimaryPhoto(data.primaryPhoto);
      setGalleryPhotos(data.galleryPhotos || []);

      if (onPhotosChange) {
        onPhotosChange({
          primaryPhoto: data.primaryPhoto,
          galleryPhotos: data.galleryPhotos || [],
        });
      }

      setGeneralSuccess('Photo removed successfully!');
      setRemoveConfirm(null);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to remove photo');
    } finally {
      setSingleActionLoading(false);
    }
  };

  // Overall Batch Calculations
  const totalBatchBytes = pendingQueue.reduce((acc, item) => acc + item.totalBytes, 0);
  const uploadedBatchBytes = pendingQueue.reduce((acc, item) => acc + item.uploadedBytes, 0);
  const overallProgressPercent = totalBatchBytes > 0 ? Math.round((uploadedBatchBytes / totalBatchBytes) * 100) : 0;
  const completedCount = pendingQueue.filter((item) => item.status === 'UPLOADED').length;
  const failedCount = pendingQueue.filter((item) => item.status === 'FAILED').length;
  const hasValidationErrors = pendingQueue.some((item) => item.validationError);

  const gallerySlotIndices = [0, 1, 2, 3];

  return (
    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-5 text-xs">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={multiFileInputRef}
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleMultiFileSelect}
        className="hidden"
      />

      <input
        type="file"
        ref={singleFileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleSingleReplaceSelect}
        className="hidden"
      />

      {/* HEADER & MULTI-UPLOAD TRIGGER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Camera className="w-4.5 h-4.5 text-purple-600" /> Admin Profile Photos Management ({userRole})
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {totalCurrentPhotosCount}/5 slots filled (1 Primary Photo + up to 4 Gallery Photos). Select up to 5 photos at once.
          </p>
        </div>

        <button
          type="button"
          onClick={() => multiFileInputRef.current?.click()}
          disabled={isUploadingBatch || availableSlotsCount === 0}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
            availableSlotsCount === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 active:scale-95 text-white'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          {availableSlotsCount === 0 ? 'All 5 Slots Filled' : '+ Upload Photos (Multi-Select)'}
        </button>
      </div>

      {/* NOTIFICATIONS & WARNING BANNERS */}
      {slotLimitNotice && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="flex-1">{slotLimitNotice}</span>
          <button onClick={() => setSlotLimitNotice(null)} className="text-amber-500 hover:text-amber-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {generalError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="flex-1">{generalError}</span>
          <button onClick={() => setGeneralError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {generalSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="flex-1">{generalSuccess}</span>
          <button onClick={() => setGeneralSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* REMOVAL CONFIRMATION SUB-MODAL */}
      {removeConfirm && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <div className="font-bold text-rose-800 flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600" /> Confirm Photo Removal
          </div>
          <p className="text-xs text-rose-700">
            Are you sure you want to remove this {removeConfirm.target === 'primary' ? 'Primary Profile' : `Gallery (Photo ${ (removeConfirm.slotIndex || 0) + 2 })`} photo?
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setRemoveConfirm(null)}
              disabled={singleActionLoading}
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRemovePhoto}
              disabled={singleActionLoading}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {singleActionLoading ? 'Removing...' : 'Confirm Remove'}
            </button>
          </div>
        </div>
      )}

      {/* PRE-UPLOAD SELECTED PHOTOS DRAWER & REAL-TIME PROGRESS CENTER */}
      {pendingQueue.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-purple-200 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-3">
            <div>
              <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                <FileImage className="w-4 h-4 text-purple-600" /> Selected Photos ({pendingQueue.length})
              </h5>
              <p className="text-[10px] text-slate-500">
                Review assigned target slots and validation state before uploading.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelAllPending}
                disabled={isUploadingBatch}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel All
              </button>

              <button
                type="button"
                onClick={handleExecuteBatchUpload}
                disabled={isUploadingBatch || hasValidationErrors}
                className={`px-4 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer ${
                  isUploadingBatch || hasValidationErrors
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : failedCount > 0
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isUploadingBatch ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                  </>
                ) : failedCount > 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Failed Uploads
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" /> Upload {pendingQueue.length} Photo{pendingQueue.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* OVERALL BATCH PROGRESS BAR */}
          {(isUploadingBatch || completedCount > 0) && (
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-purple-950">
                <span>
                  {isUploadingBatch ? 'Uploading photos...' : completedCount === pendingQueue.length ? '✓ Upload Complete' : 'Upload Status'}
                </span>
                <span className="font-mono">{overallProgressPercent}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-purple-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${overallProgressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-purple-800 font-semibold">
                <span>
                  {completedCount} / {pendingQueue.length} photos uploaded
                </span>
                <span className="font-mono">
                  {(uploadedBatchBytes / (1024 * 1024)).toFixed(2)} MB / {(totalBatchBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}

          {/* INDIVIDUAL PENDING PHOTO PREVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingQueue.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all ${
                  item.status === 'UPLOADED'
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : item.status === 'FAILED'
                    ? 'bg-rose-50/50 border-rose-200'
                    : item.status === 'UPLOADING'
                    ? 'bg-purple-50/50 border-purple-300 ring-2 ring-purple-400/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                    <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    {item.status === 'UPLOADED' && (
                      <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center text-white">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* File Metadata & Status */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 truncate">
                        {item.slotLabel}
                      </span>
                      {!isUploadingBatch && item.status !== 'UPLOADED' && (
                        <button
                          type="button"
                          onClick={() => handleRemovePendingItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                          title="Remove from queue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="font-bold text-slate-900 text-xs truncate" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>

                    {/* Status Pill */}
                    {item.status === 'WAITING' && (
                      <span className="text-[10px] text-slate-500 font-bold block">Ready for upload</span>
                    )}
                    {item.status === 'UPLOADING' && (
                      <span className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading {item.progress}%
                      </span>
                    )}
                    {item.status === 'UPLOADED' && (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded ✓
                      </span>
                    )}
                    {item.status === 'FAILED' && (
                      <span className="text-[10px] text-rose-700 font-bold flex items-center gap-1 truncate" title={item.error}>
                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" /> Failed ✕
                      </span>
                    )}
                  </div>
                </div>

                {/* Per-Item Error Display */}
                {item.error && (
                  <div className="p-2 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-800 text-[10px] font-semibold leading-tight">
                    {item.error}
                  </div>
                )}

                {/* Individual Progress Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 rounded-full ${
                      item.status === 'UPLOADED'
                        ? 'bg-emerald-600'
                        : item.status === 'FAILED'
                        ? 'bg-rose-600'
                        : 'bg-purple-600'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5-PHOTO GRID DISPLAY SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* SLOT 1: PRIMARY PROFILE PHOTO */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1 text-purple-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> Primary Photo (Photo 1)
            </span>
            {primaryPhoto && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-extrabold">
                Main Avatar
              </span>
            )}
          </div>

          <div className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-purple-200 bg-white overflow-hidden group flex items-center justify-center shadow-sm">
            {primaryPhoto ? (
              <>
                <img src={primaryPhoto} alt="Primary Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingTarget({ target: 'primary' });
                      singleFileInputRef.current?.click();
                    }}
                    disabled={singleActionLoading || isUploadingBatch}
                    className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-purple-600" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveConfirm({ open: true, target: 'primary' })}
                    disabled={singleActionLoading || isUploadingBatch}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2 shadow-inner border border-purple-100">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-slate-900">Primary Photo Empty</span>
                <span className="text-[10px] text-slate-500 mt-1">
                  Upload photos using the button above or replace this slot.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplacingTarget({ target: 'primary' });
                    singleFileInputRef.current?.click();
                  }}
                  disabled={singleActionLoading || isUploadingBatch}
                  className="mt-3 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Upload Primary Photo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SLOTS 2 to 5: GALLERY PHOTOS */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Gallery Photos ({galleryPhotos.length}/4)</span>
            <span className="text-[10px] text-slate-400">Photos 2, 3, 4, 5</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gallerySlotIndices.map((slotIndex) => {
              const photoUrl = galleryPhotos[slotIndex];
              const photoLabel = `Photo ${slotIndex + 2}`;

              return (
                <div key={slotIndex} className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 text-center">{photoLabel}</div>

                  <div className="relative aspect-square rounded-2xl border border-slate-200 bg-white overflow-hidden group flex items-center justify-center shadow-sm">
                    {photoUrl ? (
                      <>
                        <img src={photoUrl} alt={photoLabel} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleMakePrimary(slotIndex)}
                            disabled={singleActionLoading || isUploadingBatch}
                            className="bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-extrabold px-2 py-1 rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                            title="Set as main profile photo"
                          >
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> Make Primary
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplacingTarget({ target: 'gallery', slotIndex });
                              singleFileInputRef.current?.click();
                            }}
                            disabled={singleActionLoading || isUploadingBatch}
                            className="bg-slate-100 hover:bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            Replace
                          </button>

                          <button
                            type="button"
                            onClick={() => setRemoveConfirm({ open: true, target: 'gallery', slotIndex })}
                            disabled={singleActionLoading || isUploadingBatch}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold px-2 py-1 rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                        <Plus className="w-5 h-5 text-slate-300 mb-1" />
                        <span className="text-[10px] font-bold text-slate-400">Empty Slot</span>
                        <button
                          type="button"
                          onClick={() => {
                            setReplacingTarget({ target: 'gallery', slotIndex });
                            singleFileInputRef.current?.click();
                          }}
                          disabled={singleActionLoading || isUploadingBatch}
                          className="mt-1.5 text-[9px] font-extrabold text-purple-600 hover:text-purple-800 cursor-pointer"
                        >
                          + Add Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

