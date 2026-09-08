'use client';

import React, { useState, useRef } from 'react';
import {
  Camera,
  Plus,
  Trash2,
  Star,
  UploadCloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  X,
} from 'lucide-react';

interface AdminPhotoManagerProps {
  userId: string;
  userRole?: string;
  initialPrimaryPhoto: string | null;
  initialGalleryPhotos?: string[];
  onPhotosChange?: (photos: { primaryPhoto: string | null; galleryPhotos: string[] }) => void;
}

export default function AdminPhotoManager({
  userId,
  userRole = 'USER',
  initialPrimaryPhoto,
  initialGalleryPhotos = [],
  onPhotosChange,
}: AdminPhotoManagerProps) {
  const [primaryPhoto, setPrimaryPhoto] = useState<string | null>(initialPrimaryPhoto);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(initialGalleryPhotos);

  // Upload & UI Action States
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null); // -1 for primary, 0-3 for gallery slots
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Client Preview States
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTargetSlot, setPreviewTargetSlot] = useState<number | null>(null); // -1 for primary, 0-3 for gallery

  // Removal Confirmation State
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    target: 'primary' | 'gallery';
    slotIndex?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPhotosCount = (primaryPhoto ? 1 : 0) + galleryPhotos.length;

  /**
   * Client-side validation before selecting preview
   */
  const handleSelectFile = (file: File, targetSlot: number) => {
    setError(null);
    setSuccessMsg(null);

    // 1. Check File Size (5MB Max)
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setError(`File "${file.name}" exceeds the maximum limit of 5 MB.`);
      return;
    }

    // 2. Check File Format
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setError('Invalid file format. Only JPG, PNG, and WEBP images are allowed.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewTargetSlot(targetSlot);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
    setPreviewTargetSlot(null);
    setError(null);
  };

  /**
   * Execute Photo Upload to Server
   */
  const handleUploadPhoto = async () => {
    if (!previewFile || previewTargetSlot === null) return;

    setUploadingSlot(previewTargetSlot);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('file', previewFile);

      if (previewTargetSlot === -1) {
        formData.append('target', 'primary');
      } else {
        formData.append('target', 'gallery');
        formData.append('slotIndex', previewTargetSlot.toString());
      }

      const res = await fetch('/api/admin/photos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');

      setPrimaryPhoto(data.primaryPhoto);
      setGalleryPhotos(data.galleryPhotos || []);

      if (onPhotosChange) {
        onPhotosChange({
          primaryPhoto: data.primaryPhoto,
          galleryPhotos: data.galleryPhotos || [],
        });
      }

      setSuccessMsg(
        previewTargetSlot === -1
          ? 'Primary profile photo updated successfully!'
          : `Photo ${previewTargetSlot + 2} updated successfully!`
      );

      handleCancelPreview();
    } catch (err: any) {
      setError(err.message || 'Photo upload failed');
    } finally {
      setUploadingSlot(null);
    }
  };

  /**
   * Promote Gallery Photo to Primary Photo
   */
  const handleMakePrimary = async (galleryIndex: number) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

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

      setSuccessMsg('Selected gallery photo promoted to Primary Profile Photo!');
    } catch (err: any) {
      setError(err.message || 'Failed to promote photo');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Remove Photo (Primary or Gallery)
   */
  const handleRemovePhoto = async () => {
    if (!removeConfirm) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

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

      setSuccessMsg('Photo removed successfully!');
      setRemoveConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove photo');
    } finally {
      setActionLoading(false);
    }
  };

  const gallerySlotIndices = [0, 1, 2, 3];

  return (
    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-600" /> Admin Profile Photos Management ({userRole})
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            Total {totalPhotosCount}/5 photos uploaded (1 Primary Photo + up to 4 Gallery Photos).
          </p>
        </div>
      </div>

      {/* Notifications / Errors */}
      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* REMOVAL CONFIRMATION DIALOG */}
      {removeConfirm && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
          <div className="font-bold text-rose-800 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Confirm Photo Removal
          </div>
          <p className="text-[11px] text-rose-700">
            Are you sure you want to remove this {removeConfirm.target === 'primary' ? 'Primary' : `Gallery (Photo ${ (removeConfirm.slotIndex || 0) + 2 })`} photo?
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setRemoveConfirm(null)}
              disabled={actionLoading}
              className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-[11px] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRemovePhoto}
              disabled={actionLoading}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl cursor-pointer"
            >
              {actionLoading ? 'Removing...' : 'Confirm Remove'}
            </button>
          </div>
        </div>
      )}

      {/* 5-PHOTO GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* SLOT 1: PRIMARY PROFILE PHOTO */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1 text-brand-700">
              <Star className="w-3.5 h-3.5 fill-brand-500 text-brand-500" /> Primary Photo (Photo 1)
            </span>
            {primaryPhoto && (
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                Main Avatar
              </span>
            )}
          </div>

          <div className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-brand-200 bg-white overflow-hidden group flex items-center justify-center shadow-sm">
            {uploadingSlot === -1 ? (
              <div className="flex flex-col items-center gap-2 p-4 text-brand-600">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold">Uploading Primary Photo...</span>
              </div>
            ) : previewTargetSlot === -1 && previewUrl ? (
              <div className="relative w-full h-full flex flex-col">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/70 p-3 flex flex-col justify-between text-white">
                  <span className="text-[10px] font-extrabold bg-brand-600 text-white px-2 py-0.5 rounded self-start">
                    NEW PREVIEW
                  </span>
                  <div className="space-y-1">
                    <p className="text-[10px] truncate">{previewFile?.name}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleUploadPhoto}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={handleCancelPreview}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : primaryPhoto ? (
              <>
                <img src={primaryPhoto} alt="Primary" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <label className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-3 py-2 rounded-xl shadow cursor-pointer transition-transform active:scale-95 flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5 text-brand-600" /> Replace
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSelectFile(file, -1);
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setRemoveConfirm({ open: true, target: 'primary' })}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-brand-50/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-2 shadow-sm">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-slate-900">Upload Primary Photo</span>
                <span className="text-[10px] text-slate-500 mt-1">Recommended primary avatar</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSelectFile(file, -1);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* SLOTS 2 to 5: GALLERY PHOTOS */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-xs font-bold text-slate-800">
            Gallery Photos ({galleryPhotos.length}/4)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gallerySlotIndices.map((slotIndex) => {
              const photoUrl = galleryPhotos[slotIndex];
              const isUploadingThisSlot = uploadingSlot === slotIndex;
              const isPreviewingThisSlot = previewTargetSlot === slotIndex && previewUrl;
              const photoLabel = `Photo ${slotIndex + 2}`;

              return (
                <div key={slotIndex} className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 text-center">{photoLabel}</div>

                  <div className="relative aspect-square rounded-2xl border border-slate-200 bg-white overflow-hidden group flex items-center justify-center shadow-sm">
                    {isUploadingThisSlot ? (
                      <div className="flex flex-col items-center gap-1 p-2 text-brand-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-[10px] font-bold">Uploading...</span>
                      </div>
                    ) : isPreviewingThisSlot ? (
                      <div className="relative w-full h-full flex flex-col">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/80 p-1.5 flex flex-col justify-between text-white text-center">
                          <span className="text-[8px] font-extrabold bg-brand-600 text-white rounded py-0.5">
                            PREVIEW
                          </span>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleUploadPhoto}
                              className="px-2 py-1 bg-purple-600 text-white text-[9px] font-bold rounded cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelPreview}
                              className="px-2 py-1 bg-slate-300 text-slate-900 text-[9px] font-bold rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : photoUrl ? (
                      <>
                        <img src={photoUrl} alt={photoLabel} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleMakePrimary(slotIndex)}
                            disabled={actionLoading}
                            className="bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-extrabold px-2 py-1 rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                            title="Set as main profile photo"
                          >
                            <Star className="w-3 h-3 text-brand-500 fill-brand-500" /> Make Primary
                          </button>

                          <label className="bg-slate-100 hover:bg-white text-slate-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow cursor-pointer transition-transform active:scale-95 flex items-center gap-1">
                            Replace
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleSelectFile(file, slotIndex);
                              }}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setRemoveConfirm({ open: true, target: 'gallery', slotIndex })}
                            disabled={actionLoading}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold px-2 py-1 rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                        <Plus className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500">Add Photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSelectFile(file, slotIndex);
                          }}
                          className="hidden"
                        />
                      </label>
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

