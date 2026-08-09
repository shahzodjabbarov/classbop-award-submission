let sharedAudioContext;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  sharedAudioContext ||= new AudioContextClass();
  if (sharedAudioContext.state === 'suspended') sharedAudioContext.resume();
  return sharedAudioContext;
}

function scheduleTone(context, { time, frequency, endFrequency = frequency, duration, gain = 0.05, type = 'sine' }) {
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), time + duration);
  volume.gain.setValueAtTime(0.0001, time);
  volume.gain.exponentialRampToValueAtTime(gain, time + 0.008);
  volume.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.02);
}

export function playMachineSpinSound(machineId, durationMs) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + 0.025;
  const duration = durationMs / 1000;

  if (machineId === 'wheel') {
    const tickCount = 36;
    for (let index = 0; index < tickCount; index += 1) {
      const progress = index / (tickCount - 1);
      const easedTime = duration * (0.16 * progress + 0.84 * progress ** 2.15);
      scheduleTone(context, {
        time: start + easedTime,
        frequency: 920 - progress * 250,
        endFrequency: 650 - progress * 120,
        duration: 0.026 + progress * 0.018,
        gain: 0.018,
        type: 'square',
      });
    }
    const showNotes = [261.63, 329.63, 392, 523.25, 392, 523.25, 659.25, 783.99];
    showNotes.forEach((note, index) => {
      const noteTime = start + 0.13 + index * ((duration - 0.65) / showNotes.length);
      scheduleTone(context, { time: noteTime, frequency: note, endFrequency: note * 1.01, duration: 0.17, gain: 0.025, type: 'triangle' });
    });
    scheduleTone(context, { time: start + 0.08, frequency: 150, endFrequency: 300, duration: duration - 0.42, gain: 0.008, type: 'sine' });
    return;
  }

  if (machineId === 'gumball') {
    const bounceMelody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    for (let index = 0; index < 16; index += 1) {
      const progress = index / 16;
      const note = bounceMelody[index % bounceMelody.length];
      scheduleTone(context, {
        time: start + 0.08 + progress * (duration - 0.8),
        frequency: note,
        endFrequency: note * 0.72,
        duration: 0.11,
        gain: index % 4 === 0 ? 0.04 : 0.027,
        type: 'triangle',
      });
    }
    scheduleTone(context, { time: start + duration - 0.66, frequency: 659.25, endFrequency: 130.81, duration: 0.54, gain: 0.045, type: 'sine' });
    return;
  }

  scheduleTone(context, { time: start, frequency: 98, endFrequency: 78, duration: duration - 0.35, gain: 0.012, type: 'sawtooth' });
  const arcadeNotes = [392, 493.88, 587.33, 493.88, 523.25, 659.25];
  [0.22, 0.7, 1.18, 1.66, 2.14, 2.62].forEach((offset, index) => {
    const note = arcadeNotes[index];
    scheduleTone(context, { time: start + offset, frequency: note, endFrequency: note * 1.03, duration: 0.14, gain: 0.032, type: 'square' });
    scheduleTone(context, { time: start + offset, frequency: note / 2, endFrequency: note / 2, duration: 0.15, gain: 0.014, type: 'triangle' });
  });
  scheduleTone(context, { time: start + duration - 0.76, frequency: 196, endFrequency: 98, duration: 0.16, gain: 0.05, type: 'square' });
}

export function playMachineRevealSound() {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime + 0.015;

  scheduleTone(context, { time: start, frequency: 130.81, endFrequency: 82.41, duration: 0.18, gain: 0.065, type: 'sine' });
  const fanfare = [523.25, 659.25, 783.99, 1046.5];
  const offsets = [0.04, 0.14, 0.24, 0.39];
  fanfare.forEach((note, index) => {
    scheduleTone(context, {
      time: start + offsets[index],
      frequency: note,
      endFrequency: note * 1.01,
      duration: index === fanfare.length - 1 ? 0.52 : 0.18,
      gain: index === fanfare.length - 1 ? 0.055 : 0.048,
      type: index === fanfare.length - 1 ? 'sine' : 'triangle',
    });
    scheduleTone(context, {
      time: start + offsets[index],
      frequency: note / 2,
      endFrequency: note / 2,
      duration: index === fanfare.length - 1 ? 0.48 : 0.16,
      gain: 0.018,
      type: 'sine',
    });
  });
}
