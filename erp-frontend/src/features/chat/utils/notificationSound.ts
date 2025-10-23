/**
 * Play a notification sound for incoming messages
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (must be called after user interaction)
 */
const initAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a notification "pop" sound (Facebook Messenger style)
 */
export const playNotificationSound = () => {
  try {
    const context = initAudioContext();
    if (!context) return;

    // Create oscillator and gain nodes
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Configure for a "pop" sound
    oscillator.type = 'sine';
    const now = context.currentTime;
    
    // Start at higher frequency and quickly drop (pop effect)
    oscillator.frequency.setValueAtTime(1000, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);

    // Volume envelope for "pop" effect
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); // Quick decay

    // Play
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};

/**
 * Play Facebook Messenger style message sound
 */
export const playMessageSound = () => {
  playNotificationSound();
};

