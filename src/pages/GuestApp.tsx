import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../supabaseClient";
import logoBk from "../assets/logo-bk.svg";
import "./GuestApp.css";

export interface PhotoSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  photo_index?: number;
  photoIndex?: number;
}

export interface FrameLayoutConfig {
  width: number;
  height: number;
  shot_count: number;
  slots: PhotoSlot[];
}

export const DEFAULT_LAYOUT: FrameLayoutConfig = {
  width: 1200,
  height: 1800,
  shot_count: 3,
  slots: [
    { x: 70, y: 90, width: 500, height: 410, photo_index: 0 },
    { x: 630, y: 90, width: 500, height: 410, photo_index: 0 },
    { x: 70, y: 540, width: 500, height: 410, photo_index: 1 },
    { x: 630, y: 540, width: 500, height: 410, photo_index: 1 },
    { x: 70, y: 990, width: 500, height: 410, photo_index: 2 },
    { x: 630, y: 990, width: 500, height: 410, photo_index: 2 },
  ],
};

export const getFrameLayout = (frame: Frame | null): FrameLayoutConfig => {
  if (
    frame?.layout_config &&
    frame.layout_config.slots &&
    frame.layout_config.slots.length > 0
  ) {
    return frame.layout_config;
  }
  return DEFAULT_LAYOUT;
};

interface EventConfig {
  id: string;
  couple_name: string;
  event_date: string | null;
  event_location: string | null;
  allow_voice: boolean;
  allow_chat: boolean;
  require_name: boolean;
  allow_retake: boolean;
  is_active: boolean;
  couple_photo_url: string | null;
  theme_color: string | null;
}

export interface Frame {
  id: string;
  name: string;
  svg_code: string | null;
  png_url: string | null;
  layout_config?: FrameLayoutConfig | null;
  is_active: boolean;
  sort_order: number;
}

type ScreenName =
  | "welcome"
  | "frame"
  | "camera"
  | "preview"
  | "voice"
  | "upload"
  | "success";

const defaultFramesData = [
  {
    name: "Garden Rose",
    svg_code: `<svg width="1200" height="1800" viewBox="0 0 1200 1800" xmlns="http://www.w3.org/2000/svg">
  <rect x="16" y="16" width="1168" height="1768" rx="16" fill="none" stroke="#c9a96e" stroke-width="10"/>
  <rect x="36" y="36" width="1128" height="1728" rx="10" fill="none" stroke="#e8d5b0" stroke-width="3"/>
  <rect x="70" y="90" width="500" height="410" rx="8" fill="none" stroke="#c9a96e" stroke-width="4" stroke-dasharray="6 6"/>
  <rect x="630" y="90" width="500" height="410" rx="8" fill="none" stroke="#c9a96e" stroke-width="4" stroke-dasharray="6 6"/>
  <rect x="70" y="540" width="500" height="410" rx="8" fill="none" stroke="#c9a96e" stroke-width="4" stroke-dasharray="6 6"/>
  <rect x="630" y="540" width="500" height="410" rx="8" fill="none" stroke="#c9a96e" stroke-width="4" stroke-dasharray="6 6"/>
  <rect x="70" y="990" width="500" height="410" rx="8" fill="none" stroke="#c9a96e" stroke-width="4" stroke-dasharray="6 6"/>
  <rect x="630" y="990" width="500" height="410" rx="8" fill="none" stroke="#c9a96e" stroke-width="4" stroke-dasharray="6 6"/>
  <circle cx="36" cy="36" r="32" fill="none" stroke="#d4847a" stroke-width="4"/>
  <circle cx="1164" cy="36" r="32" fill="none" stroke="#d4847a" stroke-width="4"/>
  <circle cx="36" cy="1764" r="32" fill="none" stroke="#d4847a" stroke-width="4"/>
  <circle cx="1164" cy="1764" r="32" fill="none" stroke="#d4847a" stroke-width="4"/>
  <rect x="40" y="1450" width="1120" height="310" rx="12" fill="rgba(255,255,255,0.96)"/>
  <line x1="200" y1="1490" x2="1000" y2="1490" stroke="#e8d5b0" stroke-width="2"/>
  <text x="600" y="1590" text-anchor="middle" font-family="'Poppins', 'Georgia', serif" font-style="italic" font-size="56" fill="#6b4c2a">{{COUPLE_NAME}}</text>
  <text x="600" y="1670" text-anchor="middle" font-family="'SF Pro', 'Arial', sans-serif" font-size="24" font-weight="600" fill="#c9a96e" letter-spacing="6">HAPPY WEDDING • SWEET MOMENTS</text>
</svg>`,
    png_url: null,
    is_active: true,
    sort_order: 0,
  },
  {
    name: "Vintage Gold",
    svg_code: `<svg width="1200" height="1800" viewBox="0 0 1200 1800" xmlns="http://www.w3.org/2000/svg">
  <rect x="12" y="12" width="1176" height="1776" rx="8" fill="none" stroke="#c9a96e" stroke-width="8"/>
  <rect x="32" y="32" width="1136" height="1736" rx="6" fill="none" stroke="#e8d5b0" stroke-width="2"/>
  <path d="M12 120 L12 12 L120 12" fill="none" stroke="#b8843a" stroke-width="8"/>
  <path d="M1080 12 L1188 12 L1188 120" fill="none" stroke="#b8843a" stroke-width="8"/>
  <path d="M12 1680 L12 1788 L120 1788" fill="none" stroke="#b8843a" stroke-width="8"/>
  <path d="M1080 1788 L1188 1788 L1188 1680" fill="none" stroke="#b8843a" stroke-width="8"/>
  <rect x="70" y="90" width="500" height="410" rx="4" fill="none" stroke="#b8843a" stroke-width="3"/>
  <rect x="630" y="90" width="500" height="410" rx="4" fill="none" stroke="#b8843a" stroke-width="3"/>
  <rect x="70" y="540" width="500" height="410" rx="4" fill="none" stroke="#b8843a" stroke-width="3"/>
  <rect x="630" y="540" width="500" height="410" rx="4" fill="none" stroke="#b8843a" stroke-width="3"/>
  <rect x="70" y="990" width="500" height="410" rx="4" fill="none" stroke="#b8843a" stroke-width="3"/>
  <rect x="630" y="990" width="500" height="410" rx="4" fill="none" stroke="#b8843a" stroke-width="3"/>
  <rect x="36" y="1440" width="1128" height="320" rx="4" fill="rgba(255,250,240,0.97)"/>
  <line x1="160" y1="1480" x2="1040" y2="1480" stroke="#e8d5b0" stroke-width="2"/>
  <text x="600" y="1580" text-anchor="middle" font-family="'Poppins', 'Georgia', serif" font-style="italic" font-size="58" fill="#6b4c2a">{{COUPLE_NAME}}</text>
  <text x="600" y="1660" text-anchor="middle" font-family="'SF Pro', sans-serif" font-size="24" fill="#9c7c5e" letter-spacing="6">FOREVER &amp; ALWAYS</text>
</svg>`,
    png_url: null,
    is_active: true,
    sort_order: 1,
  },
  {
    name: "Floral White",
    svg_code: `<svg width="1200" height="1800" viewBox="0 0 1200 1800" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="1160" height="1760" rx="28" fill="none" stroke="#f0c4be" stroke-width="16"/>
  <rect x="44" y="44" width="1112" height="1712" rx="20" fill="none" stroke="#d4847a" stroke-width="4"/>
  <circle cx="120" cy="80" r="32" fill="rgba(212,132,122,0.3)"/>
  <circle cx="1080" cy="80" r="32" fill="rgba(212,132,122,0.3)"/>
  <rect x="70" y="90" width="500" height="410" rx="12" fill="none" stroke="#d4847a" stroke-width="4"/>
  <rect x="630" y="90" width="500" height="410" rx="12" fill="none" stroke="#d4847a" stroke-width="4"/>
  <rect x="70" y="540" width="500" height="410" rx="12" fill="none" stroke="#d4847a" stroke-width="4"/>
  <rect x="630" y="540" width="500" height="410" rx="12" fill="none" stroke="#d4847a" stroke-width="4"/>
  <rect x="70" y="990" width="500" height="410" rx="12" fill="none" stroke="#d4847a" stroke-width="4"/>
  <rect x="630" y="990" width="500" height="410" rx="12" fill="none" stroke="#d4847a" stroke-width="4"/>
  <rect x="44" y="1450" width="1112" height="300" rx="16" fill="rgba(255,255,255,0.97)"/>
  <text x="600" y="1575" text-anchor="middle" font-family="'Poppins', 'Georgia', serif" font-style="italic" font-size="54" fill="#d4847a">{{COUPLE_NAME}}</text>
  <text x="600" y="1655" text-anchor="middle" font-family="'SF Pro', sans-serif" font-size="24" fill="#c06b60" letter-spacing="5">LOVE CELEBRATION</text>
</svg>`,
    png_url: null,
    is_active: true,
    sort_order: 2,
  },
  {
    name: "Classic Film",
    svg_code: `<svg width="1200" height="1800" viewBox="0 0 1200 1800" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="1200" height="1800" rx="0" fill="rgba(30,20,10,0.06)"/>
  <rect x="0" y="0" width="1200" height="60" fill="rgba(44,24,16,0.85)"/>
  <rect x="0" y="1740" width="1200" height="60" fill="rgba(44,24,16,0.85)"/>
  <rect x="70" y="90" width="500" height="410" rx="0" fill="none" stroke="rgba(44,24,16,0.4)" stroke-width="4"/>
  <rect x="630" y="90" width="500" height="410" rx="0" fill="none" stroke="rgba(44,24,16,0.4)" stroke-width="4"/>
  <rect x="70" y="540" width="500" height="410" rx="0" fill="none" stroke="rgba(44,24,16,0.4)" stroke-width="4"/>
  <rect x="630" y="540" width="500" height="410" rx="0" fill="none" stroke="rgba(44,24,16,0.4)" stroke-width="4"/>
  <rect x="70" y="990" width="500" height="410" rx="0" fill="none" stroke="rgba(44,24,16,0.4)" stroke-width="4"/>
  <rect x="630" y="990" width="500" height="410" rx="0" fill="none" stroke="rgba(44,24,16,0.4)" stroke-width="4"/>
  <rect x="40" y="1450" width="1120" height="260" fill="rgba(250,246,240,0.96)"/>
  <text x="600" y="1560" text-anchor="middle" font-family="'SF Pro', sans-serif" font-weight="bold" font-size="44" fill="#6b4c2a" letter-spacing="8">{{COUPLE_NAME}}</text>
  <text x="600" y="1635" text-anchor="middle" font-family="'SF Pro', sans-serif" font-size="24" fill="#9c7c5e" letter-spacing="4">⬛ SWEET MOMENTS ⬛</text>
</svg>`,
    png_url: null,
    is_active: true,
    sort_order: 3,
  },
];

// Helper to draw cover-cropped image into canvas slot
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw =
    (img as HTMLVideoElement).videoWidth ||
    (img as HTMLImageElement).naturalWidth ||
    (img as HTMLCanvasElement).width;
  const ih =
    (img as HTMLVideoElement).videoHeight ||
    (img as HTMLImageElement).naturalHeight ||
    (img as HTMLCanvasElement).height;
  if (!iw || !ih) return;

  const targetRatio = w / h;
  const imgRatio = iw / ih;
  let sx = 0,
    sy = 0,
    sWidth = iw,
    sHeight = ih;

  if (imgRatio > targetRatio) {
    sWidth = ih * targetRatio;
    sx = (iw - sWidth) / 2;
  } else {
    sHeight = iw / targetRatio;
    sy = (ih - sHeight) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  ctx.restore();
}

export default function GuestApp() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const activeSlug = eventSlug || "demo";

  // States
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [guestName, setGuestName] = useState<string>("");
  const [screen, setScreen] = useState<ScreenName>("welcome");

  // Frame Slider Touch States & Handlers
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const nextFrameSlide = () => {
    if (frames.length <= 1) return;
    setSelectedFrameIndex((prev) => (prev + 1) % frames.length);
  };

  const prevFrameSlide = () => {
    if (frames.length <= 1) return;
    setSelectedFrameIndex((prev) => (prev - 1 + frames.length) % frames.length);
  };

  const handleSliderTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleSliderTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextFrameSlide();
      } else {
        prevFrameSlide();
      }
    }
    setTouchStartX(null);
  };

  // Multi-shot photo states (3 photos taken, duplicated into 6 slots)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [currentShotIndex, setCurrentShotIndex] = useState<number>(0);
  const [shotReviewUrl, setShotReviewUrl] = useState<string | null>(null);
  const [compositePreviewUrl, setCompositePreviewUrl] = useState<string>("");
  const [isGeneratingComposite, setIsGeneratingComposite] =
    useState<boolean>(false);

  // Audio recording states
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/mp4");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadLabel, setUploadLabel] = useState<string>("Mempersiapkan...");
  const [uploadError, setUploadError] = useState<boolean>(false);
  const [messageText, setMessageText] = useState<string>("");
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isEventNotFound, setIsEventNotFound] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const waveIntervalRef = useRef<number | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Wave heights state
  const [waveHeights, setWaveHeights] = useState<number[]>(
    new Array(12).fill(8),
  );

  // Load Event Config & Frames
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const { data, error } = await db
          .from("events")
          .select(
            "id, couple_name, event_date, event_location, allow_voice, allow_chat, require_name, allow_retake, is_active, couple_photo_url, theme_color",
          )
          .eq("slug", activeSlug)
          .single();

        if (error || !data) throw error || new Error("Event not found");

        if (!data.is_active) {
          setIsEventNotFound(true);
          setIsLoading(false);
          return;
        }

        setEventConfig(data);

        // Load active frames for event
        const { data: dbFrames, error: framesError } = await db
          .from("frames")
          .select("*")
          .eq("event_id", data.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (!framesError && dbFrames && dbFrames.length > 0) {
          setFrames(dbFrames);
        } else {
          // Fallback to default frames
          const localFrames = defaultFramesData.map((f, i) => ({
            id: `local-${i}`,
            name: f.name,
            svg_code: f.svg_code,
            png_url: f.png_url,
            is_active: f.is_active,
            sort_order: f.sort_order,
          }));
          setFrames(localFrames);
        }
      } catch (err: any) {
        console.warn("Using demo/offline event config:", err.message);
        // Load demo/fallback configuration
        setEventConfig({
          id: "demo-id",
          couple_name: "Ahmad & Siti",
          event_date: "2026-06-15",
          event_location: "Gedung Serbaguna, Bandung",
          allow_voice: true,
          allow_chat: true,
          require_name: true,
          allow_retake: true,
          is_active: true,
          couple_photo_url: null,
          theme_color: "#c9a96e",
        });
        const localFrames = defaultFramesData.map((f, i) => ({
          id: `local-${i}`,
          name: f.name,
          svg_code: f.svg_code,
          png_url: f.png_url,
          is_active: f.is_active,
          sort_order: f.sort_order,
        }));
        setFrames(localFrames);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [activeSlug]);

  // Set Background Image & Theme Color
  useEffect(() => {
    if (eventConfig?.couple_photo_url) {
      document.body.style.backgroundImage = `url('${eventConfig.couple_photo_url}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = "";
    }

    if (eventConfig?.theme_color) {
      document.documentElement.style.setProperty(
        "--gold",
        eventConfig.theme_color,
      );
    } else {
      document.documentElement.style.removeProperty("--gold");
    }

    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundAttachment = "";
      document.documentElement.style.removeProperty("--gold");
    };
  }, [eventConfig]);

  // Manage camera streaming based on screen
  useEffect(() => {
    if (screen === "camera" && !shotReviewUrl) {
      startCamera(facingMode);
    } else if (screen !== "camera") {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [screen, shotReviewUrl]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, []);

  // Camera helpers
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    setCameraError(false);
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (e) {
      console.error("Camera access failed:", e);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error("Fallback camera also failed:", fallbackErr);
        setCameraError(true);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const coupleName = eventConfig?.couple_name || "Ahmad & Siti";

  // Render high-fidelity frame preview with PNG/SVG support and photo slot indicators
  const renderFramePreview = (frame: Frame) => {
    const fLayout = getFrameLayout(frame);

    return (
      <div
        className="frame-canvas-stage"
        style={{
          aspectRatio: `${fLayout.width || 1200} / ${fLayout.height || 1800}`,
        }}
      >
        {/* Background Frame (PNG / SVG) */}
        {frame.png_url ? (
          <img
            src={frame.png_url}
            alt={frame.name}
            className="frame-canvas-media-img"
          />
        ) : frame.svg_code ? (
          <div
            className="frame-canvas-media-svg"
            dangerouslySetInnerHTML={{
              __html: frame.svg_code.replace(
                /\{\{COUPLE_NAME\}\}/g,
                coupleName,
              ),
            }}
          />
        ) : (
          <div className="frame-canvas-fallback">
            <span>{frame.name}</span>
          </div>
        )}

        {/* Photo slot overlay guides */}
        <div className="frame-canvas-slots-overlay">
          {fLayout.slots.map((slot, sIdx) => {
            const leftPct = (slot.x / (fLayout.width || 1200)) * 100;
            const topPct = (slot.y / (fLayout.height || 1800)) * 100;
            const widthPct = (slot.width / (fLayout.width || 1200)) * 100;
            const heightPct = (slot.height / (fLayout.height || 1800)) * 100;
            const poseNum = (slot.photo_index ?? slot.photoIndex ?? 0) + 1;

            return (
              <div
                key={sIdx}
                className="frame-slot-preview-box"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
              >
                <div className="slot-box-inner">
                  <span className="slot-cam-icon">📷</span>
                  <span className="slot-pose-label">Foto {poseNum}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedFrame = frames[selectedFrameIndex] || null;
  const activeLayout = getFrameLayout(selectedFrame);
  const totalShots = Math.max(1, activeLayout.shot_count || 3);

  // Current target slot for camera framing
  const currentSlot = activeLayout.slots.find(
    (s) => (s.photo_index ?? s.photoIndex ?? 0) === currentShotIndex,
  ) ||
    activeLayout.slots[0] || { width: 500, height: 410, x: 0, y: 0 };
  const currentSlotRatio =
    (currentSlot.width || 500) / (currentSlot.height || 410);

  // Capture current pose snapshot
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.srcObject) {
      alert("Kamera belum aktif");
      return;
    }

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 960;

    const slotRatio = currentSlotRatio;
    const videoRatio = videoWidth / videoHeight;

    let sx = 0,
      sy = 0,
      sWidth = videoWidth,
      sHeight = videoHeight;
    if (videoRatio > slotRatio) {
      sWidth = videoHeight * slotRatio;
      sx = (videoWidth - sWidth) / 2;
    } else {
      sHeight = videoWidth / slotRatio;
      sy = (videoHeight - sHeight) / 2;
    }

    // Capture at high resolution proportional to slot
    const captureW = Math.max(800, (currentSlot.width || 500) * 2);
    const captureH = Math.round(captureW / slotRatio);
    canvas.width = captureW;
    canvas.height = captureH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        video,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setShotReviewUrl(dataUrl);

    // Flash animation effect
    const flash = document.createElement("div");
    flash.style.cssText =
      "position:absolute;inset:0;background:#fff;z-index:99;border-radius:16px;";
    video.parentElement?.appendChild(flash);
    setTimeout(() => flash.remove(), 200);
  };

  // Accept current pose photo and advance or finish
  const acceptCurrentShot = async () => {
    if (!shotReviewUrl) return;

    const newPhotos = [...capturedPhotos];
    newPhotos[currentShotIndex] = shotReviewUrl;
    setCapturedPhotos(newPhotos);
    setShotReviewUrl(null);

    if (currentShotIndex < totalShots - 1) {
      // Proceed to next pose
      setCurrentShotIndex(currentShotIndex + 1);
    } else {
      // All photos completed! Generate composite preview
      stopCamera();
      setIsGeneratingComposite(true);
      setScreen("preview");

      try {
        const mergedCanvas = await mergePhotosAndFrame(
          newPhotos,
          frames[selectedFrameIndex],
          coupleName,
        );
        setCompositePreviewUrl(mergedCanvas.toDataURL("image/jpeg", 0.92));
      } catch (err) {
        console.error("Failed to generate composite preview:", err);
      } finally {
        setIsGeneratingComposite(false);
      }
    }
  };

  // Retake current shot in camera
  const retakeCurrentShot = () => {
    setShotReviewUrl(null);
  };

  // Retake a specific pose or all from Preview screen
  const retakePose = (poseIndex: number) => {
    setCurrentShotIndex(poseIndex);
    setShotReviewUrl(null);
    setScreen("camera");
  };

  const retakeAllPhotos = () => {
    setCapturedPhotos([]);
    setCurrentShotIndex(0);
    setShotReviewUrl(null);
    setCompositePreviewUrl("");
    setScreen("camera");
  };

  // Merging captured photos into Canvas with Frame overlay
  const mergePhotosAndFrame = async (
    photoDataUrls: string[],
    frame: Frame | null,
    coupleNameStr: string,
  ): Promise<HTMLCanvasElement> => {
    const layout = getFrameLayout(frame);
    const out = document.createElement("canvas");
    out.width = layout.width || 1200;
    out.height = layout.height || 1800;
    const ctx = out.getContext("2d");
    if (!ctx) return out;

    // Fill background with clean white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);

    // Pre-load all captured photos
    const loadedPhotos: (HTMLImageElement | null)[] = await Promise.all(
      photoDataUrls.map(
        (url) =>
          new Promise<HTMLImageElement | null>((resolve) => {
            if (!url) return resolve(null);
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
          }),
      ),
    );

    // Draw each photo slot defined in layout_config
    for (const slot of layout.slots) {
      const pIdx = slot.photo_index ?? slot.photoIndex ?? 0;
      const photoImg = loadedPhotos[pIdx] || loadedPhotos[0];
      if (photoImg && photoImg.complete && photoImg.naturalWidth > 0) {
        drawCoverImage(ctx, photoImg, slot.x, slot.y, slot.width, slot.height);
      } else {
        // Soft placeholder if not yet taken
        ctx.fillStyle = "#f5ede0";
        ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
      }
    }

    // Draw the selected frame overlay on top
    if (frame) {
      try {
        if (frame.svg_code) {
          const svgCode = frame.svg_code
            .replace(/\{\{COUPLE_NAME\}\}/g, coupleNameStr)
            .replace(/\{\{COUPLE_NAME_UPPER\}\}/g, coupleNameStr.toUpperCase());
          const svgBlob = new Blob([svgCode], { type: "image/svg+xml" });
          const svgUrl = URL.createObjectURL(svgBlob);
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, out.width, out.height);
              URL.revokeObjectURL(svgUrl);
              resolve();
            };
            img.onerror = reject;
            img.src = svgUrl;
          });
        } else if (frame.png_url) {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              ctx.drawImage(img, 0, 0, out.width, out.height);
              resolve();
            };
            img.onerror = reject;
            img.src = frame.png_url || "";
          });
        }
      } catch (e) {
        console.warn("Merging frame overlay failed:", e);
      }
    }

    return out;
  };

  // Audio recording helpers
  const getSupportedMimeType = (): string => {
    const candidates = [
      "audio/mp4",
      "audio/aac",
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    }
    return "";
  };

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      audioStreamRef.current = audioStream;
      const chunks: BlobPart[] = [];

      const mimeType = getSupportedMimeType();
      const recorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(audioStream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      const resolvedMime = mimeType || mediaRecorder.mimeType || "audio/mp4";
      setAudioMimeType(resolvedMime);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: resolvedMime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        audioStream.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
        stopWave();
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

      startWave();
    } catch (e) {
      console.error(e);
      alert("Izin mikrofon diperlukan untuk merekam ucapan 🎙️");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startWave = () => {
    waveIntervalRef.current = window.setInterval(() => {
      setWaveHeights(Array.from({ length: 12 }, () => 4 + Math.random() * 28));
    }, 120);
  };

  const stopWave = () => {
    if (waveIntervalRef.current) {
      clearInterval(waveIntervalRef.current);
      waveIntervalRef.current = null;
    }
    setWaveHeights(new Array(12).fill(8));
  };

  // Upload to Supabase
  const confirmSend = async () => {
    setScreen("upload");
    setUploadProgress(10);
    setUploadLabel("Menghubungkan ke cloud...");
    setUploadError(false);

    try {
      let eventId = eventConfig?.id;
      if (!eventId || eventId === "demo-id") {
        const { data: ev, error: evErr } = await db
          .from("events")
          .select("id")
          .eq("slug", activeSlug)
          .single();
        if (evErr || !ev) {
          throw new Error("Event tidak ditemukan. Hubungi panitia.");
        }
        eventId = ev.id;
      }

      setUploadProgress(25);
      setUploadLabel("Merender frame 1200x1800 HD...");

      const finalCanvas = await mergePhotosAndFrame(
        capturedPhotos,
        frames[selectedFrameIndex],
        coupleName,
      );
      const photoBlob = await new Promise<Blob | null>((resolve) =>
        finalCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92),
      );
      if (!photoBlob) throw new Error("Gagal mengolah file foto");

      setUploadProgress(45);
      setUploadLabel("Mengunggah foto photobooth...");

      const ts = Date.now();
      const safeName = guestName.replace(/[^a-zA-Z0-9]/g, "_") || "Tamu";
      const photoPath = `${eventId}/${ts}_${safeName}.jpg`;

      const { error: photoErr } = await db.storage
        .from("photos")
        .upload(photoPath, photoBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (photoErr) throw new Error("Gagal upload foto: " + photoErr.message);

      const {
        data: { publicUrl: photoUrl },
      } = db.storage.from("photos").getPublicUrl(photoPath);

      let voiceUrl: string | null = null;
      if (audioBlob && audioBlob.size > 0) {
        setUploadProgress(65);
        setUploadLabel("Mengunggah ucapan...");

        const getAudioExtension = (mime: string): string => {
          if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
          if (mime.includes("webm")) return "webm";
          if (mime.includes("ogg")) return "ogg";
          return "m4a";
        };
        const getAudioContentType = (mime: string): string => {
          if (mime.includes("mp4") || mime.includes("aac")) return "audio/mp4";
          if (mime.includes("webm")) return "audio/webm";
          if (mime.includes("ogg")) return "audio/ogg";
          return "audio/mp4";
        };

        const ext = getAudioExtension(audioMimeType);
        const cType = getAudioContentType(audioMimeType);
        const audioPath = `${eventId}/${ts}_${safeName}.${ext}`;

        let voiceBucket = "voices";
        let uploadRes = await db.storage
          .from(voiceBucket)
          .upload(audioPath, audioBlob, {
            contentType: cType,
            upsert: false,
          });

        if (uploadRes.error) {
          console.warn(
            "Upload to 'voices' bucket failed, attempting fallback to 'photos':",
            uploadRes.error,
          );
          voiceBucket = "photos";
          uploadRes = await db.storage
            .from(voiceBucket)
            .upload(audioPath, audioBlob, {
              contentType: cType,
              upsert: false,
            });
        }

        if (!uploadRes.error) {
          const {
            data: { publicUrl: vUrl },
          } = db.storage.from(voiceBucket).getPublicUrl(audioPath);
          voiceUrl = vUrl;
        } else {
          console.error(
            "Gagal mengunggah file rekaman suara:",
            uploadRes.error,
          );
        }
      }

      setUploadProgress(85);
      setUploadLabel("Menyimpan ke cloud...");

      const selectedFrame = frames[selectedFrameIndex];
      const { error: dbErr } = await db.from("submissions").insert({
        event_id: eventId,
        guest_name: guestName,
        photo_url: photoUrl,
        voice_url: voiceUrl,
        message_text: messageText.trim() || null,
        frame_name: selectedFrame ? selectedFrame.name : "Standard",
        frame_index: selectedFrameIndex,
      });

      if (dbErr) throw new Error("Gagal menyimpan: " + dbErr.message);

      setUploadProgress(100);
      setUploadLabel("Terkirim! ✓");

      setTimeout(() => {
        setScreen("success");
      }, 500);
    } catch (err: any) {
      console.error("Upload error details:", err);
      setUploadError(true);
      setUploadLabel("⚠️ " + (err.message || "Gagal mengunggah. Coba lagi."));
      setUploadProgress(0);
      setTimeout(() => {
        setScreen("voice");
      }, 3000);
    }
  };

  // Screen rendering
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "24px",
              color: "#6b4c2a",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Memuat Event...
          </div>
        </div>
      </div>
    );
  }

  if (isEventNotFound) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
          textAlign: "center",
          padding: "40px",
        }}
      >
        <div>
          <div style={{ fontSize: "48px" }}>🔒</div>
          <h2 style={{ margin: "16px 0 8px", color: "#3d2b14" }}>
            Event Tidak Tersedia
          </h2>
          <p style={{ color: "#9c7c5e" }}>
            Link ini sudah tidak aktif. Hubungi panitia untuk info lebih lanjut.
          </p>
        </div>
      </div>
    );
  }

  const heroDateStr = eventConfig?.event_date
    ? new Date(eventConfig.event_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const heroMeta = [heroDateStr, eventConfig?.event_location]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="guest-app-body">
      {eventConfig?.couple_photo_url && (
        <div
          id="body-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(44, 24, 16, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Welcome Screen */}
      <div
        className={`screen ${screen === "welcome" ? "active" : ""}`}
        id="s-welcome"
      >
        <div
          className="guest-hero"
          style={{
            backgroundImage: eventConfig?.couple_photo_url
              ? `url('${eventConfig.couple_photo_url}')`
              : undefined,
          }}
        >
          <div className="guest-hero-overlay" />
          <div className="guest-hero-text">
            <span className="guest-hero-event">EVENT</span>
            <span className="guest-hero-couple">{coupleName}</span>
            {heroMeta && <span className="guest-hero-date">{heroMeta}</span>}
          </div>
          <div className="guest-hero-badge">
            <div className="guest-hero-pulse" /> Live
          </div>
        </div>

        <div className="card">
          <div className="logo">✦ PHOTOBOOTH EVENT ✦</div>
          <div className="title">Selamat Datang</div>
          <p className="subtitle">
            Abadikan momen foto spesial &amp; kirim ucapan hangat untuk
            kebahagiaan pasangan
          </p>
          <div className="steps">
            <div className="step-dot active"></div>
            <div className="step-dot"></div>
            <div className="step-dot"></div>
            <div className="step-dot"></div>
          </div>
          <div className="input-wrap">
            <label>Nama Kamu</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Tulis nama lengkap..."
              autoComplete="off"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (eventConfig?.require_name && !guestName.trim()) {
                alert("Isi nama dulu ya! 😊");
                return;
              }
              setScreen("frame");
            }}
          >
            Lanjutkan →
          </button>
        </div>
        <header className="app-header">
          <img
            src={logoBk}
            alt="Logo Bingkis Kaca"
            className="app-logo-header"
          />
        </header>
      </div>

      {/* Frame Picker Screen (Interactive Mobile-First Slider) */}
      <div
        className={`screen ${screen === "frame" ? "active" : ""}`}
        id="s-frame"
      >
        <div className="card">
          <div className="title">Pilih Bingkai</div>
          <p className="subtitle">
            Geser untuk memilih desain bingkai favoritmu (
            {selectedFrameIndex + 1}/{frames.length}):
          </p>
          <div className="steps">
            <div className="step-dot done"></div>
            <div className="step-dot active"></div>
            <div className="step-dot"></div>
            <div className="step-dot"></div>
          </div>

          {/* Smooth Interactive Frame Slider */}
          <div
            className="frame-slider-container"
            onTouchStart={handleSliderTouchStart}
            onTouchEnd={handleSliderTouchEnd}
          >
            {/* Prev Button */}
            {frames.length > 1 && (
              <button
                type="button"
                className="frame-nav-arrow arrow-left"
                onClick={prevFrameSlide}
                aria-label="Bingkai Sebelumnya"
              >
                ‹
              </button>
            )}

            <div className="frame-slider-stage">
              {frames.map((frame, index) => {
                const fLayout = getFrameLayout(frame);
                const isCurrent = index === selectedFrameIndex;
                const isPrev =
                  index ===
                  (selectedFrameIndex - 1 + frames.length) % frames.length;
                const isNext =
                  index === (selectedFrameIndex + 1) % frames.length;

                let slideClass = "slide-hidden";
                if (isCurrent) slideClass = "slide-current";
                else if (isPrev && frames.length > 1) slideClass = "slide-prev";
                else if (isNext && frames.length > 1) slideClass = "slide-next";

                return (
                  <div
                    key={frame.id}
                    className={`frame-slide-card ${slideClass}`}
                    onClick={() => setSelectedFrameIndex(index)}
                  >
                    <div className="frame-card-canvas-wrap">
                      {renderFramePreview(frame)}
                      {isCurrent && (
                        <div className="active-frame-pill">✓ Dipilih</div>
                      )}
                    </div>

                    <div className="frame-slide-footer">
                      <h4 className="frame-slide-title">{frame.name}</h4>
                      <div className="frame-meta-tags">
                        <span className="frame-meta-chip chip-gold">
                          📸 {fLayout.shot_count}x Pose
                        </span>
                        <span className="frame-meta-chip chip-warm">
                          🖼️ {fLayout.slots.length} Foto
                        </span>
                        <span className="frame-meta-chip chip-dim">
                          {fLayout.width}×{fLayout.height} px
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Button */}
            {frames.length > 1 && (
              <button
                type="button"
                className="frame-nav-arrow arrow-right"
                onClick={nextFrameSlide}
                aria-label="Bingkai Berikutnya"
              >
                ›
              </button>
            )}

            {/* Dots Indicator */}
            {frames.length > 1 && (
              <div className="frame-slider-dots">
                {frames.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`frame-dot ${idx === selectedFrameIndex ? "active" : ""}`}
                    onClick={() => setSelectedFrameIndex(idx)}
                    aria-label={`Pilih bingkai ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              setCapturedPhotos([]);
              setCurrentShotIndex(0);
              setShotReviewUrl(null);
              setScreen("camera");
            }}
          >
            Mulai Foto ({totalShots}x Pose) →
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setScreen("welcome")}
          >
            ← Kembali
          </button>
        </div>
      </div>

      {/* Camera Screen */}
      <div
        className={`screen ${screen === "camera" ? "active" : ""}`}
        id="s-camera"
      >
        <div className="card">
          <div className="title">Ambil Foto</div>
          <p className="subtitle">
            {shotReviewUrl
              ? `Review Pose ${currentShotIndex + 1} dari ${totalShots}`
              : `Pose ${currentShotIndex + 1} dari ${totalShots} — Siapkan gayamu! 📸`}
          </p>

          {/* Multi-pose progress badges */}
          <div className="pose-indicator-bar">
            {Array.from({ length: totalShots }).map((_, idx) => {
              const isDone = capturedPhotos[idx] !== undefined;
              const isCurrent = idx === currentShotIndex;
              return (
                <div
                  key={idx}
                  className={`pose-badge ${isCurrent ? "current" : isDone ? "done" : ""}`}
                >
                  {isDone && !isCurrent ? (
                    <span className="pose-check">✓</span>
                  ) : (
                    `Pose ${idx + 1}`
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="camera-wrap"
            style={{
              aspectRatio: `${currentSlot.width || 500} / ${currentSlot.height || 410}`,
            }}
          >
            {cameraError ? (
              <div className="cam-error">
                <div className="cam-error-icon">📷</div>
                <div>
                  Kamera tidak dapat diakses.
                  <br />
                  Pastikan izin kamera sudah diberikan.
                  <br />
                  <small style={{ marginTop: "8px", display: "block" }}>
                    Klik ikon gembok 🔒 di address bar → Izinkan Kamera
                  </small>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  id="video"
                  className={facingMode === "user" ? "mirrored" : "normal"}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: shotReviewUrl ? "none" : "block" }}
                ></video>

                {/* Instant Shot Review Overlay */}
                {shotReviewUrl && (
                  <div className="shot-review-container">
                    <img
                      src={shotReviewUrl}
                      alt={`Pose ${currentShotIndex + 1}`}
                      className="shot-review-img"
                    />
                    <div className="shot-review-badge">
                      Pose {currentShotIndex + 1} Tersimpan
                    </div>
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  id="canvas"
                  style={{ display: "none" }}
                ></canvas>

                {!shotReviewUrl && (
                  <>
                    <button
                      type="button"
                      className="cam-flip-floating"
                      onClick={toggleCameraFacing}
                      title="Ganti Kamera Depan / Belakang"
                    >
                      <i className="ti ti-camera-rotate" aria-hidden="true"></i>
                    </button>
                    <div className="camera-viewfinder-guides">
                      <div className="corner-guide top-left"></div>
                      <div className="corner-guide top-right"></div>
                      <div className="corner-guide bottom-left"></div>
                      <div className="corner-guide bottom-right"></div>
                    </div>
                    <div className="camera-hint">
                      {facingMode === "user"
                        ? "Kamera Depan (Selfie)"
                        : "Kamera Belakang"}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Camera Controls */}
          {!cameraError && !shotReviewUrl && (
            <div className="camera-controls-bar">
              <div className="cam-ctrl-space"></div>
              <div
                className="shutter-btn"
                onClick={takePhoto}
                title="Jepret Foto"
              >
                <div className="shutter-inner"></div>
              </div>
              <button
                type="button"
                className="cam-flip-btn"
                onClick={toggleCameraFacing}
                title="Ganti Kamera Depan / Belakang"
              >
                <i className="ti ti-camera-rotate" aria-hidden="true"></i>
              </button>
            </div>
          )}

          {/* Shot Review Action Buttons */}
          {shotReviewUrl && (
            <div className="shot-review-actions">
              <button
                className="btn btn-primary"
                onClick={acceptCurrentShot}
                style={{ width: "100%", marginBottom: "8px" }}
              >
                {currentShotIndex < totalShots - 1
                  ? `✓ Gunakan, Lanjut Pose ${currentShotIndex + 2} →`
                  : "✓ Selesai, Lihat Frame →"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={retakeCurrentShot}
                style={{ width: "100%" }}
              >
                🔄 Ambil Ulang Pose Ini
              </button>
            </div>
          )}

          {!shotReviewUrl && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                stopCamera();
                setScreen("frame");
              }}
            >
              ← Ganti Frame
            </button>
          )}
        </div>
      </div>

      {/* Preview Screen */}
      <div
        className={`screen ${screen === "preview" ? "active" : ""}`}
        id="s-preview"
      >
        <div className="card">
          <div className="title">Hasil Photobooth</div>
          <p className="subtitle">
            {activeLayout.slots.length} Foto ({totalShots} Pose) di dalam
            bingkai {activeLayout.width}×{activeLayout.height} px ✨
          </p>

          <div
            className="preview-wrap-1200"
            style={{
              aspectRatio: `${activeLayout.width || 1200} / ${activeLayout.height || 1800}`,
            }}
          >
            {isGeneratingComposite ? (
              <div className="preview-loading">
                <div className="preview-spinner"></div>
                <span>Menyusun foto ke dalam frame...</span>
              </div>
            ) : (
              <img
                id="preview-img"
                src={compositePreviewUrl}
                alt="Photobooth Frame Final"
              />
            )}
          </div>

          {/* Retake individual pose chips */}
          {eventConfig?.allow_retake && !isGeneratingComposite && (
            <div className="retake-strip">
              <div className="retake-strip-title">
                Ambil ulang pose tertentu:
              </div>
              <div className="retake-chip-group">
                {Array.from({ length: totalShots }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="retake-chip-btn"
                    onClick={() => retakePose(idx)}
                  >
                    🔄 Ulangi Pose {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={isGeneratingComposite}
            onClick={() => {
              if (eventConfig?.allow_voice || eventConfig?.allow_chat) {
                setScreen("voice");
              } else {
                confirmSend();
              }
            }}
          >
            {eventConfig?.allow_voice || eventConfig?.allow_chat
              ? "Lanjut ke Ucapan →"
              : "Kirim Foto ✨"}
          </button>

          {eventConfig?.allow_retake && (
            <button
              className="btn btn-secondary"
              disabled={isGeneratingComposite}
              onClick={retakeAllPhotos}
            >
              🔄 Ambil Ulang Semua ({totalShots} Pose)
            </button>
          )}
        </div>
      </div>

      {/* Voice & Chat Note Screen */}
      <div
        className={`screen ${screen === "voice" ? "active" : ""}`}
        id="s-voice"
      >
        <div className="card">
          <div className="title">Ucapan Spesial</div>
          <p className="subtitle">Kirim ucapan &amp; doa untuk pengantin 💌</p>
          <div className="steps">
            <div className="step-dot done"></div>
            <div className="step-dot done"></div>
            <div className="step-dot done"></div>
            <div className="step-dot active"></div>
          </div>

          {/* Voice Note Section */}
          {eventConfig?.allow_voice && (
            <div className="voice-section">
              <div className="message-section-label">🎙️ Rekam Ucapan Suara</div>
              <div
                className={`voice-icon ${isRecording ? "recording" : ""}`}
                onClick={toggleRecording}
              >
                {isRecording ? "⏹" : "🎙️"}
              </div>
              <div className="voice-status">
                {isRecording
                  ? "Merekam... (tap untuk berhenti)"
                  : audioUrl
                    ? "Rekaman selesai ✓"
                    : "Tap untuk mulai rekam"}
              </div>
              <div className="voice-timer">
                0:{recordingSeconds.toString().padStart(2, "0")}
              </div>
              <div className={`waveform ${isRecording ? "active" : ""}`}>
                {waveHeights.map((h, i) => (
                  <div
                    className="bar"
                    key={i}
                    style={{ height: `${h}px` }}
                  ></div>
                ))}
              </div>
              {audioUrl && (
                <audio
                  id="audio-playback"
                  src={audioUrl}
                  controls
                  playsInline
                  style={{ width: "100%", marginTop: "8px" }}
                ></audio>
              )}
            </div>
          )}

          {/* Divider between voice and chat */}
          {eventConfig?.allow_voice && eventConfig?.allow_chat && (
            <div className="message-divider">
              <span>atau</span>
            </div>
          )}

          {/* Chat Note Section */}
          {eventConfig?.allow_chat && (
            <div className="chat-section">
              <div className="message-section-label">💬 Tulis Pesan Teks</div>
              <textarea
                className="chat-textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Tulis ucapan & doa terbaikmu untuk pengantin..."
                maxLength={500}
                rows={4}
              />
              <div className="chat-char-count">{messageText.length}/500</div>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={confirmSend}
            style={{
              display: audioUrl || messageText.trim() ? "block" : "none",
            }}
          >
            Kirim Ucapan ✨
          </button>

          {!audioUrl && !messageText.trim() && (
            <button
              className="btn btn-primary"
              style={{ opacity: 0.7 }}
              onClick={confirmSend}
            >
              Lewati, Kirim Foto Saja →
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => {
              setScreen("preview");
            }}
          >
            ← Kembali
          </button>
        </div>
      </div>

      {/* Uploading Screen */}
      <div
        className={`screen ${screen === "upload" ? "active" : ""}`}
        id="s-upload"
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📡</div>
          <div className="title">Mengirim...</div>
          <p className="subtitle">
            Foto 1200×1800 &amp; ucapanmu sedang dikirim ke pengantin
          </p>
          <div className="upload-bar">
            <div
              className="upload-fill"
              style={{
                width: `${uploadProgress}%`,
                background: uploadError
                  ? "linear-gradient(90deg, #e53e3e, #c53030)"
                  : "",
              }}
            ></div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {uploadLabel}
          </p>
        </div>
      </div>

      {/* Success Screen */}
      <div
        className={`screen ${screen === "success" ? "active" : ""}`}
        id="s-success"
      >
        <div className="card" style={{ textAlign: "center" }}>
          <div className="success-icon">💖</div>
          <div className="title">Terima Kasih!</div>
          <div className="divider"></div>
          <div className="guest-name-display">
            {guestName || "Tamu Undangan"}
          </div>
          <p className="subtitle" style={{ marginTop: "8px" }}>
            Foto &amp; ucapanmu sudah terkirim ke pengantin. Semoga jadi
            kenangan indah! 🌸
          </p>
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              background: "var(--warm)",
              borderRadius: "12px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                fontStyle: "italic",
                fontFamily: '"Playfair Display", serif',
              }}
            >
              "Bahagia selalu, semoga langgeng hingga kakek nenek 🙏"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
