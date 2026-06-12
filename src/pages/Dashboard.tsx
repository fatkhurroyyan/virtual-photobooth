import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { db } from "../supabaseClient";
import logoBk from "../assets/logo-bk.svg";
import "./Dashboard.css";

interface EventConfig {
  id: string;
  couple_name: string;
  event_date: string | null;
  event_location: string | null;
  couple_photo_url: string | null;
  theme_color: string | null;
}

interface Submission {
  id: string;
  event_id: string;
  guest_name: string;
  photo_url: string | null;
  voice_url: string | null;
  message_text: string | null;
  frame_name: string;
  frame_index: number | null;
  created_at: string;
}

const framesSvg = [
  `<svg viewBox="0 0 100 133" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="1" y="1" width="98" height="131" rx="2" fill="none" stroke="#c9a96e" stroke-width="3"/><rect x="4" y="4" width="92" height="92" fill="none" stroke="#e8d5b0" stroke-width="1" stroke-dasharray="3 2"/><rect x="1" y="110" width="98" height="22" fill="rgba(255,255,255,0.9)"/><text x="50" y="123" text-anchor="middle" font-size="6" fill="#9c7c5e" font-family="Georgia,serif" font-style="italic">Garden Rose</text></svg>`,
  `<svg viewBox="0 0 100 133" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="1" y="1" width="98" height="131" rx="1" fill="none" stroke="#c9a96e" stroke-width="3"/><path d="M1 14 L1 1 L14 1" fill="none" stroke="#b8843a" stroke-width="2"/><path d="M86 1 L99 1 L99 14" fill="none" stroke="#b8843a" stroke-width="2"/><path d="M1 119 L1 131 L14 131" fill="none" stroke="#b8843a" stroke-width="2"/><path d="M86 131 L99 131 L99 119" fill="none" stroke="#b8843a" stroke-width="2"/><rect x="1" y="110" width="98" height="22" fill="rgba(255,250,240,0.95)"/><text x="50" y="123" text-anchor="middle" font-size="6" fill="#6b4c2a" font-family="Georgia,serif">Vintage Gold</text></svg>`,
  `<svg viewBox="0 0 100 133" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="3" y="3" width="94" height="127" rx="4" fill="none" stroke="#f0c4be" stroke-width="5"/><rect x="6" y="6" width="88" height="88" rx="2" fill="none" stroke="#d4847a" stroke-width="1"/><circle cx="13" cy="10" r="4" fill="rgba(212,132,122,0.4)"/><circle cx="87" cy="10" r="4" fill="rgba(212,132,122,0.4)"/><rect x="3" y="110" width="94" height="22" fill="rgba(255,255,255,0.95)"/><text x="50" y="123" text-anchor="middle" font-size="6" fill="#d4847a" font-family="Georgia,serif">Floral White</text></svg>`,
  `<svg viewBox="0 0 100 133" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="0" y="0" width="100" height="10" fill="rgba(44,24,16,0.75)"/><rect x="0" y="123" width="100" height="10" fill="rgba(44,24,16,0.75)"/><rect x="0" y="10" width="6" height="113" fill="rgba(44,24,16,0.45)"/><rect x="94" y="10" width="6" height="113" fill="rgba(44,24,16,0.45)"/><rect x="6" y="110" width="88" height="13" fill="rgba(250,246,240,0.95)"/><text x="50" y="119" text-anchor="middle" font-size="5.5" fill="#6b4c2a" font-family="Courier,monospace" letter-spacing="2">CLASSIC FILM</text></svg>`,
];

const frameNames = [
  "Garden Rose",
  "Vintage Gold",
  "Floral White",
  "Classic Film",
];
const bgColors = ["#d4c4b0", "#c8b89a", "#ddd0bc", "#e0ceba"];

export default function Dashboard() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const activeSlug = eventSlug || "demo";

  // States
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<"all" | "voice" | "new">("all");
  const [activeSubIndex, setActiveSubIndex] = useState<number | null>(null);
  const [newGuestIds, setNewGuestIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initial Fetch & Realtime Subscriptions
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Get Event Details
        const { data: event, error: evErr } = await db
          .from("events")
          .select(
            "id, couple_name, event_date, event_location, couple_photo_url, theme_color",
          )
          .eq("slug", activeSlug)
          .single();

        if (evErr || !event) throw evErr || new Error("Event not found");

        setEventConfig(event);

        // 2. Load Submissions
        const { data: subs, error: subErr } = await db
          .from("submissions")
          .select("*")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false });

        if (!subErr && subs) {
          // Sanitize URLs: fix double-slash issues from old records
          const sanitized = subs.map((s: Submission) => ({
            ...s,
            photo_url: s.photo_url
              ? s.photo_url.replace(/([^:])\/\//g, "$1/")
              : null,
            voice_url: s.voice_url
              ? s.voice_url.replace(/([^:])\/\//g, "$1/")
              : null,
          }));
          setSubmissions(sanitized);
        }

        // 3. Realtime Listener
        const channel = db
          .channel(`dashboard-realtime-${event.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "submissions",
              filter: `event_id=eq.${event.id}`,
            },
            (payload) => {
              const raw = payload.new as Submission;
              // Sanitize URLs for realtime submissions too
              const newSub: Submission = {
                ...raw,
                photo_url: raw.photo_url
                  ? raw.photo_url.replace(/([^:])\/\//g, "$1/")
                  : null,
                voice_url: raw.voice_url
                  ? raw.voice_url.replace(/([^:])\/\//g, "$1/")
                  : null,
              };
              setNewGuestIds((prev) => {
                const next = new Set(prev);
                next.add(newSub.id);
                return next;
              });
              setSubmissions((prev) => [newSub, ...prev]);

              // Show toast notification
              setToastMessage(`📸 ${newSub.guest_name} baru kirim foto!`);
              setTimeout(() => setToastMessage(null), 4000);
            },
          )
          .subscribe();

        return () => {
          db.removeChannel(channel);
        };
      } catch (err: any) {
        console.warn("Using dashboard offline/demo mode:", err.message);
        setEventConfig({
          id: "demo-id",
          couple_name: "Ahmad & Siti",
          event_date: "2026-06-15",
          event_location: "Gedung Istana Pernikahan, Bandung",
          couple_photo_url: null,
          theme_color: "#c9a96e",
        });
        setSubmissions([]);
      }
    }

    loadData();
  }, [activeSlug]);

  // Handle modal audio playback lifecycle
  useEffect(() => {
    // If modal is closed or submission index changes, reset audio
    if (activeSubIndex === null) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioDuration(0);
      setAudioCurrentTime(0);
    } else {
      const sub = filteredSubmissions()[activeSubIndex];
      if (sub && sub.voice_url) {
        const audio = new Audio();

        // iOS Safari requires these attributes to play inline
        audio.setAttribute("playsInline", "true");
        audio.setAttribute("webkit-playsinline", "true");
        audio.preload = "metadata";
        // Avoid CORS issues with Supabase storage on Safari
        audio.crossOrigin = "anonymous";
        audio.src = sub.voice_url;

        audioRef.current = audio;

        const onTimeUpdate = () => {
          if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration || 0;
            setAudioCurrentTime(current);
            setAudioDuration(duration);
            setAudioProgress(duration > 0 ? (current / duration) * 100 : 0);
          }
        };

        const onEnded = () => {
          setIsPlaying(false);
          setAudioProgress(0);
          setAudioCurrentTime(0);
        };

        const onLoadedMetadata = () => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration || 0);
          }
        };

        const onError = (e: Event) => {
          console.warn("Audio load error:", e);
          setIsPlaying(false);
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("error", onError);

        // Explicitly call load() — required for Safari to recognise new src
        audio.load();

        return () => {
          audio.removeEventListener("timeupdate", onTimeUpdate);
          audio.removeEventListener("ended", onEnded);
          audio.removeEventListener("loadedmetadata", onLoadedMetadata);
          audio.removeEventListener("error", onError);
          audio.pause();
          audio.src = "";
        };
      }
    }
  }, [activeSubIndex]);

  // Initial Emoji Generator
  const getInitialEmoji = (name: string) => {
    const emojis = [
      "👩",
      "👨",
      "👩‍🦱",
      "👨‍💼",
      "👩‍🦰",
      "🧔",
      "👩‍🎓",
      "👴",
      "👩‍⚕️",
      "👱‍♂️",
      "👧",
      "🧑",
    ];
    const idx = (name.charCodeAt(0) || 0) % emojis.length;
    return emojis[idx];
  };

  const isNewSubmission = (sub: Submission) => {
    if (newGuestIds.has(sub.id)) return true;
    const createdAt = new Date(sub.created_at).getTime();
    return Date.now() - createdAt < 30 * 60 * 1000; // < 30 min
  };

  const filteredSubmissions = () => {
    let list = submissions;
    if (filter === "voice") {
      list = submissions.filter((s) => s.voice_url);
    } else if (filter === "new") {
      list = submissions.filter((s) => isNewSubmission(s));
    }
    return list;
  };

  const handleImageError = useCallback((subId: string) => {
    setFailedImageIds((prev) => {
      const next = new Set(prev);
      next.add(subId);
      return next;
    });
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // play() returns a Promise on modern browsers; handle rejection (autoplay policy, format errors)
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio play failed:", err);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioDuration;
  };

  // Stats Counters
  const totalTamu = submissions.length;
  const totalVoice = submissions.filter((s) => s.voice_url).length;
  const totalNew = submissions.filter((s) => isNewSubmission(s)).length;

  const eventDateStr = eventConfig?.event_date
    ? new Date(eventConfig.event_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const heroDetails = [eventDateStr, eventConfig?.event_location]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="dashboard-body">
      {toastMessage && <div className="toast-notification">{toastMessage}</div>}

      <div className="dash">
        {/* Hero Section */}
        <div className="hero">
          {eventConfig?.couple_photo_url ? (
            <img
              className="hero-photo"
              src={eventConfig.couple_photo_url}
              alt="Foto Pengantin"
            />
          ) : (
            <svg
              className="hero-photo"
              viewBox="0 0 680 220"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="680" height="220" fill="#4a2f18" />
              <ellipse
                cx="200"
                cy="110"
                rx="160"
                ry="130"
                fill="#6b4030"
                opacity=".6"
              />
              <ellipse
                cx="480"
                cy="80"
                rx="120"
                ry="100"
                fill="#8b5a35"
                opacity=".4"
              />
              <circle cx="340" cy="110" r="80" fill="#7a4828" opacity=".3" />
            </svg>
          )}
          <div className="hero-overlay">
            <div className="hero-event">Pernikahan Bahagia</div>
            <div className="hero-couple">
              {eventConfig?.couple_name || "Memuat..."}
            </div>
            <div className="hero-date">{heroDetails || "—"}</div>
          </div>
          <div className="hero-badge">
            <div className="live-dot"></div>
            Live
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-num">{totalTamu}</div>
            <div className="stat-lbl">Total Tamu</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{totalVoice}</div>
            <div className="stat-lbl">Voice Note</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{totalNew}</div>
            <div className="stat-lbl">Baru Masuk</div>
          </div>
        </div>

        {/* Gallery Section Head */}
        <div className="section-head">
          <div className="section-title">Kenangan Tamu</div>
          <div className="filter-row">
            <div
              className={`pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Semua
            </div>
            <div
              className={`pill ${filter === "voice" ? "active" : ""}`}
              onClick={() => setFilter("voice")}
            >
              Ada Suara
            </div>
            <div
              className={`pill ${filter === "new" ? "active" : ""}`}
              onClick={() => setFilter("new")}
            >
              Terbaru
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="gallery">
          {filteredSubmissions().map((sub, i) => {
            const frameIdx = Math.min(
              sub.frame_index ?? 0,
              framesSvg.length - 1,
            );
            const timeStr = new Date(sub.created_at).toLocaleTimeString(
              "id-ID",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            );

            return (
              <div
                className="photo-card"
                key={sub.id}
                onClick={() => setActiveSubIndex(i)}
              >
                <div className="photo-inner">
                  <div
                    className="photo-area"
                    style={{ background: bgColors[frameIdx] }}
                  >
                    {sub.photo_url && !failedImageIds.has(sub.id) ? (
                      <img
                        src={sub.photo_url}
                        alt={sub.guest_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        onError={() => handleImageError(sub.id)}
                      />
                    ) : (
                      <div className="photo-sim">
                        <span style={{ fontSize: "32px" }}>
                          {getInitialEmoji(sub.guest_name)}
                        </span>
                      </div>
                    )}
                    {/* Render local frame overlay if no photo url, otherwise merged on storage */}
                    {(!sub.photo_url || failedImageIds.has(sub.id)) && (
                      <div
                        className="frame-overlay-sim"
                        dangerouslySetInnerHTML={{
                          __html: framesSvg[frameIdx],
                        }}
                      ></div>
                    )}
                    {sub.voice_url && (
                      <div className="voice-badge">
                        <i
                          className="ti ti-microphone"
                          aria-hidden="true"
                          style={{ fontSize: "10px" }}
                        ></i>
                      </div>
                    )}
                    {sub.message_text && (
                      <div
                        className="voice-badge"
                        style={{ top: sub.voice_url ? "26px" : "6px" }}
                      >
                        <i
                          className="ti ti-message"
                          aria-hidden="true"
                          style={{ fontSize: "10px" }}
                        ></i>
                      </div>
                    )}
                    {isNewSubmission(sub) && (
                      <div className="new-badge">Baru</div>
                    )}
                  </div>
                  <div className="photo-strip">
                    <div className="photo-guest">{sub.guest_name}</div>
                    <div className="photo-time">{timeStr}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSubmissions().length === 0 && (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "40px",
                color: "#9c7c5e",
                fontSize: "14px",
              }}
            >
              {filter === "all"
                ? "📸 Belum ada kiriman tamu."
                : "Tidak ada kiriman yang cocok."}
            </div>
          )}
        </div>

        <button className="load-more">
          Lihat semua foto tamu
          <i className="ti ti-chevron-down" aria-hidden="true"></i>
        </button>
      </div>

      {/* Modal View details */}
      {activeSubIndex !== null &&
        filteredSubmissions()[activeSubIndex] &&
        (() => {
          const sub = filteredSubmissions()[activeSubIndex];
          const frameIdx = Math.min(sub.frame_index ?? 0, framesSvg.length - 1);
          const timeStr = new Date(sub.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // Time calculations for voice note
          const remainingSeconds = Math.ceil(audioDuration - audioCurrentTime);
          const remM = Math.floor(remainingSeconds / 60);
          const remS = remainingSeconds % 60;
          const timeDisplay =
            isNaN(remainingSeconds) || remainingSeconds <= 0
              ? "--:--"
              : `${remM}:${remS.toString().padStart(2, "0")}`;

          return (
            <div
              className="modal-bg open"
              onClick={(e) =>
                e.target === e.currentTarget && setActiveSubIndex(null)
              }
            >
              <div className="modal">
                <div style={{ position: "relative" }}>
                  <div
                    className="modal-photo"
                    style={{ background: bgColors[frameIdx] }}
                  >
                    {sub.photo_url && !failedImageIds.has(sub.id) ? (
                      <>
                        <img
                          src={sub.photo_url}
                          alt={sub.guest_name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                          onError={() => handleImageError(sub.id)}
                        />
                        <div className="modal-frame-ov"></div>
                      </>
                    ) : (
                      <>
                        <span>{getInitialEmoji(sub.guest_name)}</span>
                        <div
                          className="modal-frame-ov"
                          dangerouslySetInnerHTML={{
                            __html: framesSvg[frameIdx],
                          }}
                        ></div>
                      </>
                    )}
                  </div>
                  <button
                    className="modal-close"
                    onClick={() => setActiveSubIndex(null)}
                  >
                    <i className="ti ti-x" aria-hidden="true"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="modal-guest">{sub.guest_name}</div>
                  <div className="modal-time">
                    Dikirim pukul {timeStr} · Bingkai {frameNames[frameIdx]}
                  </div>
                  <div id="modal-voice-wrap">
                    {sub.voice_url ? (
                      <div className="voice-player">
                        <div className="vp-label">
                          <i
                            className="ti ti-microphone"
                            aria-hidden="true"
                          ></i>
                          &ensp;Ucapan dari {sub.guest_name.split(" ")[0]}
                        </div>
                        <div className="vp-row">
                          <button
                            className="play-btn"
                            onClick={togglePlay}
                            aria-label="Play voice note"
                          >
                            <i
                              className={
                                isPlaying
                                  ? "ti ti-player-pause"
                                  : "ti ti-player-play"
                              }
                              aria-hidden="true"
                            ></i>
                          </button>
                          <div className="progress-wrap" onClick={handleSeek}>
                            <div
                              className="progress-fill"
                              style={{ width: `${audioProgress}%` }}
                            ></div>
                          </div>
                          <div className="vp-time">{timeDisplay}</div>
                        </div>
                      </div>
                    ) : !sub.message_text ? (
                      <div className="no-voice">
                        Tamu ini tidak merekam ucapan
                      </div>
                    ) : null}
                    {sub.message_text && (
                      <div className="chat-message-display">
                        <div className="vp-label">
                          <i className="ti ti-message" aria-hidden="true"></i>
                          &ensp;Pesan dari {sub.guest_name.split(" ")[0]}
                        </div>
                        <div className="chat-message-text">
                          {sub.message_text}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
