import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [activeToast, setActiveToast] = useState(null);
  const audioCtxRef = useRef(null);

  // Web Audio API control-room chime
  const playAlertSound = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Tone 1: 880 Hz (High Alarm Chime)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Tone 2: 587 Hz (Resolve Tone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(587, now + 0.16);
      gain2.gain.setValueAtTime(0.18, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn("Audio alert blocked by browser:", err);
    }
  }, [isSoundEnabled]);

  const triggerToast = useCallback((alertData) => {
    setActiveToast(alertData);
    playAlertSound();

    // Auto dismiss after 10s if not dismissed manually
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === alertData.id ? null : curr));
    }, 10000);
  }, [playAlertSound]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  return (
    <AlertContext.Provider value={{
      isSoundEnabled,
      toggleSound,
      activeToast,
      triggerToast,
      dismissToast,
      playAlertSound
    }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
