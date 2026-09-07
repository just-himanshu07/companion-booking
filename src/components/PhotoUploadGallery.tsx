'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Trash2, Star, UploadCloud, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PhotoUploadGalleryProps {
  primaryPhoto: string | null;
  galleryPhotos: string[];
  onChange: (photos: { primaryPhoto: string | null; galleryPhotos: string[] }) => void;
  maxPhotos?: number; // Default: 5 total
  maxFileSizeMB?: number; // Default: 5 MB
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function PhotoUploadGallery({
  primaryPhoto,
  galleryPhotos = [],
  onChange,
  maxPhotos = 5,
  maxFileSizeMB = 5,
}: PhotoUploadGalleryProps) {
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null); // Index or -1 for primary
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const addPhotosInputRef = useRef<HTMLInputElement>(null);

  // Track temporary object URLs for memory cleanup
  const activeObjectUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      // Cleanup all temporary object URLs on unmount
      activeObjectUrls.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // ignore
        }
      });
      activeObjectUrls.current.clear();
    };
  }, []);

  const totalPhotosCount = (primaryPhoto ? 1 : 0) + galleryPhotos.length;

  /**
   * Client-side validation for type and size before uploading
   */
  const validateFile = (file: File): string | null => {
    // 1. Check size
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File "${file.name}" exceeds the maximum size limit of ${maxFileSizeMB} MB.`;
    }

    // 2. Check extension & MIME type
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const type = file.type.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext) || (type && !ALLOWED_MIME_TYPES.includes(type))) {
      return `File "${file.name}" is not a supported format. Please upload JPG, PNG, or WEBP images only.`;
    }

    return null;
  };

  /**
   * Performs file upload to server (/api/upload)
   */
  const uploadFileToServer = async (file: File): Promise<string> => {
    // Temporary object URL for immediate client preview
    const tempUrl = URL.createObjectURL(file);
    activeObjectUrls.current.add(tempUrl);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    // Revoke temporary object URL after server responds
    URL.revokeObjectURL(tempUrl);
    activeObjectUrls.current.delete(tempUrl);

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload photo. Please try again.');
    }

    return data.url;
  };

  /**
   * Handles uploading or replacing the Primary Photo
   */
  const handlePrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const valError = validateFile(file);
    if (valError) {
      setError(valError);
      if (primaryInputRef.current) primaryInputRef.current.value = '';
      return;
    }

    setUploadingSlot(-1);

    try {
      const uploadedUrl = await uploadFileToServer(file);
      onChange({
        primaryPhoto: uploadedUrl,
        galleryPhotos,
      });
      setSuccessMsg('Primary profile photo updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingSlot(null);
      if (primaryInputRef.current) primaryInputRef.current.value = '';
    }
  };

  /**
   * Handles uploading additional gallery photos
   */
  const handleAddPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check maximum photos limit
    if (totalPhotosCount + files.length > maxPhotos) {
      setError(`Maximum limit is ${maxPhotos} photos total. You can only add ${maxPhotos - totalPhotosCount} more photo(s).`);
      if (addPhotosInputRef.current) addPhotosInputRef.current.value = '';
      return;
    }

    // Validate each file
    for (const file of files) {
      const valErr = validateFile(file);
      if (valErr) {
        setError(valErr);
        if (addPhotosInputRef.current) addPhotosInputRef.current.value = '';
        return;
      }
    }

    setUploadingSlot(galleryPhotos.length);

    try {
      const newUploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadFileToServer(file);
        newUploadedUrls.push(url);
      }

      // If there's currently no primary photo, make the first uploaded image primary
      if (!primaryPhoto && newUploadedUrls.length > 0) {
        const firstAsPrimary = newUploadedUrls.shift()!;
        onChange({
          primaryPhoto: firstAsPrimary,
          galleryPhotos: [...galleryPhotos, ...newUploadedUrls],
        });
      } else {
        onChange({
          primaryPhoto,
          galleryPhotos: [...galleryPhotos, ...newUploadedUrls],
        });
      }

      setSuccessMsg(`${files.length} photo(s) uploaded successfully!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingSlot(null);
      if (addPhotosInputRef.current) addPhotosInputRef.current.value = '';
    }
  };

  /**
   * Removes Primary Photo
   */
  const handleRemovePrimary = () => {
    setError(null);
    setSuccessMsg(null);
    // If there are gallery photos, promote the first gallery photo to primary
    if (galleryPhotos.length > 0) {
      const nextPrimary = galleryPhotos[0];
      const remainingGallery = galleryPhotos.slice(1);
      onChange({
        primaryPhoto: nextPrimary,
        galleryPhotos: remainingGallery,
      });
    } else {
      onChange({
        primaryPhoto: null,
        galleryPhotos: [],
      });
    }
  };

  /**
   * Removes a specific Gallery Photo
   */
  const handleRemoveGalleryPhoto = (index: number) => {
    setError(null);
    setSuccessMsg(null);
    const updated = galleryPhotos.filter((_, i) => i !== index);
    onChange({
      primaryPhoto,
      galleryPhotos: updated,
    });
  };

  /**
   * Promotes a gallery photo to be the Primary Photo
   */
  const handleMakePrimary = (index: number) => {
    setError(null);
    setSuccessMsg(null);
    const targetPhoto = galleryPhotos[index];
    const updatedGallery = galleryPhotos.filter((_, i) => i !== index);

    // Old primary photo gets demoted to gallery if it exists
    if (primaryPhoto) {
      updatedGallery.unshift(primaryPhoto);
    }

    onChange({
      primaryPhoto: targetPhoto,
      galleryPhotos: updatedGallery,
    });
    setSuccessMsg('Selected photo set as Primary Profile Photo!');
  };

  // Additional slots array (up to 4 additional slots)
  const additionalSlots = [0, 1, 2, 3];

  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-brand-600" /> Profile Photos
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Upload up to {maxPhotos} photos total ({totalPhotosCount}/{maxPhotos} uploaded). 1 Profile Photo + up to 4 Gallery Photos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={addPhotosInputRef}
            onChange={handleAddPhotosUpload}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            id="gallery-photos-input"
          />
          {totalPhotosCount < maxPhotos && (
            <label
              htmlFor="gallery-photos-input"
              className="inline-flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-brand-200 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Photos
            </label>
          )}
        </div>
      </div>

      {/* Notifications / Errors */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rosebrand-50 border border-rosebrand-200 text-rosebrand-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rosebrand-600 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Hidden File Input for Primary Photo */}
      <input
        type="file"
        ref={primaryInputRef}
        onChange={handlePrimaryUpload}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        id="primary-photo-input"
      />

      {/* GALLERY GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* SLOT 1: PRIMARY PROFILE PHOTO */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1 text-brand-700">
              <Star className="w-3.5 h-3.5 fill-brand-500 text-brand-500" /> Profile Photo (Primary)
            </span>
            {primaryPhoto && (
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                Main Avatar
              </span>
            )}
          </div>

          <div className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 overflow-hidden group flex items-center justify-center">
            {uploadingSlot === -1 ? (
              <div className="flex flex-col items-center gap-2 p-4 text-brand-600">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold">Uploading Profile Photo...</span>
              </div>
            ) : primaryPhoto ? (
              <>
                <img
                  src={primaryPhoto}
                  alt="Profile Photo"
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <label
                    htmlFor="primary-photo-input"
                    className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs px-3 py-2 rounded-xl shadow cursor-pointer transition-transform active:scale-95 flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-brand-600" /> Replace
                  </label>
                  <button
                    type="button"
                    onClick={handleRemovePrimary}
                    className="bg-rosebrand-600 hover:bg-rosebrand-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow transition-transform active:scale-95 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </>
            ) : (
              <label
                htmlFor="primary-photo-input"
                className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-brand-100/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mb-2 shadow-sm">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-slate-900">Upload Profile Photo</span>
                <span className="text-[10px] text-slate-500 mt-1">Recommended primary avatar</span>
              </label>
            )}
          </div>
        </div>

        {/* SLOTS 2 to 5: ADDITIONAL GALLERY PHOTOS */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-2">
          <div className="text-xs font-bold text-slate-700">
            Additional Photos ({galleryPhotos.length}/4)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {additionalSlots.map((slotIndex) => {
              const photoUrl = galleryPhotos[slotIndex];
              const isUploadingThisSlot = uploadingSlot === slotIndex;
              const photoLabel = `Photo ${slotIndex + 2}`;

              return (
                <div key={slotIndex} className="space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 text-center">{photoLabel}</div>
                  <div className="relative aspect-square rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group flex items-center justify-center">
                    {isUploadingThisSlot ? (
                      <div className="flex flex-col items-center gap-1 p-2 text-brand-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-[10px] font-bold">Uploading...</span>
                      </div>
                    ) : photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={photoLabel}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleMakePrimary(slotIndex)}
                            className="bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-extrabold px-2 py-1 rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1"
                            title="Set as main profile photo"
                          >
                            <Star className="w-3 h-3 text-brand-500 fill-brand-500" /> Make Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryPhoto(slotIndex)}
                            className="bg-rosebrand-600 hover:bg-rosebrand-700 text-white text-[10px] font-extrabold px-2 py-1 rounded-lg shadow transition-transform active:scale-95 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <label
                        htmlFor="gallery-photos-input"
                        className="w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-500">Add Photo</span>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guidelines Footer */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>📷 <strong>Formats:</strong> JPG, PNG, WEBP allowed.</span>
        <span>⚡ <strong>Size:</strong> Maximum {maxFileSizeMB} MB per file.</span>
        <span>🔒 <strong>Privacy:</strong> Direct device upload stored securely.</span>
      </div>
    </div>
  );
}

