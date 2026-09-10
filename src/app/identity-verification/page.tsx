'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Lock,
} from 'lucide-react';

const DOCUMENT_TYPES = [
  { id: 'AADHAAR', label: 'Aadhaar Card', requiresBack: true, desc: 'Government issued unique identity card' },
  { id: 'PAN', label: 'PAN Card', requiresBack: false, desc: 'Income tax department permanent account number card' },
  { id: 'DRIVING_LICENCE', label: 'Driving Licence', requiresBack: true, desc: 'State transport department driving licence' },
  { id: 'PASSPORT', label: 'Passport', requiresBack: false, desc: 'Republic of India official travel passport' },
  { id: 'VOTER_ID', label: 'Voter ID', requiresBack: true, desc: 'Election Commission of India voter identity card' },
];

export default function IdentityVerificationPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDocType, setSelectedDocType] = useState<string>('AADHAAR');
  const [docFrontFile, setDocFrontFile] = useState<File | null>(null);
  const [docFrontPreview, setDocFrontPreview] = useState<string>('');
  const [docBackFile, setDocBackFile] = useState<File | null>(null);
  const [docBackPreview, setDocBackPreview] = useState<string>('');

  // Live Camera Selfie State
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchUserStatus();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchUserStatus = async () => {
    try {
      setLoadingUser(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!res.ok || !data.user) {
        router.push('/login');
        return;
      }

      setUser(data.user);

      // Enforce state machine step redirects
      if (data.user.role === 'CUSTOMER') {
        if (!data.user.isRegistrationFeePaid) {
          router.push('/register?step=2');
          return;
        }
        if (!data.user.isEmailVerified) {
          router.push('/verify-email');
          return;
        }
        if (data.user.accountStatus === 'ACTIVE') {
          router.push('/dashboard');
          return;
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingUser(false);
    }
  };

  // Camera Management Functions
  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('[Camera Error]', err);
      setCameraError('Camera access denied or unavailable. Please check your browser camera permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setSelfieBlob(blob);
          setSelfiePreview(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const retakeSelfie = () => {
    setSelfieBlob(null);
    setSelfiePreview('');
    startCamera();
  };

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be 5MB or smaller.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (isFront) {
      setDocFrontFile(file);
      setDocFrontPreview(previewUrl);
    } else {
      setDocBackFile(file);
      setDocBackPreview(previewUrl);
    }
    setError('');
  };

  const docConfig = DOCUMENT_TYPES.find((d) => d.id === selectedDocType) || DOCUMENT_TYPES[0];

  const handleSubmitVerification = async () => {
    setError('');

    if (!docFrontFile) {
      setError('Please upload the front side of your Government ID.');
      setStep(2);
      return;
    }

    if (docConfig.requiresBack && !docBackFile) {
      setError(`Please upload the back side of your ${docConfig.label}.`);
      setStep(2);
      return;
    }

    if (!selfieBlob) {
      setError('Please capture a live selfie before submitting.');
      setStep(3);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('documentType', selectedDocType);
      formData.append('documentFront', docFrontFile);
      if (docBackFile) {
        formData.append('documentBack', docBackFile);
      }
      formData.append('selfie', selfieBlob, 'live_selfie.jpg');

      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        console.error('[Server Non-JSON Response]', res.status, rawText);
        if (res.status === 413) {
          throw new Error('Uploaded file size is too large. Please compress your document/selfie images to under 4MB each.');
        }
        if (res.status === 404) {
          throw new Error('Verification submission API endpoint was not found (404). Please try again.');
        }
        throw new Error(`Server returned error (${res.status}). Please try again.`);
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to submit identity verification');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading identity status...</span>
        </div>
      </div>
    );
  }

  // UNDER_REVIEW STATUS UI
  if (user?.accountStatus === 'UNDER_REVIEW') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-slate-800/90 rounded-3xl border border-slate-700/80 p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-black rounded-full border border-amber-500/20 uppercase tracking-wider">
              Identity Verification Under Review
            </span>
            <h1 className="text-2xl font-black text-white">Your Documents Are Being Verified</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Our safety compliance team is manually inspecting your government ID document and live selfie. You will receive full platform access as soon as your account is approved.
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Document Submitted:</span>
              <span className="font-bold text-slate-200">
                {user.identityVerification?.documentType || 'Government ID'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Submission Date:</span>
              <span className="font-bold text-slate-200">
                {user.identityVerification?.createdAt
                  ? new Date(user.identityVerification.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Today'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-amber-400">MANUAL REVIEW IN PROGRESS</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-2"
            >
              <span>Go to Restricted Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 py-12">
      {/* Header Branding */}
      <div className="mb-8 text-center space-y-2">
        <Link href="/" className="inline-block text-2xl font-black text-white tracking-tight">
          Paireva<span className="text-brand-500">.</span>
        </Link>
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit mx-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>Encrypted 256-bit Identity Verification</span>
        </div>
      </div>

      <div className="max-w-xl w-full bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden">
        {/* REJECTED ALERT BANNER */}
        {user?.accountStatus === 'REJECTED' && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs space-y-1 text-rose-300">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Identity Verification Rejected</span>
            </div>
            <p className="text-slate-300 pl-6">
              Reason: {user.identityVerification?.rejectionReason || 'Uploaded document or selfie was unclear.'}
            </p>
            <p className="text-[11px] text-slate-400 pl-6 pt-1 font-semibold">
              Please submit clear, unedited government ID documents and a well-lit live selfie to re-verify.
            </p>
          </div>
        )}

        {/* PROGRESS STEPPER */}
        <div className="grid grid-cols-4 gap-2 border-b border-slate-800 pb-6">
          {[
            { num: 1, title: 'ID Type' },
            { num: 2, title: 'Upload' },
            { num: 3, title: 'Selfie' },
            { num: 4, title: 'Submit' },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < step) setStep(s.num as any);
              }}
              className={`flex flex-col items-center gap-1 text-center cursor-pointer transition-all ${
                step === s.num
                  ? 'text-brand-400 font-extrabold scale-105'
                  : s.num < step
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-600 font-semibold'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === s.num
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : s.num < step
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {s.num < step ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-[11px] hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: SELECT ID TYPE */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Select Government ID Document</h2>
              <p className="text-xs text-slate-400">
                Choose one official government-issued photo ID for manual identity verification.
              </p>
            </div>

            <div className="space-y-3">
              {DOCUMENT_TYPES.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocType(doc.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedDocType === doc.id
                      ? 'bg-brand-600/10 border-brand-500 text-white ring-1 ring-brand-500/50'
                      : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 ${selectedDocType === doc.id ? 'text-brand-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-sm">{doc.label}</span>
                      {doc.requiresBack && (
                        <span className="text-[10px] bg-slate-700/80 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                          Front &amp; Back
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 pl-6">{doc.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      selectedDocType === doc.id
                        ? 'border-brand-500 bg-brand-600 text-white'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {selectedDocType === doc.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-600/20"
            >
              <span>Continue to Upload Document</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: UPLOAD DOCUMENT */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Upload {docConfig.label}</h2>
              <p className="text-xs text-slate-400">
                Please upload clear, un-cropped photos or PDF files (max 5MB each).
              </p>
            </div>

            <div className="space-y-4">
              {/* FRONT DOCUMENT UPLOAD */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  {docConfig.requiresBack ? 'Front Side Photo' : 'Document Image / File'}
                </label>

                {docFrontPreview ? (
                  <div className="relative rounded-2xl border border-slate-700 overflow-hidden bg-slate-950 p-2 group">
                    <img src={docFrontPreview} alt="Front Document Preview" className="w-full h-44 object-contain rounded-xl" />
                    <button
                      onClick={() => {
                        setDocFrontFile(null);
                        setDocFrontPreview('');
                      }}
                      className="absolute top-4 right-4 p-2 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition-colors shadow-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-2xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all p-4 text-center">
                    <Upload className="w-6 h-6 text-brand-400 mb-2" />
                    <span className="text-xs font-bold text-slate-200">Click to upload front document</span>
                    <span className="text-[10px] text-slate-500 mt-1">Supports JPG, PNG, WEBP, PDF (Max 5MB)</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => handleFileChange(e, true)} className="hidden" />
                  </label>
                )}
              </div>

              {/* BACK DOCUMENT UPLOAD (IF REQUIRED) */}
              {docConfig.requiresBack && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-300">Back Side Photo</label>

                  {docBackPreview ? (
                    <div className="relative rounded-2xl border border-slate-700 overflow-hidden bg-slate-950 p-2 group">
                      <img src={docBackPreview} alt="Back Document Preview" className="w-full h-44 object-contain rounded-xl" />
                      <button
                        onClick={() => {
                          setDocBackFile(null);
                          setDocBackPreview('');
                        }}
                        className="absolute top-4 right-4 p-2 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition-colors shadow-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-2xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all p-4 text-center">
                      <Upload className="w-6 h-6 text-brand-400 mb-2" />
                      <span className="text-xs font-bold text-slate-200">Click to upload back document</span>
                      <span className="text-[10px] text-slate-500 mt-1">Supports JPG, PNG, WEBP, PDF (Max 5MB)</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => handleFileChange(e, false)} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-2xl transition-all text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!docFrontFile) {
                    setError('Please upload the document image.');
                    return;
                  }
                  if (docConfig.requiresBack && !docBackFile) {
                    setError('Please upload the back side of your document.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
                className="w-2/3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-600/20"
              >
                <span>Continue to Live Selfie</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LIVE SELFIE CAMERA CAPTURE */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Capture Live Selfie</h2>
              <p className="text-xs text-slate-400">
                Please take a clear face selfie using your device camera. Photos uploaded from gallery are not permitted.
              </p>
            </div>

            <div className="space-y-4">
              {/* HIDDEN CANVAS FOR CAPTURE */}
              <canvas ref={canvasRef} className="hidden" />

              {/* CAMERA / PREVIEW DISPLAY */}
              <div className="relative rounded-3xl border border-slate-700 bg-slate-950 overflow-hidden h-72 flex flex-col items-center justify-center shadow-inner">
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Captured Selfie" className="w-full h-full object-cover" />
                ) : cameraActive ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-14 h-14 bg-brand-600/20 text-brand-400 rounded-full flex items-center justify-center mx-auto border border-brand-500/30">
                      <Camera className="w-7 h-7" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">Click below to open your camera and capture a live selfie</p>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-semibold">
                  {cameraError}
                </div>
              )}

              {/* CAMERA CONTROLS */}
              <div className="flex justify-center gap-3">
                {selfiePreview ? (
                  <button
                    onClick={retakeSelfie}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake Selfie</span>
                  </button>
                ) : cameraActive ? (
                  <button
                    onClick={captureSelfie}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Live Selfie</span>
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-600/30"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  stopCamera();
                  setStep(2);
                }}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-2xl transition-all text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!selfieBlob) {
                    setError('Please capture your live selfie to proceed.');
                    return;
                  }
                  setError('');
                  stopCamera();
                  setStep(4);
                }}
                disabled={!selfieBlob}
                className="w-2/3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-600/20"
              >
                <span>Review &amp; Submit</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Review &amp; Submit Verification</h2>
              <p className="text-xs text-slate-400">
                Please double-check your submitted details before sending for manual admin review.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Document Type:</span>
                <span className="font-bold text-white">{docConfig.label}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Front Document Upload:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Attached ({docFrontFile?.name})
                </span>
              </div>
              {docConfig.requiresBack && (
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">Back Document Upload:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Attached ({docBackFile?.name})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Live Selfie Capture:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Captured
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                <span>Privacy &amp; Data Security Assurance</span>
              </div>
              <p className="leading-relaxed">
                Your uploaded ID document and selfie are stored securely in private encrypted storage. They are never published, shared with companions, or exposed publicly.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(3)}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-2xl transition-all text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSubmitVerification}
                disabled={submitting || success}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting Documents...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Identity Verification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

