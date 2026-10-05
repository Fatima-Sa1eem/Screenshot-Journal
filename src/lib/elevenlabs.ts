/**
 * ElevenLabs Text-to-Speech Integration
 * Handles voice summary playback for polaroid cards
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Check if ElevenLabs is configured
 */
export function isElevenLabsConfigured(): boolean {
  return !!ELEVENLABS_API_KEY;
}

/**
 * Generate audio from text using ElevenLabs API
 */
export async function generateAudioFromText(
  text: string,
  onProgress?: (state: AudioState) => void
): Promise<Blob | null> {
  if (!ELEVENLABS_API_KEY) {
    console.warn('ELEVENLABS_API_KEY not configured');
    return null;
  }

  try {
    onProgress?.({ isPlaying: false, isLoading: true, error: null });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text.slice(0, 500), // Limit to 500 chars for performance
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    onProgress?.({ isPlaying: false, isLoading: false, error: null });
    return audioBlob;
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    onProgress?.({ isPlaying: false, isLoading: false, error: 'Failed to generate audio' });
    return null;
  }
}

/**
 * Create audio URL from blob and play it
 */
export function playAudioBlob(blob: Blob): HTMLAudioElement | null {
  try {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    
    audio.play().catch((err) => {
      console.error('Audio playback error:', err);
      URL.revokeObjectURL(audioUrl);
    });
    
    return audio;
  } catch (error) {
    console.error('Audio creation error:', error);
    return null;
  }
}

/**
 * Fallback: Use Web Speech API for TTS when ElevenLabs is not available
 */
export function speakWithWebSpeech(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // Try to select a pleasant voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = () => {
      onEnd?.();
    };
    
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    console.error('Web Speech API error:', error);
    return false;
  }
}
