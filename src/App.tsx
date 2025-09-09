import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import Waveform from "./components/Waveform";

export default function AudioVolumeBoost() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      let url: string;
      if (typeof ev.target?.result === "string") {
        url = ev.target.result;
      } else {
        url = URL.createObjectURL(new Blob([ev.target?.result as ArrayBuffer]));
      }
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

    reader.readAsDataURL(file);
  };

  const handleCancelFile = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setFileUrl(null);
    setFileName(null);
    setDuration(0);
    setCurrentTime(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = vol;
    }
  };

  const handlePlay = () => {
    audioContextRef.current?.resume();
    audioRef.current?.play();
  };

  const handlePause = () => {
    audioRef.current?.pause();
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const timeUpdate = () => setCurrentTime(audio.currentTime);
    const loadedMeta = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", timeUpdate);
    audio.addEventListener("loadedmetadata", loadedMeta);

    return () => {
      audio.removeEventListener("timeupdate", timeUpdate);
      audio.removeEventListener("loadedmetadata", loadedMeta);
    };
  }, []);

  return (
    <div className="player-container">
      <h1 className="title">🎵 Upload & Boost Audio Volume</h1>

      <div className="upload-container">
        <input
          type="file"
          accept="audio/*"
          id="upload"
          onChange={handleFileUpload}
          className="file-input"
        />
        <label htmlFor="upload" className="btn upload">
          📂 Upload File
        </label>
        {fileName && <span className="file-name">{fileName}</span>}
        {fileName && (
          <button onClick={handleCancelFile} className="btn cancel">
            x
          </button>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />

      {fileUrl && <Waveform audioRef={audioRef} fileUrl={fileUrl} />}

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

      <div className="volume-container">
        <label>Âm lượng</label>
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

      {fileName && (
        <div className="controls">
          <button onClick={handlePlay} className="btn play">
            ▶ Play
          </button>
          <button onClick={handlePause} className="btn pause">
            ⏸ Pause
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
