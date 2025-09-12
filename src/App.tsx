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
  const [speed, setSpeed] = useState<number>(1); // tốc độ phát mặc định 1.0x

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const url = URL.createObjectURL(file);
    setFileUrl(url);

    if (!audioContextRef.current && audioRef.current) {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaElementSource(audioRef.current);
      const gainNode = ctx.createGain();

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      sourceRef.current = source;
      gainNodeRef.current = gainNode;
    }
  };

  const handleCancelFile = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
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
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const timeUpdate = () => setCurrentTime(audio.currentTime);
    const loadedMeta = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", timeUpdate);
    audio.addEventListener("loadedmetadata", loadedMeta);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", timeUpdate);
      audio.removeEventListener("loadedmetadata", loadedMeta);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <div className="player-container">
      <h1 className="title">🎵 オーディオ音量ブースト</h1>

      {/* ファイルアップロード */}
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

      {/* 非表示のオーディオ要素 */}
      <audio ref={audioRef} src={fileUrl || ""} className="hidden" />

      {/* 波形ビジュアル */}
      {fileUrl && <Waveform audioRef={audioRef} fileUrl={fileUrl} />}

      {/* 再生バー */}
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

      {/* 音量調整 */}
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

      {/* 再生速度調整 */}
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

      {/* 再生・一時停止ボタン */}
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
