import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  PhoneOff,
  MapPin,
  UploadCloud,
  Lock,
  CameraOff
} from 'lucide-react';
import './VideoCall.css';

const STEPS = ['Video Call', 'Document Upload', 'Review Details', 'Loan Offer', 'Consent'];

const formatTime = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const VideoCall = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [geoVerified, setGeoVerified] = useState(false);
  const [identityScanDone, setIdentityScanDone] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [frameBlob, setFrameBlob] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | done
  const [isInitializing, setIsInitializing] = useState(true);

  const startVideo = async () => {
    setPermissionDenied(false);
    setIsInitializing(true);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const permissions = await navigator.permissions.query({ name: 'camera' });
      if (permissions.state === 'denied') {
        setPermissionDenied(true);
        setIsInitializing(false);
        return;
      }
    } catch {
      // Permissions API may not be available; continue
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      } else {
        throw new Error('Video element not mounted');
      }
      streamRef.current = stream;
      let recorder;
      try {
        recorder = new MediaRecorder(stream);
      } catch (recorderError) {
        console.warn('MediaRecorder not supported:', recorderError);
        recorder = null;
      }

      if (recorder) {
        recorder.ondataavailable = (e) => {
          setAudioChunks((prev) => [...prev, e.data]);
        };
        recorder.start(10000);
        recorderRef.current = recorder;
        setIsRecording(true);
      }
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setTimeout(() => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 1280;
        canvas.height = videoRef.current.videoHeight || 720;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        canvas.toBlob(
          (blob) => {
            setFrameBlob(blob);
            setIdentityScanDone(true);
          },
          'image/jpeg',
          0.85
        );
      }, 8000);
      setTimeout(() => setGeoVerified(true), 2000);
      setIsInitializing(false);
    } catch (err) {
      console.error('Media error:', err);

      if (err.name === 'NotAllowedError') {
        setPermissionDenied(true);
      } else if (err.name === 'NotFoundError') {
        alert('No camera or microphone found on this device.');
      } else {
        alert('Unable to start video. Please refresh or try a different browser.');
      }
      setIsInitializing(false);
    }
  };

  const stopMedia = () => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const stopSession = () => {
    stopMedia();
    navigate('/review');
  };

  useEffect(() => {
    startVideo();
    return () => {
      stopMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = (files) => {
    if (!files.length) return;
    setUploadState('uploading');
    setTimeout(() => {
      setUploadState('done');
    }, 1200);
  };

  if (isInitializing) {
    return (
      <div className="video-loading">
        Starting camera...
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="video-call">
        <div className="video-call__permission">
          <CameraOff size={48} color="#9CA3AF" />
          <h2>Camera access required</h2>
          <p>Please allow camera and microphone access to continue your application.</p>
          <button
            type="button"
            onClick={() => {
              setPermissionDenied(false);
              startVideo();
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call">
      <div className="video-call__panel video-call__panel--video">
        <video ref={videoRef} autoPlay muted playsInline />

        <div className="video-overlay video-overlay--session">
          <span>Session ID · LW-2048-A1</span>
        </div>

        <div className="video-overlay video-overlay--geo">
          {geoVerified ? (
            <span className="geo-chip geo-chip--ok">
              <MapPin size={12} />
              Location Verified ✓
            </span>
          ) : (
            <span className="geo-chip geo-chip--pending">
              <span className="geo-chip__dot" />
              Verifying...
            </span>
          )}
        </div>

        {isRecording && (
          <div className="video-overlay video-overlay--rec">
            <span className="rec-dot" />
            <span>REC</span>
          </div>
        )}

        {identityScanDone && (
          <div className="video-overlay video-overlay--id-chip">
            Identity scan complete ✓
          </div>
        )}

        <div className="video-overlay video-overlay--bottom">
          <button type="button" className="video-control" onClick={() => setIsMuted((m) => !m)}>
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <div className="video-timer">{formatTime(seconds)}</div>
          <button type="button" className="video-control video-control--end" onClick={stopSession}>
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      <div className="video-call__panel video-call__panel--info">
        <div className="info-header">
          <div className="info-brand">
            <span />
            <div>
              <div className="info-brand__title">Loan Wizard</div>
              <div className="info-brand__subtitle">Powered by Poonawalla Fincorp</div>
            </div>
          </div>
        </div>

        <div className="info-divider" />

        <div className="info-stepper">
          {STEPS.map((step, index) => (
            <div key={step} className="info-stepper__item">
              <div className="info-stepper__circle">
                {index <= 0 ? <span /> : null}
              </div>
              <div className="info-stepper__content">
                <span className="info-stepper__label">{step}</span>
                <span className={`info-stepper__state ${index === 0 ? 'active' : ''}`}>
                  {index === 0 ? 'Active' : index < 2 ? 'Complete' : 'Upcoming'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="info-divider" />

        <div className="document-section">
          <p className="document-section__label">Upload Identity Document</p>
          <p className="document-section__sublabel">Aadhaar card or PAN card</p>
          {uploadState !== 'done' ? (
            <label className="document-dropzone">
              <UploadCloud size={30} />
              <p>Click to upload or drag & drop</p>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleUpload(event.target.files)}
              />
            </label>
          ) : (
            <span className="document-chip">Document Received ✓</span>
          )}
          {uploadState === 'uploading' && (
            <div className="document-spinner">
              Uploading...
            </div>
          )}
        </div>

        <div className="info-divider" />

        <div className="info-footer">
          <Lock size={14} />
          <span>RBI V-CIP Compliant · 256-bit SSL</span>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
