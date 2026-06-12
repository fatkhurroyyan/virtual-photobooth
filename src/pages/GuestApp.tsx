import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../supabaseClient";
import logoBk from "../assets/logo-bk.svg";
import "./GuestApp.css";

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

interface Frame {
  id: string;
  name: string;
  svg_code: string | null;
  png_url: string | null;
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
    svg_code: `<svg width="300" height="400" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="292" height="392" rx="4" fill="none" stroke="#c9a96e" stroke-width="8"/><rect x="14" y="14" width="272" height="372" rx="2" fill="none" stroke="#e8d5b0" stroke-width="2"/><rect x="18" y="18" width="264" height="310" rx="2" fill="none" stroke="#c9a96e" stroke-width="1" stroke-dasharray="4 4"/><rect x="4" y="336" width="292" height="60" rx="0" fill="rgba(255,255,255,0.95)"/><circle cx="4" cy="4" r="16" fill="none" stroke="#d4847a" stroke-width="3"/><circle cx="296" cy="4" r="16" fill="none" stroke="#d4847a" stroke-width="3"/><circle cx="4" cy="396" r="16" fill="none" stroke="#d4847a" stroke-width="3"/><circle cx="296" cy="396" r="16" fill="none" stroke="#d4847a" stroke-width="3"/><text x="150" y="362" text-anchor="middle" font-family="'Poppins', 'Georgia', 'Times New Roman', sans-serif" font-style="italic" font-size="14" fill="#9c7c5e">{{COUPLE_NAME}}</text><text x="150" y="380" text-anchor="middle" font-family="'SF Pro', sans-serif" font-size="8" fill="#c9a96e" letter-spacing="1.5">HAPPY WEDDING</text></svg>`,
    png_url: null,
    is_active: true,
    sort_order: 0,
  },
  {
    name: "Vintage Gold",
    svg_code: `<svg width="300" height="400" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="296" height="396" rx="2" fill="none" stroke="#c9a96e" stroke-width="4"/><rect x="10" y="10" width="280" height="380" rx="2" fill="none" stroke="#e8d5b0" stroke-width="1"/><path d="M2 40 L2 2 L40 2" fill="none" stroke="#b8843a" stroke-width="3"/><path d="M260 2 L298 2 L298 40" fill="none" stroke="#b8843a" stroke-width="3"/><path d="M2 360 L2 398 L40 398" fill="none" stroke="#b8843a" stroke-width="3"/><path d="M260 398 L298 398 L298 360" fill="none" stroke="#b8843a" stroke-width="3"/><path d="M120 2 Q150 16 180 2" fill="none" stroke="#c9a96e" stroke-width="2"/><circle cx="150" cy="8" r="4" fill="#c9a96e"/><rect x="2" y="330" width="296" height="68" rx="0" fill="rgba(255,255,255,0.97)"/><line x1="20" y1="340" x2="280" y2="340" stroke="#e8d5b0" stroke-width="1"/><text x="150" y="360" text-anchor="middle" font-family="'Poppins', 'Georgia', 'Times New Roman', sans-serif" font-style="italic" font-size="15" fill="#6b4c2a">{{COUPLE_NAME}}</text><text x="150" y="378" text-anchor="middle" font-family="'SF Pro', sans-serif" font-size="8" fill="#9c7c5e" letter-spacing="1.5">FOREVER & ALWAYS</text></svg>`,
    png_url: null,
    is_active: true,
    sort_order: 1,
  },
  {
    name: "Floral White",
    svg_code: `<svg width="300" height="400" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="284" height="384" rx="12" fill="none" stroke="#f0c4be" stroke-width="10"/><rect x="16" y="16" width="268" height="368" rx="8" fill="none" stroke="#d4847a" stroke-width="2"/><circle cx="40" cy="30" r="12" fill="rgba(212,132,122,0.3)"/><circle cx="40" cy="30" r="6" fill="rgba(212,132,122,0.5)"/><circle cx="260" cy="30" r="12" fill="rgba(212,132,122,0.3)"/><circle cx="260" cy="30" r="6" fill="rgba(212,132,122,0.5)"/><circle cx="40" cy="370" r="12" fill="rgba(212,132,122,0.3)"/><circle cx="40" cy="370" r="6" fill="rgba(212,132,122,0.5)"/><circle cx="260" cy="370" r="12" fill="rgba(212,132,122,0.3)"/><circle cx="260" cy="370" r="6" fill="rgba(212,132,122,0.5)"/><rect x="8" y="330" width="284" height="62" rx="0" fill="rgba(255,255,255,0.96)"/><text x="150" y="358" text-anchor="middle" font-family="'Poppins', 'Georgia', 'Times New Roman', sans-serif" font-style="italic" font-size="14" fill="#d4847a">{{COUPLE_NAME}}</text><text x="150" y="378" text-anchor="middle" font-family="'SF Pro', sans-serif" font-size="8" fill="#c06b60" letter-spacing="1.5">LOVE CELEBRATION</text></svg>`,
    png_url: null,
    is_active: true,
    sort_order: 2,
  },
  {
    name: "Classic Film",
    svg_code: `<svg width="300" height="400" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="300" height="400" rx="0" fill="rgba(30,20,10,0.06)"/><rect x="0" y="0" width="300" height="28" fill="rgba(44,24,16,0.7)"/><rect x="0" y="372" width="300" height="28" fill="rgba(44,24,16,0.7)"/><rect x="4" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="38" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="72" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="106" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="140" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="174" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="208" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="242" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="276" y="4" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="4" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="38" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="72" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="106" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="140" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="174" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="208" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="242" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="276" y="376" width="24" height="20" rx="3" fill="rgba(255,255,255,0.15)"/><rect x="0" y="28" width="16" height="344" fill="rgba(44,24,16,0.5)"/><rect x="284" y="28" width="16" height="344" fill="rgba(44,24,16,0.5)"/><rect x="16" y="330" width="268" height="42" fill="rgba(250,246,240,0.95)"/><text x="150" y="350" text-anchor="middle" font-family="'SF Pro', sans-serif" font-weight="bold" font-size="10" fill="#6b4c2a" letter-spacing="3">{{COUPLE_NAME}}</text><text x="150" y="364" text-anchor="middle" font-family="'SF Pro', sans-serif" font-size="8" fill="#9c7c5e">⬛ SWEET MOMENTS ⬛</text></svg>`,
    png_url: null,
    is_active: true,
    sort_order: 3,
  },
];

export default function GuestApp() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const activeSlug = eventSlug || "demo";

  // States
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [guestName, setGuestName] = useState<string>("");
  const [screen, setScreen] = useState<ScreenName>("welcome");
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
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
    if (screen === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [screen]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, []);

  const coupleName = eventConfig?.couple_name || "Ahmad & Siti";

  // Camera helpers
  const startCamera = async () => {
    setCameraError(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
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
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.srcObject) {
      alert("Kamera belum aktif");
      return;
    }

    const videoWidth = video.videoWidth || 720;
    const videoHeight = video.videoHeight || 960;
    
    // Calculate center crop for 3:4 aspect ratio
    const targetRatio = 3 / 4;
    const videoRatio = videoWidth / videoHeight;
    
    let sx = 0, sy = 0, sWidth = videoWidth, sHeight = videoHeight;
    if (videoRatio > targetRatio) {
      // Video is wider than 3:4, crop sides
      sWidth = videoHeight * targetRatio;
      sx = (videoWidth - sWidth) / 2;
    } else {
      // Video is taller than 3:4, crop top/bottom
      sHeight = videoWidth / targetRatio;
      sy = (videoHeight - sHeight) / 2;
    }

    // Fix canvas size to 3:4 (720x960)
    canvas.width = 720;
    canvas.height = 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Snapshot mirrored video with crop
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPhotoDataUrl(dataUrl);

    // Flash animation effect
    const flash = document.createElement("div");
    flash.style.cssText =
      "position:absolute;inset:0;background:#fff;z-index:99;border-radius:16px;";
    video.parentElement?.appendChild(flash);
    setTimeout(() => flash.remove(), 200);

    stopCamera();
    setScreen("preview");
  };

  // Audio recording helpers
  // Detect supported MIME type — iOS Safari supports audio/mp4, not audio/webm
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

      // Pick best supported format for this browser/device
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

        // stop audio tracks
        audioStream.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
        stopWave();
      };

      // Request data every 250ms to avoid losing data if tab is backgrounded (iOS)
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

  // Image and Frame merging
  const mergePhotoAndFrame = async (
    photoCanvas: HTMLCanvasElement,
  ): Promise<HTMLCanvasElement> => {
    const out = document.createElement("canvas");
    out.width = photoCanvas.width;
    out.height = photoCanvas.height;
    const ctx = out.getContext("2d");
    if (!ctx) return photoCanvas;

    // Draw the main taken guest photo
    ctx.drawImage(photoCanvas, 0, 0);

    // Draw the selected frame on top
    try {
      const frame = frames[selectedFrameIndex];
      if (frame) {
        if (frame.svg_code) {
          const svgCode = frame.svg_code
            .replace(/\{\{COUPLE_NAME\}\}/g, coupleName)
            .replace(/\{\{COUPLE_NAME_UPPER\}\}/g, coupleName.toUpperCase());
          const svgBlob = new Blob([svgCode], { type: "image/svg+xml" });
          const svgUrl = URL.createObjectURL(svgBlob);
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, out.width, out.height);
              resolve();
            };
            img.onerror = reject;
            img.src = svgUrl;
          });
          URL.revokeObjectURL(svgUrl);
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
      }
    } catch (e) {
      console.warn(
        "Merging frame overlay failed, uploading original photo:",
        e,
      );
    }
    return out;
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
      setUploadLabel("Memproses foto...");

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas element not found");

      const finalCanvas = await mergePhotoAndFrame(canvas);
      const photoBlob = await new Promise<Blob | null>((resolve) =>
        finalCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9),
      );
      if (!photoBlob) throw new Error("Gagal mengolah file foto");

      setUploadProgress(45);
      setUploadLabel("Mengunggah foto...");

      const ts = Date.now();
      const safeName = guestName.replace(/[^a-zA-Z0-9]/g, "_");
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

        // Determine file extension and content type from recorded MIME
        // iOS records as audio/mp4 (.m4a), desktop Chrome records as audio/webm
        const getAudioExtension = (mime: string): string => {
          if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
          if (mime.includes("webm")) return "webm";
          if (mime.includes("ogg")) return "ogg";
          return "m4a"; // safe default for iOS
        };
        const getAudioContentType = (mime: string): string => {
          if (mime.includes("mp4") || mime.includes("aac")) return "audio/mp4";
          if (mime.includes("webm")) return "audio/webm";
          if (mime.includes("ogg")) return "audio/ogg";
          return "audio/mp4";
        };
        const ext = getAudioExtension(audioMimeType);
        const contentType = getAudioContentType(audioMimeType);

        const voicePath = `${eventId}/${ts}_${safeName}.${ext}`;
        const { error: voiceErr } = await db.storage
          .from("voices")
          .upload(voicePath, audioBlob, {
            contentType,
            upsert: false,
          });

        if (!voiceErr) {
          const {
            data: { publicUrl },
          } = db.storage.from("voices").getPublicUrl(voicePath);
          voiceUrl = publicUrl;
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

  const getFrameHtml = (frame: Frame) => {
    if (!frame) return "";
    if (frame.svg_code) {
      return frame.svg_code
        .replace(/\{\{COUPLE_NAME\}\}/g, coupleName)
        .replace(/\{\{COUPLE_NAME_UPPER\}\}/g, coupleName.toUpperCase());
    } else if (frame.png_url) {
      return `<img src="${frame.png_url}" class="frame-png-overlay" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;">`;
    }
    return "";
  };

  // Rendering screens
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
        {/* Hero Section — matches admin live mockup */}
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
            <span className="guest-hero-event">WEDDING EVENT</span>
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
            Abadikan momen spesial bersama &amp; kirim ucapan hangat untuk
            pasangan
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

      {/* Frame Picker Screen */}
      <div
        className={`screen ${screen === "frame" ? "active" : ""}`}
        id="s-frame"
      >
        <div className="card">
          <div className="title">Pilih Bingkai</div>
          <p className="subtitle">Pilih bingkai polaroid favoritmu</p>
          <div className="steps">
            <div className="step-dot done"></div>
            <div className="step-dot active"></div>
            <div className="step-dot"></div>
            <div className="step-dot"></div>
          </div>
          <div className="frames-grid">
            {frames.map((frame, index) => (
              <div className="frame-item" key={frame.id}>
                <div
                  className={`frame-option ${index === selectedFrameIndex ? "selected" : ""}`}
                  onClick={() => setSelectedFrameIndex(index)}
                >
                  <div className="frame-preview">
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg,#f5ede0,#faf6f0)",
                        opacity: 0.25,
                      }}
                    ></div>
                    <div
                      className="frame-svg"
                      dangerouslySetInnerHTML={{ __html: getFrameHtml(frame) }}
                    />
                  </div>
                  <div className="check">✓</div>
                </div>
                <div className="frame-label-below">{frame.name}</div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setScreen("camera")}
          >
            Buka Kamera →
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
          <p className="subtitle">Senyum ya! 😊</p>
          <div className="steps">
            <div className="step-dot done"></div>
            <div className="step-dot done"></div>
            <div className="step-dot active"></div>
            <div className="step-dot"></div>
          </div>
          <div className="camera-wrap">
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
                  autoPlay
                  playsInline
                  muted
                ></video>
                <canvas ref={canvasRef} id="canvas"></canvas>
                <div
                  className="frame-overlay"
                  dangerouslySetInnerHTML={{
                    __html: frames[selectedFrameIndex]
                      ? getFrameHtml(frames[selectedFrameIndex])
                      : "",
                  }}
                ></div>
                <div className="camera-hint">Posisikan wajah di tengah</div>
              </>
            )}
          </div>
          {!cameraError && (
            <div className="shutter-btn" onClick={takePhoto}>
              <div className="shutter-inner"></div>
            </div>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => {
              stopCamera();
              setScreen("frame");
            }}
          >
            ← Ganti Frame
          </button>
        </div>
      </div>

      {/* Preview Screen */}
      <div
        className={`screen ${screen === "preview" ? "active" : ""}`}
        id="s-preview"
      >
        <div className="card">
          <div className="title">Preview Foto</div>
          <p className="subtitle">Bagus? Lanjutkan atau ambil ulang</p>
          <div className="preview-wrap">
            <img id="preview-img" src={photoDataUrl} alt="preview" />
            <div
              className="preview-frame-overlay"
              dangerouslySetInnerHTML={{
                __html: frames[selectedFrameIndex]
                  ? getFrameHtml(frames[selectedFrameIndex])
                  : "",
              }}
            ></div>
          </div>
          <button
            className="btn btn-primary"
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
              onClick={() => {
                setPhotoDataUrl("");
                setScreen("camera");
              }}
            >
              🔄 Ambil Ulang
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

          {/* Skip button if nothing recorded/written yet */}
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
            Foto &amp; ucapanmu sedang dikirim ke pengantin
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
