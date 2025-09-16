import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import Waveform from "./components/Waveform";

export default function AudioVolumeBoost() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const wsolaNodeRef = useRef<AudioWorkletNode | null>(null);

  // 🎵 Hàm init audio graph
  const initAudioGraph = async () => {
    if (!audioRef.current) return;
    if (audioContextRef.current) return; // đã init rồi thì bỏ qua

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // load worklet
    await ctx.audioWorklet.addModule("/wsola-processor.js");

    // tạo các node
    const sourceNode = ctx.createMediaElementSource(audioRef.current);
    const wsolaNode = new AudioWorkletNode(ctx, "wsola-processor");
    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    // connect graph: source → WSOLA → Gain → output
    sourceNode.connect(wsolaNode).connect(gainNode).connect(ctx.destination);

    // lưu ref để điều khiển
    sourceRef.current = sourceNode;
    wsolaNodeRef.current = wsolaNode;
    gainNodeRef.current = gainNode;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    e.target.value = "";
  };

  const handleCancelFile = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (fileUrl) URL.revokeObjectURL(fileUrl);

    setFileUrl(null);
    setFileName(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = vol;
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioContextRef.current?.resume();
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);

    if (wsolaNodeRef.current) {
      wsolaNodeRef.current.port.postMessage({ type: "speed", value: newSpeed });
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  useEffect(() => {
    if (!isPlaying || !audioContextRef.current) return;

    let frameId: number;

    const update = () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
      frameId = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(frameId);
  }, [isPlaying]);

  // Khi có file mới → init audio graph
  useEffect(() => {
    if (fileUrl && audioRef.current) {
      initAudioGraph();

      const applySettings = () => {
        audioRef.current!.playbackRate = speed;
        if (wsolaNodeRef.current) {
          wsolaNodeRef.current.port.postMessage({
            type: "speed",
            value: speed,
          });
        }
        audioRef.current!.currentTime = 0;
        setCurrentTime(0);
        setDuration(audioRef.current!.duration || 0);
        setIsPlaying(false);
      };

      audioRef.current.addEventListener("loadedmetadata", applySettings);
      return () => {
        audioRef.current?.removeEventListener("loadedmetadata", applySettings);
      };
    }
  }, [fileUrl, speed]);

  return (
    <div className="player-container">
      <h1 className="title">🎵 オーディオ音量ブースト</h1>

      {/* Upload */}
      <div className="upload-container">
        <div style={{ position: "relative", width: "fit-content" }}>
          <input
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.aac"
            id="upload"
            onChange={handleFileUpload}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              zIndex: 2,
              cursor: "pointer",
            }}
          />
          <label htmlFor="upload" className="btn upload" style={{ zIndex: 1 }}>
            📂 ファイルを開く
          </label>
        </div>
        {fileName && <span className="file-name">{fileName}</span>}
        {fileName && (
          <button onClick={handleCancelFile} className="btn cancel">
            ✖ 削除
          </button>
        )}
      </div>

      {/* Hidden audio */}
      {fileUrl && (
        <audio
          ref={audioRef}
          src={fileUrl}
          className="hidden"
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {/* Waveform */}
      {fileUrl && <Waveform audioRef={audioRef} fileUrl={fileUrl} />}

      {/* Progress */}
      {duration > 0 && (
        <div className="progress-container">
          <span className="time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={handleTimeChange}
            className="progress-bar"
          />
          <span className="time">{formatTime(duration)}</span>
        </div>
      )}

      {/* Volume */}
      <div className="volume-container">
        <label>音量</label>
        <input
          type="range"
          min="0"
          max="4"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-bar"
        />
        <span>{(volume * 100).toFixed(0)}%</span>
      </div>

      {/* Speed */}
      <div className="speed-container">
        <label>再生速度</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={handleSpeedChange}
          className="speed-bar"
        />
        <span>{speed.toFixed(1)}x</span>
      </div>

      {/* Controls */}
      {fileName && (
        <div className="controls">
          <button
            onClick={togglePlayPause}
            className={`btn ${isPlaying ? "pause" : "play"}`}
          >
            {isPlaying ? "⏸ 一時停止" : "▶ 再生"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatTime(time: number) {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
