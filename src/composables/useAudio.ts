interface MusicNodes {
  sources: AudioScheduledSourceNode[];
  masterGain: GainNode;
}

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function useAudio() {
  let audioCtx: AudioContext | null = null;
  let musicNodes: MusicNodes | null = null;
  let trackBuffer: AudioBuffer | null = null;
  let trackLoadPromise: Promise<AudioBuffer> | null = null;

  const ensureCtx = (): AudioContext => {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      audioCtx = new Ctor!();
    }
    return audioCtx;
  };

  const loadTrack = (url: string): Promise<AudioBuffer> => {
    if (trackBuffer) return Promise.resolve(trackBuffer);
    if (!trackLoadPromise) {
      const ctx = ensureCtx();
      trackLoadPromise = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch track: ${res.status}`);
          return res.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data))
        .then((buf) => {
          trackBuffer = buf;
          return buf;
        })
        .catch((err) => {
          trackLoadPromise = null;
          throw err;
        });
    }
    return trackLoadPromise;
  };

  const playTone = (key: string) => {
    const ctx = ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value =
      key === '*' ? 941 : key === '#' ? 1477 : 350 + parseInt(key) * 50;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  };

  const playSynth = (ctx: AudioContext) => {
    const notes = [261.63, 329.63, 392.0];
    const sources: AudioScheduledSourceNode[] = [];
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.5);
    masterGain.connect(ctx.destination);

    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(masterGain);
      osc.start();
      lfo.start();
      sources.push(osc, lfo);
    });

    musicNodes = { sources, masterGain };
  };

  const playTrackBuffer = (ctx: AudioContext, buffer: AudioBuffer) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);

    source.connect(masterGain);
    masterGain.connect(ctx.destination);
    source.start();

    musicNodes = { sources: [source], masterGain };
  };

  const playMusic = async (trackUrl?: string) => {
    const ctx = ensureCtx();

    if (trackUrl) {
      try {
        const buffer = await loadTrack(trackUrl);
        if (musicNodes) return;
        playTrackBuffer(ctx, buffer);
        return;
      } catch (err) {
        console.warn('Track load failed, falling back to synth:', err);
      }
    }

    if (musicNodes) return;
    playSynth(ctx);
  };

  const stopMusic = () => {
    if (!musicNodes || !audioCtx) return;
    const { sources, masterGain } = musicNodes;
    musicNodes = null;
    masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    setTimeout(() => {
      sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      });
    }, 600);
  };

  return { playTone, playMusic, stopMusic };
}
