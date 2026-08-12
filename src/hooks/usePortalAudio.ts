"use client";

import { useCallback, useEffect, useRef } from "react";

type BrowserAudioContext = typeof AudioContext;

function getAudioContextConstructor() {
  return window.AudioContext || (window as typeof window & { webkitAudioContext?: BrowserAudioContext }).webkitAudioContext;
}

function createNoiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 0.45, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }

  return buffer;
}

function tone(
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  duration: number,
  type: OscillatorType,
  gain: number,
  delay = 0
) {
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.38), start + duration);

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.018);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

export function usePortalAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const ensureContext = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      return null;
    }

    if (!contextRef.current) {
      const context = new AudioContextConstructor();
      const master = context.createGain();
      master.gain.value = 0.32;
      master.connect(context.destination);
      contextRef.current = context;
      masterRef.current = master;
    }

    void contextRef.current.resume();
    return contextRef.current;
  }, []);

  const portalSquelch = useCallback((power = 1) => {
    const context = ensureContext();
    const master = masterRef.current;

    if (!context || !master) {
      return;
    }

    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(680, context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, context.currentTime + 0.42);
    filter.Q.value = 5.6;

    const noise = context.createBufferSource();
    const noiseGain = context.createGain();
    noise.buffer = createNoiseBuffer(context);
    noiseGain.gain.setValueAtTime(0.0001, context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.15 * power, context.currentTime + 0.035);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();
    noise.stop(context.currentTime + 0.46);

    tone(context, master, 196 * power, 0.38, "sawtooth", 0.09);
    tone(context, master, 392 * power, 0.22, "triangle", 0.06, 0.05);
    tone(context, master, 74, 0.28, "sine", 0.11, 0.08);
  }, [ensureContext]);

  const boardPop = useCallback(() => {
    const context = ensureContext();
    const master = masterRef.current;

    if (!context || !master) {
      return;
    }

    tone(context, master, 520, 0.11, "square", 0.04);
    tone(context, master, 780, 0.09, "triangle", 0.03, 0.05);
  }, [ensureContext]);

  useEffect(() => {
    return () => {
      masterRef.current?.disconnect();
      masterRef.current = null;
      void contextRef.current?.close();
      contextRef.current = null;
    };
  }, []);

  return { portalSquelch, boardPop };
}

