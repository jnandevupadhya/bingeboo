import { useState, useEffect, useRef } from "react";
// const wsBase = import.meta.env.VITE_WS_URL;
const wsBase = "wss://bingeboo-dev.onrender.com";

import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  LogIn,
  X,
  GripVertical,
  Loader2,
} from "lucide-react";
import RemoteButton from "./RemoteButton";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import ChristmasDecorations from "./ChristmasDecorations";

const STORAGE_KEY = "media-remote-credentials";

export default function MediaRemote() {
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState("");
  let connected = false;

  const canJoin = roomId.length === 5 && password.length > 0;

  const playRef = useRef(null);
  const rewindRef = useRef<HTMLButtonElement>(null);
  const forwardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft") {
        rewindRef.current?.focus();
        rewindRef.current?.click();
      }
      if (e.code === "ArrowRight") {
        forwardRef.current?.focus();
        forwardRef.current?.click();
      }
      if (e.code === "Space") {
        e.preventDefault();
        playRef.current?.focus();
        playRef.current?.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load saved credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { roomId: savedRoom, password: savedPass } = JSON.parse(saved);
        if (savedRoom) setRoomId(savedRoom);
        if (savedPass) setPassword(savedPass);
      } catch (e) {
        console.warn("Failed to parse saved credentials");
      }
    }
  }, []);

  useEffect(() => {
    if (!isConnected) {
      // window.electron?.resize(300, 350);

      return;
    }

    console.log("Resizing");
    setTimeout(() => {
      window.electron?.resize(220, 58);
    }, 50);
  }, [isConnected]);

  const handleJoin = () => {
    if (!canJoin || isLoading) return;
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError("Failed to join room");
      }
    }, 10000);

    console.log(`🔌 Joining room ${roomId} with password`);

    const socket = new WebSocket(
      `${wsBase}/ws/remote/${roomId}?pass=${password}`
    );

    setWs(socket);

    socket.onopen = () => {
      console.log("🟡 WS opened, waiting for server response");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "error") {
        console.error("❌ Join failed:", data.message);
        setError(data.message || "Connection failed");

        // Clear the field based on error type
        if (
          data.code === "ROOM_NOT_FOUND" ||
          data.message?.toLowerCase().includes("room")
        ) {
          setRoomId("");
        } else if (
          data.code === "INVALID_PASSWORD" ||
          data.message?.toLowerCase().includes("password")
        ) {
          setPassword("");
        }

        setIsConnected(false);
        setIsLoading(false);
        socket.close();
        return;
      }

      if (data.type === "joined") {
        connected = true;

        console.log("✅ Joined room");
        setIsConnected(true);
        setIsLoading(false);
        setError("null");
        // Save credentials on successful join
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId, password }));
      }

      if (data.type === "paused") {
        console.log(data.type);
        setIsPlaying(false);
      } else if (data.type === "playing") {
        console.log(data.type);
        setIsPlaying(true);
      }
    };

    socket.onerror = (err) => {
      console.error("⚠️ WS error:", err);
      setError("Connection error");
      setIsConnected(false);
      setIsLoading(false);
      window.electron?.close();
    };

    socket.onclose = (event) => {
      console.warn(`🔌 WS closed (code=${event.code})`);

      setIsLoading(false);
      setWs(null);
      console.log("errorrrrrrrrrr:", error);
      console.log("connected var: ", connected);
      if (connected) window.electron?.forceResize();
      setTimeout(() => {
        setIsConnected(false);
      }, 500);
      // window.electron?.resize(300, 340);
    };
  };

  const sendCommand = (payload: object) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      console.warn("WebSocket not connected");
    }
  };

  const handleTogglePlay = () => {
    window.electron?.exitDiscordFullscreen();
    if (isPlaying) {
      console.log("⏸️ Pause triggered");
      sendCommand({ action: "pause" });
    } else {
      console.log("▶️ Play triggered");
      sendCommand({ action: "play" });
    }
    // setIsPlaying(!isPlaying);
  };

  const handleSkipBackward = () => {
    console.log("⏪ Skip backward 10s");
    sendCommand({ action: "rewind" });
  };

  const handleSkipForward = () => {
    console.log("⏩ Skip forward 10s");
    sendCommand({ action: "forward" });
  };

  const handleClose = () => {
    console.log("❌ Close remote");
    ws?.close();
    window.electron?.close();
  };

  // Join screen
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden">
        <ChristmasDecorations />
        <div className="flex flex-col items-center relative z-10">
          <div className="flex items-center   text-muted-foreground text-sm font-semibold animate-float">
            <div className=" drag-region flex flex-col gap-4 p-5 glass rounded-2xl">
              {/* Header with exit button */}
              <div className="flex flex-row items-center justify-between">
                <div className="w-8" /> {/* Spacer for centering */}
                <div className="flex items-center gap-2">
                  <div className="no-drag w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-semibold text-foreground/90 tracking-wide mr-5">
                    Control Playback
                  </span>
                </div>
                <RemoteButton
                  onClick={handleClose}
                  variant="close"
                  label="Close"
                >
                  <X size={16} strokeWidth={2.5} />
                </RemoteButton>
              </div>

              {/* Room ID Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Room ID
                </label>
                <Input
                  type="text"
                  placeholder="XXXXX"
                  value={roomId}
                  onChange={(e) =>
                    setRoomId(e.target.value.toUpperCase().slice(0, 5))
                  }
                  maxLength={5}
                  className="no-drag bg-muted/50 border-border/50 text-center text-lg font-mono tracking-[0.3em] placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:ring-primary/50"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <Input
                  type="text"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="no-drag bg-muted/50 border-border/50 placeholder:text-muted-foreground/50 focus:ring-primary/50"
                />
              </div>

              {/* Join Button - only visible when valid */}
              <div
                className={`transition-all duration-300 ease-out overflow-hidden ${
                  canJoin ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <Button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="no-drag w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogIn size={16} />
                  )}
                  {isLoading ? "Joining..." : "Join Room"}
                </Button>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-xs text-destructive text-center font-medium">
                  {error}
                </p>
              )}

              {/* Subtle hint */}
              {!error && (
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  {roomId.length < 5
                    ? `Enter ${5 - roomId.length} more character${
                        5 - roomId.length !== 1 ? "s" : ""
                      }`
                    : password.length === 0
                    ? "Enter password to continue"
                    : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Remote controls
  return (
    <div className="main-div min-h-screen flex items-center justify-center ">
      {/* opacity wrapper */}
      <div className="drag-region min-w-4 z-99 opacity-100 flex items-center justify-center">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="opacity-30 hover:opacity-100  transition-opacity">
        {/* drag-safe container (NO opacity here) */}
        <div className="flex items-center glass rounded-2xl overflow-hidden">
          {/* LEFT: drag strip */}

          {/* RIGHT: controls */}
          <div className="flex items-center gap-2 px-3 py-2">
            {/* Main controls */}
            <div className="flex  items-center gap-1.5">
              <RemoteButton
                ref={rewindRef}
                onClick={handleSkipBackward}
                label="Skip back 10 seconds"
              >
                <div className="relative">
                  <RotateCcw size={18} strokeWidth={2.5} />
                  <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold">
                    10
                  </span>
                </div>
              </RemoteButton>

              <RemoteButton
                ref={playRef}
                onClick={handleTogglePlay}
                label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={14} strokeWidth={2.5} fill="currentColor" />
                ) : (
                  <Play size={14} strokeWidth={2.5} fill="currentColor" />
                )}
              </RemoteButton>

              <RemoteButton
                ref={forwardRef}
                onClick={handleSkipForward}
                label="Skip forward 10 seconds"
              >
                <div className="relative">
                  <RotateCw size={18} strokeWidth={2.5} />
                  <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold">
                    10
                  </span>
                </div>
              </RemoteButton>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border/50" />

            {/* Close button */}
            <RemoteButton
              onClick={handleClose}
              variant="close"
              label="Close remote"
            >
              <X size={14} strokeWidth={2.5} />
            </RemoteButton>
          </div>
        </div>
      </div>
    </div>
  );
}
