// Waveform.tsx
import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

type WaveformProps = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  fileUrl: string;
};

export default function Waveform({ audioRef, fileUrl }: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    if (!wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#4ade80",
        progressColor: "#22c55e",
        height: 120,
        backend: "MediaElement", // liên kết với thẻ <audio>
        media: audioRef.current || undefined,
        plugins: [
          TimelinePlugin.create({
            container: timelineRef.current!,
          }),
        ],
      });
    }

    if (fileUrl && audioRef.current) {
      audioRef.current.src = fileUrl;
      audioRef.current.load();
      wavesurferRef.current.load(fileUrl);
    }
  }, [fileUrl]);

  return (
    <div>
      <div ref={waveformRef}></div>
      <div ref={timelineRef}></div>
    </div>
  );
}
