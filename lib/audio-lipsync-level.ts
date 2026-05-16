/**
 * Maps analyser frequency data to a 0–1 “mouth openness” proxy (not true visemes).
 */
export function startAudioLevelLoop(options: {
  analyser: AnalyserNode;
  onLevel: (level01: number) => void;
}): () => void {
  const { analyser, onLevel } = options;
  const data = new Uint8Array(analyser.frequencyBinCount);
  let raf = 0;
  let smoothed = 0;

  const tick = () => {
    analyser.getByteFrequencyData(data);
    let sum = 0;
    const hi = Math.max(4, Math.floor(data.length * 0.2));
    for (let i = 1; i < hi; i++) {
      sum += data[i] ?? 0;
    }
    const raw = Math.min(1, (sum / (255 * hi)) * 8);
    smoothed = smoothed * 0.82 + raw * 0.18;
    onLevel(smoothed);
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
