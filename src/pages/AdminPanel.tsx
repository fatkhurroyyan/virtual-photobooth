import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "../supabaseClient";
import "./AdminPanel.css";

interface EventItem {
  id: string;
  slug: string;
  couple_name: string;
  event_date: string | null;
  event_location: string | null;
  theme_color: string | null;
  couple_photo_url: string | null;
  allow_voice: boolean;
  require_name: boolean;
  allow_retake: boolean;
  is_active: boolean;
  created_at: string;
}

interface Frame {
  id: string;
  name: string;
  svg_code: string | null;
  png_url: string | null;
  is_active: boolean;
  sort_order: number;
}

type TabId = "event" | "appearance" | "frames" | "qr" | "settings";

const THEME_PRESETS = {
  classic: { font: "Playfair Display", hex: "#c9a96e" },
  romantic: { font: "Great Vibes", hex: "#d4847a" },
  modern: { font: "Outfit", hex: "#2563eb" },
  elegant: { font: "Cormorant Garamond", hex: "#1e3a8a" },
  rustic: { font: "Libre Baskerville", hex: "#6b4c2a" },
};

const defaultColorSwatches = ["#c9a96e", "#d4847a", "#2563eb", "#1e3a8a", "#6b4c2a", "#10b981", "#ef4444", "#3d2b14"];

const defaultFramesData = [
  {
    name: "Garden Rose",
    svg_code: `<svg viewBox="0 0 100 133" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="1" y="1" width="98" height="131" rx="2" fill="none" stroke="#c9a96e" stroke-width="3"/><rect x="4" y="4" width="92" height="92" fill="none" stroke="#e8d5b0" stroke-width="1" stroke-dasharray="3 2"/><rect x="1" y="110" width="98" height="22" fill="rgba(255,255,255,0.9)"/><text x="50" y="123" text-anchor="middle" font-size="6" fill="#9c7c5e" font-family="Georgia,serif" font-style="italic">Garden Rose</text></svg>`,
    png_url: null,
  },
  {
    name: "Vintage Gold",
    svg_code: `<svg viewBox="0 0 100 133" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="1" y="1" width="98" height="131" rx="1" fill="none" stroke="#c9a96e" stroke-width="3"/><path d="M1 14 L1 1 L14 1" fill="none" stroke="#b8843a" stroke-width="2"/><path d="M86 1 L99 1 L99 14" fill="none" stroke="#b8843a" stroke-width="2"/><path d="M1 119 L1 131 L14 131" fill="none" stroke="#b8843a" stroke-width="2"/><path d="M86 131 L99 131 L99 119" fill="none" stroke="#b8843a" stroke-width="2"/><rect x="1" y="110" width="98" height="22" fill="rgba(255,250,240,0.95)"/><text x="50" y="123" text-anchor="middle" font-size="6" fill="#6b4c2a" font-family="Georgia,serif">Vintage Gold</text></svg>`,
    png_url: null,
  },
  {
    name: "Floral White",
    svg_code: `<svg viewBox="0 0 100 133" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="3" y="3" width="94" height="127" rx="4" fill="none" stroke="#f0c4be" stroke-width="5"/><rect x="6" y="6" width="88" height="88" rx="2" fill="none" stroke="#d4847a" stroke-width="1"/><circle cx="13" cy="10" r="4" fill="rgba(212,132,122,0.4)"/><circle cx="87" cy="10" r="4" fill="rgba(212,132,122,0.4)"/><rect x="3" y="110" width="94" height="22" fill="rgba(255,255,255,0.95)"/><text x="50" y="123" text-anchor="middle" font-size="6" fill="#d4847a" font-family="Georgia,serif">Floral White</text></svg>`,
    png_url: null,
  },
  {
    name: "Classic Film",
    svg_code: `<svg viewBox="0 0 100 133" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="0" y="0" width="100" height="10" fill="rgba(44,24,16,0.75)"/><rect x="0" y="123" width="100" height="10" fill="rgba(44,24,16,0.75)"/><rect x="0" y="10" width="6" height="113" fill="rgba(44,24,16,0.45)"/><rect x="94" y="10" width="6" height="113" fill="rgba(44,24,16,0.45)"/><rect x="6" y="110" width="88" height="13" fill="rgba(250,246,240,0.95)"/><text x="50" y="119" text-anchor="middle" font-size="5.5" fill="#6b4c2a" font-family="Courier,monospace" letter-spacing="2">CLASSIC FILM</text></svg>`,
    png_url: null,
  }
];

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSlug = searchParams.get("event") || "demo";

  // System Layout States
  const [activeTab, setActiveTab] = useState<TabId>("event");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Events & Submissions stats states
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [guestCounts, setGuestCounts] = useState<{ [eventId: string]: number }>({});
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [voiceSubmissionsCount, setVoiceSubmissionsCount] = useState<number>(0);

  // Form Edit Details States
  const [editHost, setEditHost] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editLoc, setEditLoc] = useState<string>("");
  const [editThemeColor, setEditThemeColor] = useState<string>("#c9a96e");
  const [editTitleFont, setEditTitleFont] = useState<string>("Playfair Display");
  const [editAllowVoice, setEditAllowVoice] = useState<boolean>(true);
  const [editRequireName, setEditRequireName] = useState<boolean>(true);
  const [editAllowRetake, setEditAllowRetake] = useState<boolean>(true);

  // Image Upload / Preview States
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  // Form Create Event States
  const [createHost, setCreateHost] = useState<string>("");
  const [createDate, setCreateDate] = useState<string>("");
  const [createLoc, setCreateLoc] = useState<string>("");

  // UI Notification & Save States
  const [toast, setToast] = useState<{ text: string; type: "success" | "info" | "danger" } | null>(null);
  const [saveBarVisible, setSaveBarVisible] = useState<boolean>(false);
  const [saveBarMessage, setSaveBarMessage] = useState<string>("Perubahan belum disimpan");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Load configuration & data
  const loadEventConfigAndData = async (slug: string) => {
    setIsLoading(true);
    try {
      // 1. Load active event details
      const { data: eventData, error } = await db
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !eventData) {
        // If event slug not found, try to redirect to first event in DB
        const { data: allEvents, error: allEventsError } = await db
          .from("events")
          .select("*")
          .order("created_at", { ascending: false });

        if (!allEventsError && allEvents && allEvents.length > 0) {
          setSearchParams({ event: allEvents[0].slug });
          return;
        }
        throw error || new Error("Event not found");
      }

      setActiveEvent(eventData);
      setIsDemoMode(false);

      // Populate edit states
      setEditHost(eventData.couple_name);
      setEditDate(eventData.event_date || "");
      setEditLoc(eventData.event_location || "");
      setEditThemeColor(eventData.theme_color || "#c9a96e");
      setEditAllowVoice(eventData.allow_voice);
      setEditRequireName(eventData.require_name);
      setEditAllowRetake(eventData.allow_retake);
      setHeroImageUrl(eventData.couple_photo_url);

      // Load frames
      await loadFrames(eventData.id);

      // Load all events list and guest statistics
      await fetchAllEventsAndStats(eventData.id);

    } catch (err: any) {
      console.warn("Using admin offline/demo mode:", err.message);
      setIsDemoMode(true);
      const demoEvent: EventItem = {
        id: "demo-id",
        slug: "demo",
        couple_name: "Rizky & Nabila",
        event_date: "2026-06-07",
        event_location: "Bandung",
        theme_color: "#c9a96e",
        couple_photo_url: null,
        allow_voice: true,
        require_name: true,
        allow_retake: true,
        is_active: true,
        created_at: new Date().toISOString()
      };
      setActiveEvent(demoEvent);
      setEditHost(demoEvent.couple_name);
      setEditDate(demoEvent.event_date || "");
      setEditLoc(demoEvent.event_location || "");
      setEditThemeColor(demoEvent.theme_color || "#c9a96e");
      setEditAllowVoice(demoEvent.allow_voice);
      setEditRequireName(demoEvent.require_name);
      setEditAllowRetake(demoEvent.allow_retake);

      // Load local frames
      const localFrames = defaultFramesData.map((f, i) => ({
        id: `local-${i}`,
        name: f.name,
        svg_code: f.svg_code,
        png_url: f.png_url,
        is_active: true,
        sort_order: i
      }));
      setFrames(localFrames);
      setEventsList([demoEvent]);
      setGuestCounts({ "demo-id": 12 });
      setTotalSubmissions(12);
      setVoiceSubmissionsCount(9);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFrames = async (eventId: string) => {
    try {
      let { data: dbFrames, error } = await db
        .from("frames")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Seed default frames if none exist in the database for this event
      if (!dbFrames || dbFrames.length === 0) {
        const seedData = defaultFramesData.map((f, index) => ({
          event_id: eventId,
          name: f.name,
          svg_code: f.svg_code,
          is_active: true,
          sort_order: index,
        }));
        const { data: inserted, error: insertError } = await db
          .from("frames")
          .insert(seedData)
          .select();
        if (insertError) throw insertError;
        dbFrames = inserted;
      }

      setFrames(dbFrames || []);
    } catch (e: any) {
      console.error("Gagal memuat frame dari database:", e.message);
      // Fallback
      const localFrames = defaultFramesData.map((f, i) => ({
        id: `local-${i}`,
        name: f.name,
        svg_code: f.svg_code,
        png_url: f.png_url,
        is_active: true,
        sort_order: i
      }));
      setFrames(localFrames);
    }
  };

  const fetchAllEventsAndStats = async (activeEventId: string) => {
    try {
      // Load all events list
      const { data: list, error: err } = await db
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      setEventsList(list || []);

      // Load counts
      const { data: subs, error: subsErr } = await db
        .from("submissions")
        .select("id, event_id, voice_url");

      if (!subsErr && subs) {
        const counts: { [eventId: string]: number } = {};
        subs.forEach((s) => {
          counts[s.event_id] = (counts[s.event_id] || 0) + 1;
        });
        setGuestCounts(counts);

        // Stats counts specifically for active event
        const activeSubs = subs.filter((s) => s.event_id === activeEventId);
        setTotalSubmissions(activeSubs.length);
        setVoiceSubmissionsCount(activeSubs.filter((s) => s.voice_url).length);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  useEffect(() => {
    loadEventConfigAndData(activeSlug);
  }, [activeSlug]);

  const showToast = (text: string, type: "success" | "info" | "danger") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2800);
  };

  const markUnsaved = (msg = "Perubahan belum disimpan") => {
    setSaveBarMessage(msg);
    setSaveBarVisible(true);
  };

  const toggleFrameState = (index: number) => {
    setFrames((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], is_active: !next[index].is_active };
      }
      return next;
    });
    markUnsaved("Frame aktif diperbarui — belum disimpan");
  };

  const deleteFrame = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus bingkai "${name}"?`)) return;

    if (id.toString().startsWith("local-")) {
      setFrames((prev) => prev.filter((f) => f.id !== id));
      showToast("Frame dihapus (Mode Demo)", "info");
      return;
    }

    try {
      const { error } = await db.from("frames").delete().eq("id", id);
      if (error) throw error;
      showToast(`Bingkai "${name}" berhasil dihapus!`, "success");
      if (activeEvent) loadFrames(activeEvent.id);
    } catch (err: any) {
      showToast("Gagal menghapus frame: " + err.message, "danger");
    }
  };

  const handleAddFrameFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast("Mengunggah frame kustom...", "info");

    if (isDemoMode || !activeEvent) {
      const url = URL.createObjectURL(file);
      const newFrame = {
        id: `local-${Date.now()}`,
        name: file.name.split(".")[0] || "Custom Frame",
        svg_code: null,
        png_url: url,
        is_active: true,
        sort_order: frames.length,
      };
      setFrames((prev) => [...prev, newFrame]);
      showToast("Frame ditambahkan (Mode Demo)", "success");
      return;
    }

    try {
      const ts = Date.now();
      const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const path = `frames/${activeEvent.id}/${ts}_${cleanName}`;

      const { error: uploadError } = await db.storage
        .from("photos")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = db.storage.from("photos").getPublicUrl(path);

      const { error: insertError } = await db
        .from("frames")
        .insert({
          event_id: activeEvent.id,
          name: file.name.split(".")[0] || "Custom Frame",
          png_url: publicUrl,
          is_active: true,
          sort_order: frames.length,
        });

      if (insertError) throw insertError;

      showToast("Bingkai kustom berhasil diunggah!", "success");
      loadFrames(activeEvent.id);
    } catch (err: any) {
      console.error(err);
      showToast("Gagal mengunggah frame: " + err.message, "danger");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroImageFile(file);
    const url = URL.createObjectURL(file);
    setHeroImageUrl(url);
    markUnsaved("Latar belakang pengantin diubah — belum disimpan");
    showToast("Latar belakang dipilih!", "success");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} disalin ke clipboard!`, "success");
    }).catch((err) => {
      showToast("Gagal menyalin link: " + err, "danger");
    });
  };

  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/&/g, "-dan-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  const handleCreateNewEvent = async () => {
    if (!createHost.trim()) {
      alert("Nama Pengantin / Host wajib diisi! 😊");
      return;
    }

    showToast("Membuat event baru...", "info");

    try {
      let baseSlug = generateSlug(createHost);
      if (!baseSlug) baseSlug = "wedding";
      let slug = baseSlug;

      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const { data, error } = await db
          .from("events")
          .select("id")
          .eq("slug", slug);

        if (error) throw error;

        if (!data || data.length === 0) {
          isUnique = true;
        } else {
          attempts++;
          slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
        }
      }

      const { error: insertError } = await db
        .from("events")
        .insert({
          slug: slug,
          couple_name: createHost,
          event_date: createDate || null,
          event_location: createLoc || null,
          theme_color: "#c9a96e",
          is_active: true
        });

      if (insertError) throw insertError;

      showToast("Event baru berhasil dibuat!", "success");

      setTimeout(() => {
        setSearchParams({ event: slug });
        setCreateHost("");
        setCreateDate("");
        setCreateLoc("");
        setActiveTab("event");
      }, 1000);

    } catch (err: any) {
      console.error(err);
      showToast("Gagal membuat event: " + err.message, "danger");
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (activeEvent && id === activeEvent.id) {
      alert("Event ini sedang aktif dikelola. Silakan beralih kelola ke event lain terlebih dahulu sebelum menghapusnya!");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus event "${name}"? Semua data frames, submissions, dan ucapan terkait juga akan terhapus secara permanen!`)) return;

    try {
      showToast("Menghapus event...", "info");
      const { error } = await db.from("events").delete().eq("id", id);
      if (error) throw error;

      showToast(`Event "${name}" berhasil dihapus!`, "success");
      if (activeEvent) fetchAllEventsAndStats(activeEvent.id);
    } catch (err: any) {
      showToast("Gagal menghapus event: " + err.message, "danger");
    }
  };

  const saveAllSettings = async () => {
    if (isDemoMode || !activeEvent) {
      showToast("Perubahan disimpan (Mode Demo)", "success");
      setSaveBarVisible(false);
      return;
    }

    showToast("Menyimpan perubahan...", "info");

    let uploadedUrl = null;
    if (heroImageFile) {
      try {
        showToast("Mengunggah foto pengantin...", "info");
        const ts = Date.now();
        const cleanName = heroImageFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const path = `backgrounds/${activeEvent.id}/${ts}_${cleanName}`;

        const { error: uploadError } = await db.storage
          .from("couple-photos")
          .upload(path, heroImageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = db.storage
          .from("couple-photos")
          .getPublicUrl(path);

        uploadedUrl = urlData.publicUrl;
        setHeroImageFile(null);
      } catch (storageErr: any) {
        console.error("Gagal mengunggah foto pengantin:", storageErr);
        showToast("Gagal mengunggah foto pengantin: " + storageErr.message, "danger");
        return;
      }
    }

    try {
      const updateData: any = {
        couple_name: editHost,
        event_date: editDate || null,
        event_location: editLoc || null,
        theme_color: editThemeColor,
        allow_voice: editAllowVoice,
        require_name: editRequireName,
        allow_retake: editAllowRetake,
      };

      if (uploadedUrl) {
        updateData.couple_photo_url = uploadedUrl;
      }

      // Update event details
      const { error: eventError } = await db
        .from("events")
        .update(updateData)
        .eq("id", activeEvent.id);

      if (eventError) throw eventError;

      // Update active frames status
      for (let frame of frames) {
        if (frame.id.toString().startsWith("local-")) continue;
        const { error: frameError } = await db
          .from("frames")
          .update({ is_active: frame.is_active })
          .eq("id", frame.id);
        if (frameError) throw frameError;
      }

      showToast("Pengaturan berhasil disimpan ke database!", "success");
      setSaveBarVisible(false);

      // Reload config & events list
      loadEventConfigAndData(activeEvent.slug);
    } catch (e: any) {
      console.error("Gagal menyimpan:", e);
      showToast("Gagal menyimpan: " + e.message, "danger");
    }
  };

  const getFrameHtml = (frame: Frame) => {
    if (!frame) return "";
    if (frame.svg_code) {
      return frame.svg_code.replace(/\{\{COUPLE_NAME\}\}/g, editHost);
    } else if (frame.png_url) {
      return `<img src="${frame.png_url}" class="frame-png-overlay" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;">`;
    }
    return "";
  };

  const handlePresetSelect = (key: keyof typeof THEME_PRESETS) => {
    const preset = THEME_PRESETS[key];
    setEditTitleFont(preset.font);
    setEditThemeColor(preset.hex);
    markUnsaved("Tema preset dipilih — belum disimpan");
  };

  const currentDomain = window.location.origin;
  const guestLink = activeEvent ? `${currentDomain}/${activeEvent.slug}` : "";
  const dashLink = activeEvent ? `${currentDomain}/dashboard/${activeEvent.slug}` : "";
  const qrImageSrc = activeEvent
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(guestLink)}&margin=10`
    : "";
  const qrDownloadSrc = activeEvent
    ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(guestLink)}&margin=10`
    : "";

  const activeEventDateDisplay = activeEvent?.event_date
    ? new Date(activeEvent.event_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "";

  const activeEventMeta = [activeEventDateDisplay, activeEvent?.event_location].filter(Boolean).join(" · ");

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <div>
          <div style={{ fontSize: "24px", color: "#6b4c2a", fontStyle: "italic", textAlign: "center" }}>Memuat Admin Panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout-body">
      {toast && (
        <div className={`toast-notification show ${toast.type}`}>
          <i className="ti" />
          <span id="toast-text">{toast.text}</span>
        </div>
      )}

      {/* Save Floating Bar */}
      <div className={`save-bar ${saveBarVisible ? "visible" : ""}`} id="save-bar">
        <div className="save-msg">
          <i className="ti ti-alert-circle" />
          <span id="save-msg-text">{saveBarMessage}</span>
        </div>
        <div className="save-actions">
          <span className="saved-toast" id="saved-ok">
            <i className="ti ti-circle-check" /> Tersimpan!
          </span>
          <button className="btn btn-secondary" onClick={() => {
            if (activeEvent) loadEventConfigAndData(activeEvent.slug);
            setSaveBarVisible(false);
          }}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={saveAllSettings}>
            Simpan Perubahan
          </button>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && <div className="sidebar-overlay open" onClick={() => setIsSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`} id="sidebar">
          <div className="sidebar-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="logo-container">
                <i className="ti ti-photo" />
              </div>
              <div className="logo-text">
                <span className="logo-title">Bingkis Kaca</span>
                <span className="logo-subtitle">PHOTOBOOTH APP</span>
              </div>
            </div>
          </div>

          <div className="current-event-panel">
            <div className="current-event-title">
              <span>Event Aktif</span>
              <span className="pulse-dot" />
            </div>
            <div className="current-event-name" id="sidebar-event-name">
              {activeEvent?.couple_name || "—"}
            </div>
            <div className="current-event-meta" id="sidebar-event-meta">
              {activeEventMeta || "Belum diatur"}
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className={`nav-item ${activeTab === "event" ? "active" : ""}`} onClick={() => { setActiveTab("event"); setIsSidebarOpen(false); }}>
              <i className="ti ti-calendar" /> Kelola Event
            </button>
            <button className={`nav-item ${activeTab === "appearance" ? "active" : ""}`} onClick={() => { setActiveTab("appearance"); setIsSidebarOpen(false); }}>
              <i className="ti ti-palette" /> Tampilan Aplikasi
            </button>
            <button className={`nav-item ${activeTab === "frames" ? "active" : ""}`} onClick={() => { setActiveTab("frames"); setIsSidebarOpen(false); }}>
              <i className="ti ti-photo-frame" /> Desain Bingkai Frame
            </button>
            <button className={`nav-item ${activeTab === "qr" ? "active" : ""}`} onClick={() => { setActiveTab("qr"); setIsSidebarOpen(false); }}>
              <i className="ti ti-qrcode" /> Link &amp; QR Code
            </button>
            <button className={`nav-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => { setActiveTab("settings"); setIsSidebarOpen(false); }}>
              <i className="ti ti-settings" /> Setelan Fitur
            </button>
          </nav>

          <div className="sidebar-footer">
            <span>Admin Panel v2.1 • React SPA</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Mobile header */}
          <header className="mobile-header">
            <div className="mobile-logo">
              <i className="ti ti-photo" />
              <span>Bingkis Kaca Admin</span>
            </div>
            <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <i className="ti ti-menu-2" />
            </button>
          </header>

          {/* Desktop Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              <span className="page-title" id="page-title">
                {activeTab === "event" && "Kelola Event"}
                {activeTab === "appearance" && "Tampilan Aplikasi"}
                {activeTab === "frames" && "Desain Bingkai Frame"}
                {activeTab === "qr" && "Link & QR Code Event"}
                {activeTab === "settings" && "Setelan Fitur"}
              </span>
              <span className="page-subtitle" id="page-subtitle">
                {activeTab === "event" && "Kelola daftar event, buat event baru, dan lihat statistik realtime."}
                {activeTab === "appearance" && "Desain antarmuka halaman tamu, banner hero, warna, dan font tema."}
                {activeTab === "frames" && "Kelola koleksi bingkai polaroid (PNG) dan aktifkan pilihan bingkai untuk tamu."}
                {activeTab === "qr" && "Unduh QR Code masuk pintu acara dan konfigurasikan slug URL unik."}
                {activeTab === "settings" && "Aktifkan modul perekam suara, wajib nama, retake, dan moderasi sensor."}
              </span>
            </div>
            <div className="topbar-right">
              <div className="badge-live">
                <span className="pulse-dot" /> Live
              </div>
            </div>
          </header>

          {/* Workspace grid layout */}
          <main className="workspace">
            <div className="workspace-main">

              {/* TAB 1: EVENT */}
              <div className={`pane ${activeTab === "event" ? "active" : ""}`} id="pane-event">
                <div className="stats-container">
                  <div className="stat-card">
                    <div className="stat-icon-wrap"><i className="ti ti-users" /></div>
                    <div className="stat-data">
                      <span className="stat-num" id="stat-total-tamu">{totalSubmissions}</span>
                      <span className="stat-lbl">Tamu Kirim Foto</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrap"><i className="ti ti-microphone" /></div>
                    <div className="stat-data">
                      <span className="stat-num" id="stat-total-voice">{voiceSubmissionsCount}</span>
                      <span className="stat-lbl">Voice Note Ucapan</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrap"><i className="ti ti-files" /></div>
                    <div className="stat-data">
                      <span className="stat-num" id="stat-total-events">{eventsList.length}</span>
                      <span className="stat-lbl">Total Event</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrap"><i className="ti ti-world" /></div>
                    <div className="stat-data">
                      <span className="stat-num" style={{ fontSize: "14px", fontWeight: "bold" }}>
                        {activeEvent?.slug || "demo"}
                      </span>
                      <span className="stat-lbl">Slug Aktif</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><i className="ti ti-list" /></div>
                    <span className="card-title">Daftar Event</span>
                  </div>
                  <p className="card-sub">Pilih event yang ingin Anda kelola atau buat baru</p>
                  <div className="card-content">
                    <div className="event-list-container" id="event-list-container">
                      {eventsList.map((event) => {
                        const isCurrent = activeEvent && event.id === activeEvent.id;
                        const guestCount = guestCounts[event.id] || 0;
                        const eventDateStr = event.event_date
                          ? new Date(event.event_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })
                          : "Tanggal belum diatur";

                        return (
                          <div className="event-row" key={event.id} style={{ borderColor: isCurrent ? "var(--gold)" : "", background: isCurrent ? "var(--bg-secondary)" : "" }}>
                            <div className={`event-status-indicator ${event.is_active ? "" : "draft"}`} />
                            <div className="event-info">
                              <div className="event-name">
                                {event.couple_name}
                                {isCurrent && (
                                  <span style={{ fontSize: "10px", padding: "2px 6px", background: "var(--gold-dark)", color: "#fff", borderRadius: "12px", marginLeft: "6px", fontWeight: 500 }}>
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <div className="event-meta">
                                <span><i className="ti ti-link" /> /{event.slug}</span>
                                <span><i className="ti ti-calendar" /> {eventDateStr}</span>
                                <span><i className="ti ti-users" /> {guestCount} tamu</span>
                                <span><i className="ti ti-map-pin" /> {event.event_location || "Lokasi belum diatur"}</span>
                              </div>
                            </div>
                            <div className="event-actions">
                              <button className="btn btn-secondary" onClick={() => copyToClipboard(`${currentDomain}/${event.slug}`, "Link Halaman Tamu")} title="Salin Link Tamu" style={{ padding: "6px", minWidth: "32px" }}>
                                <i className="ti ti-link" />
                              </button>
                              <button className="btn btn-secondary" onClick={() => copyToClipboard(`${currentDomain}/dashboard/${event.slug}`, "Link Dashboard Realtime")} title="Salin Link Dashboard" style={{ padding: "6px", minWidth: "32px" }}>
                                <i className="ti ti-device-laptop" />
                              </button>
                              <button
                                className="btn"
                                style={{ padding: "6px 12px", fontSize: "13px", background: isCurrent ? "var(--gold-dark)" : "", color: isCurrent ? "#fff" : "", borderColor: isCurrent ? "var(--gold-dark)" : "" }}
                                onClick={() => setSearchParams({ event: event.slug })}
                              >
                                <i className="ti ti-settings" /> Kelola
                              </button>
                              <button className="btn btn-danger" style={{ padding: "6px", minWidth: "32px", background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }} onClick={() => handleDeleteEvent(event.id, event.couple_name)} title="Hapus Event">
                                <i className="ti ti-trash" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><i className="ti ti-circle-plus" /></div>
                    <span className="card-title">Buat Event Baru</span>
                  </div>
                  <p className="card-sub">Inisialisasi slot photobooth baru untuk pengantin</p>
                  <div className="card-content">
                    <div className="grid-2">
                      <div className="field">
                        <label>Nama Pengantin / Host</label>
                        <input type="text" value={createHost} onChange={(e) => setCreateHost(e.target.value)} placeholder="Contoh: Rizky &amp; Nabila" />
                      </div>
                      <div className="field">
                        <label>Tanggal Acara</label>
                        <input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="field">
                      <label>Lokasi Gedung / Acara</label>
                      <input type="text" value={createLoc} onChange={(e) => setCreateLoc(e.target.value)} placeholder="Contoh: Gedung Sasana Budaya, Bandung" />
                    </div>
                    <button className="btn btn-primary" onClick={handleCreateNewEvent}>
                      <i className="ti ti-circle-plus" /> Buat Event Sekarang
                    </button>
                  </div>
                </div>
              </div>

              {/* TAB 2: APPEARANCE */}
              <div className={`pane ${activeTab === "appearance" ? "active" : ""}`} id="pane-appearance">
                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><i className="ti ti-edit" /></div>
                    <span className="card-title">Informasi Dasar Event</span>
                  </div>
                  <p className="card-sub">Ganti tulisan identitas utama pengantin</p>
                  <div className="card-content">
                    <div className="field">
                      <label>Nama Pasangan Pengantin</label>
                      <input type="text" value={editHost} onChange={(e) => { setEditHost(e.target.value); markUnsaved(); }} placeholder="Contoh: Rizky &amp; Nabila" />
                    </div>
                    <div className="grid-2">
                      <div className="field">
                        <label>Tanggal Pernikahan</label>
                        <input type="date" value={editDate} onChange={(e) => { setEditDate(e.target.value); markUnsaved(); }} />
                      </div>
                      <div className="field">
                        <label>Lokasi / Keterangan</label>
                        <input type="text" value={editLoc} onChange={(e) => { setEditLoc(e.target.value); markUnsaved(); }} placeholder="Contoh: Bandung" />
                      </div>
                    </div>
                    <div className="field">
                      <label>Link Event</label>
                      <div style={{ fontSize: "13px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <strong>Link Tamu:</strong> <a href={guestLink} target="_blank" rel="noreferrer" style={{ color: "var(--gold-dark)", textDecoration: "underline" }}>{guestLink}</a><br />
                        <strong style={{ display: "inline-block", marginTop: "4px" }}>Link Dashboard:</strong> <a href={dashLink} target="_blank" rel="noreferrer" style={{ color: "var(--gold-dark)", textDecoration: "underline" }}>{dashLink}</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><i className="ti ti-palette" /></div>
                    <span className="card-title">Tema Warna &amp; Font Halaman Tamu</span>
                  </div>
                  <p className="card-sub">Pilih palet premium kustom agar sesuai dengan undangan digital pengantin</p>
                  <div className="card-content">
                    <div className="field">
                      <label>Tema Preset Cepat</label>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button className="btn" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handlePresetSelect("classic")}>Classic Gold (Traditional)</button>
                        <button className="btn" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handlePresetSelect("romantic")}>Romantic Rose (Feminine)</button>
                        <button className="btn" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handlePresetSelect("modern")}>Modern Royal Blue (Clean)</button>
                        <button className="btn" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handlePresetSelect("elegant")}>Elegant Sapphire (Premium)</button>
                        <button className="btn" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handlePresetSelect("rustic")}>Rustic Bronze (Warm)</button>
                      </div>
                    </div>

                    <div className="field">
                      <label>Pilih Warna Utama</label>
                      <div className="color-swatch-container">
                        {defaultColorSwatches.map((swatchColor) => (
                          <div
                            key={swatchColor}
                            className={`color-swatch ${editThemeColor === swatchColor ? "selected" : ""}`}
                            style={{ background: swatchColor }}
                            onClick={() => { setEditThemeColor(swatchColor); markUnsaved(); }}
                          />
                        ))}
                        <div className="custom-color-input-wrapper" title="Warna Kustom">
                          <input type="color" value={editThemeColor} onChange={(e) => { setEditThemeColor(e.target.value); markUnsaved(); }} />
                        </div>
                      </div>
                    </div>

                    <div className="field">
                      <label>Font Judul Pasangan</label>
                      <select value={editTitleFont} onChange={(e) => { setEditTitleFont(e.target.value); markUnsaved(); }}>
                        <option value="Playfair Display">Playfair Display (Serif Klasik)</option>
                        <option value="Gyahegi">Gyahegi (Modern Elegant Calligraphy)</option>
                        <option value="Great Vibes">Great Vibes (Romantic Cursive)</option>
                        <option value="Cormorant Garamond">Cormorant Garamond (Sleek Serif)</option>
                        <option value="Libre Baskerville">Libre Baskerville (Bold Vintage Serif)</option>
                        <option value="Outfit">Outfit (Clean Sans-Serif)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><i className="ti ti-photo" /></div>
                    <span className="card-title">Foto Banner Latar Belakang (Hero Background)</span>
                  </div>
                  <p className="card-sub">Latar belakang utama beranda photobooth</p>
                  <div className="card-content">
                    <div className="hero-preview">
                      <div className="hero-sim" id="hero-sim" style={{ backgroundImage: heroImageUrl ? `url('${heroImageUrl}')` : "" }}>
                        <div className="hero-sim-text">
                          <div className="hero-sim-event">PERNIKAHAN BAHAGIA</div>
                          <div className="hero-sim-couple" style={{ fontFamily: `"${editTitleFont}", serif` }}>{editHost}</div>
                          <div className="hero-sim-date">{editDate ? new Date(editDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Tanggal Acara"}</div>
                        </div>
                        <button className="hero-edit-btn" onClick={() => heroInputRef.current?.click()}>
                          <i className="ti ti-pencil" /> Ganti Gambar
                        </button>
                      </div>
                    </div>
                    <input type="file" ref={heroInputRef} style={{ display: "none" }} accept="image/*" onChange={handleHeroFileChange} />
                    <div className="guide-box guide-success">
                      <div className="guide-title">
                        <i className="ti ti-info-circle-filled" /> Panduan Ukuran &amp; Resolusi
                      </div>
                      Gunakan foto portrait resolusi sedang (rekomendasi: <strong>9:16</strong> atau minimal 720x1280 px). Format file yang diizinkan: JPG, PNG, atau WEBP dengan ukuran maksimal <strong>3MB</strong> untuk menjaga kecepatan load tamu.
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 3: FRAMES */}
              <div className={`pane ${activeTab === "frames" ? "active" : ""}`} id="pane-frames">
                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><i className="ti ti-photo-frame" /></div>
                    <span className="card-title">Koleksi Desain Bingkai Polaroid</span>
                  </div>
                  <p className="card-sub">Klik frame untuk mengaktifkan / menonaktifkan agar muncul di pilihan tamu</p>
                  <div className="card-content">
                    <div className="frame-grid" id="frame-grid">
                      {frames.map((frame, index) => {
                        let previewHtml = "";
                        if (frame.svg_code) {
                          previewHtml = frame.svg_code.replace(/\{\{COUPLE_NAME\}\}/g, editHost);
                        } else if (frame.png_url) {
                          previewHtml = `<img src="${frame.png_url}" style="width:100%;height:100%;object-fit:cover;" alt="${frame.name}"/>`;
                        }

                        return (
                          <div key={frame.id} className={`frame-item ${frame.is_active ? "active" : ""}`} onClick={() => toggleFrameState(index)}>
                            <div className="frame-preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#f5ede0,#faf6f0)", opacity: 0.25 }} />
                              <div className="frame-svg-mini" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                            </div>
                            <div className="fcheck"><i className="ti ti-check" /></div>
                            <button
                              className="frame-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFrame(frame.id, frame.name);
                              }}
                              title="Hapus Frame"
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        );
                      })}

                      <div className="frame-add" onClick={() => fileInputRef.current?.click()}>
                        <i className="ti ti-plus" />
                        <span>Upload Custom</span>
                      </div>
                    </div>
                    <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/png" onChange={handleAddFrameFile} />

                    <div className="guide-box guide-success" style={{ marginTop: "24px" }}>
                      <div className="guide-title">
                        <i className="ti ti-info-circle-filled" /> Panduan Membuat Frame Custom PNG
                      </div>
                      1. Buat file PNG transparan berukuran <strong>3:4 (rekomendasi: 600 x 800 pixel)</strong>.<br />
                      2. Bagian tengah harus **bolong / transparan** agar wajah tamu terlihat di kamera.<br />
                      3. Pinggiran diberi ornamen hiasan floral/tulisan nama pengantin secara manual.<br />
                      4. Ekspor dengan format **PNG-24 dengan transparansi diaktifkan**.
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 4: QR CODE */}
              <div className={`pane ${activeTab === "qr" ? "active" : ""}`} id="pane-qr">
                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><i className="ti ti-qrcode" /></div>
                    <span className="card-title">Link QR Code QR Masuk Pintu Acara</span>
                  </div>
                  <p className="card-sub">Cetak QR Code ini untuk diletakkan di stand photobooth / meja tamu agar dipindai lewat HP masing-masing</p>
                  <div className="card-content">
                    <div className="qr-container">
                      <div className="qr-card-wrap" id="qr-card-wrap">
                        {qrImageSrc ? (
                          <img src={qrImageSrc} alt="QR Code" width="160" height="160" style={{ borderRadius: "8px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }} />
                        ) : (
                          <div style={{ width: "160px", height: "160px", background: "#f1f5f9", borderRadius: "8px" }} />
                        )}
                      </div>
                      <div className="qr-link-display" id="qr-event-link-display">
                        <a href={guestLink} target="_blank" rel="noreferrer" style={{ color: "var(--gold-dark)", textDecoration: "underline", wordBreak: "break-all" }}>{guestLink}</a>
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn" onClick={() => copyToClipboard(guestLink, "Link Halaman Tamu")}>
                          <i className="ti ti-copy" /> Salin Link
                        </button>
                        <button className="btn btn-primary" onClick={() => {
                          window.open(qrDownloadSrc, "_blank");
                          showToast("QR Code dibuka di tab baru untuk diunduh!", "success");
                        }}>
                          <i className="ti ti-download" /> Buka QR (Resolusi Tinggi)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 5: SETTINGS */}
              <div className={`pane ${activeTab === "settings" ? "active" : ""}`} id="pane-settings">
                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><i className="ti ti-settings" /></div>
                    <span className="card-title">Setelan Fitur Perekaman &amp; Modul</span>
                  </div>
                  <p className="card-sub">Konfigurasikan alur kerja photobooth tamu di lapangan</p>
                  <div className="card-content">
                    <div className="toggle-list">
                      <div className="toggle-row">
                        <div className="toggle-text">
                          <span className="toggle-label">Fitur Rekam Suara (Voice Note)</span>
                          <span className="toggle-desc">Izinkan tamu merekam pesan &amp; doa ucapan berdurasi hingga 1 menit</span>
                        </div>
                        <button className={`toggle-switch ${editAllowVoice ? "on" : ""}`} onClick={() => { setEditAllowVoice(!editAllowVoice); markUnsaved(); }} />
                      </div>

                      <div className="toggle-row">
                        <div className="toggle-text">
                          <span className="toggle-label">Wajib Isi Nama Tamu</span>
                          <span className="toggle-desc">Tamu tidak bisa berlanjut mengambil foto sebelum mengisi nama lengkap</span>
                        </div>
                        <button className={`toggle-switch ${editRequireName ? "on" : ""}`} onClick={() => { setEditRequireName(!editRequireName); markUnsaved(); }} />
                      </div>

                      <div className="toggle-row">
                        <div className="toggle-text">
                          <span className="toggle-label">Izinkan Foto Ulang (Retake Photo)</span>
                          <span className="toggle-desc">Izinkan tamu mengambil foto ulang berkali-kali jika hasil foto kurang memuaskan</span>
                        </div>
                        <button className={`toggle-switch ${editAllowRetake ? "on" : ""}`} onClick={() => { setEditAllowRetake(!editAllowRetake); markUnsaved(); }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* LIVE PREVIEW SMARTPHONE CONTAINER */}
            <div className="workspace-preview">
              <span className="preview-header">
                <i className="ti ti-device-mobile" /> Live Mockup HP Tamu
              </span>

              <div className="phone-mockup">
                <div className="phone-speaker" />
                <div className="phone-screen">
                  <div className="phone-app">

                    {/* Smartphone pane: Welcome screen */}
                    <div className={`phone-pane ${(activeTab === "event" || activeTab === "appearance" || activeTab === "qr") ? "active" : ""}`} id="phone-pane-welcome">
                      <div
                        className="phone-hero"
                        id="phone-hero-bg"
                        style={{ backgroundImage: heroImageUrl ? `url('${heroImageUrl}')` : "" }}
                      >
                        <div className="phone-hero-overlay" />
                        <div className="phone-hero-text">
                          <span className="phone-hero-event">WEDDING EVENT</span>
                          <span className="phone-hero-couple" id="phone-mock-couple" style={{ fontFamily: `"${editTitleFont}", serif` }}>
                            {editHost}
                          </span>
                          <span className="phone-hero-date" id="phone-mock-date">
                            {editDate ? new Date(editDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Tanggal Acara"}
                          </span>
                        </div>
                        <div className="phone-hero-badge">
                          <div className="phone-pulse" /> Live
                        </div>
                      </div>
                      <div className="phone-body">
                        <div className="phone-card">
                          <span className="phone-logo">✦ PHOTOBOOTH EVENT ✦</span>
                          <span className="phone-welcome-title">Selamat Datang</span>
                          <p className="phone-welcome-text" id="phone-mock-welcome">
                            Abadikan momen spesial bersama &amp; kirim ucapan hangat untuk pasangan
                          </p>

                          <div className="phone-input-sim">
                            <span className="phone-input-lbl">Nama Kamu</span>
                            <div className="phone-input-box">Tulis nama lengkap...</div>
                          </div>

                          <button
                            className="phone-btn-primary"
                            id="phone-welcome-btn"
                            style={{ background: editThemeColor, boxShadow: `0 4px 10px ${editThemeColor}40` }}
                            onClick={() => setActiveTab("frames")}
                          >
                            Lanjutkan →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Smartphone pane: Frame Picker Screen */}
                    <div className={`phone-pane ${activeTab === "frames" ? "active" : ""}`} id="phone-pane-frames">
                      <div className="phone-body" style={{ background: "#fff", flex: "1" }}>
                        <span className="phone-app-title">Pilih Bingkai</span>
                        <p className="phone-app-sub">Pilih bingkai polaroid favoritmu</p>

                        <div className="phone-frame-grid" id="phone-mock-frame-grid">
                          {frames.filter(f => f.is_active).map((frame, idx) => {
                            let previewHtml = "";
                            if (frame.svg_code) {
                              previewHtml = frame.svg_code.replace(/\{\{COUPLE_NAME\}\}/g, editHost);
                            } else if (frame.png_url) {
                              previewHtml = `<img src="${frame.png_url}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;">`;
                            }

                            return (
                              <div key={frame.id} className={`phone-frame-item ${idx === 0 ? "selected" : ""}`} style={{ borderColor: idx === 0 ? editThemeColor : "" }}>
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#f5ede0,#faf6f0)", opacity: 0.25 }} />
                                <div className="frame-preview-sim" dangerouslySetInnerHTML={{ __html: previewHtml }} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
                                <div className="check-icon" style={{ background: editThemeColor }}><i className="ti ti-check" /></div>
                              </div>
                            );
                          })}

                          {frames.filter(f => f.is_active).length === 0 && (
                            <div style={{ gridColumn: "1/-1", textAlign: "center", fontSize: "11px", color: "var(--text-secondary)", padding: "20px" }}>
                              Aktifkan minimal 1 frame di panel admin.
                            </div>
                          )}
                        </div>

                        <button
                          className="phone-btn-primary"
                          id="phone-frame-btn"
                          style={{ marginTop: "auto", background: editThemeColor, boxShadow: `0 4px 10px ${editThemeColor}40` }}
                          onClick={() => setActiveTab("settings")}
                        >
                          Buka Kamera →
                        </button>
                      </div>
                    </div>

                    {/* Smartphone pane: Settings (Camera/Voice simulated screen) */}
                    <div className={`phone-pane ${activeTab === "settings" ? "active" : ""}`} id="phone-pane-settings">
                      <div className="phone-body" style={{ background: "#fff", flex: "1" }}>
                        <span className="phone-app-title">Ambil Foto &amp; Suara</span>
                        <p className="phone-app-sub">Posisikan wajah Anda di tengah</p>

                        <div className="phone-cam-wrap">
                          <div className="phone-cam-sim">👤</div>
                          <div
                            className="phone-mock-frame-overlay"
                            id="phone-mock-frame-overlay"
                            style={{ color: editThemeColor }}
                            dangerouslySetInnerHTML={{ __html: frames.filter(f => f.is_active)[0] ? getFrameHtml(frames.filter(f => f.is_active)[0]) : "" }}
                          />
                        </div>

                        {/* Simulated voice block toggled on settings */}
                        {editAllowVoice && (
                          <div className="phone-voice-rec" id="phone-mock-voice-rec">
                            <div className="phone-rec-mic" style={{ background: editThemeColor }}><i className="ti ti-microphone" /></div>
                            <div className="phone-rec-timer">Simulasi Modul Suara Aktif</div>
                          </div>
                        )}

                        <button
                          className="phone-btn-primary"
                          style={{ marginTop: "auto", background: editThemeColor, boxShadow: `0 4px 10px ${editThemeColor}40` }}
                          onClick={() => setActiveTab("event")}
                        >
                          Selesai Kirim ✓
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
