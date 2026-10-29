/**
 * Utilitário de feedback multissensorial para leitura de código de barras.
 * Fornece bipe sonoro sintético elegante via Web Audio API e vibração tátil no mobile,
 * operando com latência zero e 100% offline no PWA.
 */

export function playBarcodeBeep(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // Lá 6 (1760 Hz) — timbre claro e elegante

    // Envelope suave de ataque e decaimento para evitar cliques e ruídos no alto-falante
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);

    // Libera o contexto após o término do áudio
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 120);
  } catch {
    // Silencia se o navegador bloquear áudio automático
  }
}

export function triggerHapticFeedback(): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(50);
    } catch {
      // Ignora silenciosamente se o dispositivo não permitir vibração
    }
  }
}

export function playBarcodeSuccessFeedback(): void {
  playBarcodeBeep();
  triggerHapticFeedback();
}
