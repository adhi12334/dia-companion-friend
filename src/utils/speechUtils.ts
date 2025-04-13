
// Constants for voice selection
export const DEFAULT_VOICE_LANG = 'en-US';
export const SPEECH_RATE = 1.0;
export const SPEECH_PITCH = 1.1; // Slightly higher for a more feminine voice

// Storage key for offline messages
const OFFLINE_MESSAGES_KEY = 'dia-offline-messages';

// Voice selection helper - selects a female voice if available
export const selectFemaleVoice = () => {
  return new Promise<SpeechSynthesisVoice | null>((resolve) => {
    // Wait for voices to be loaded if they're not already
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = findFemaleVoice(voices);
        resolve(femaleVoice);
      };
    } else {
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = findFemaleVoice(voices);
      resolve(femaleVoice);
    }
  });
};

// Try to find a good female voice
const findFemaleVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  // First priority: English female voices containing "female" in name
  const explicitFemaleVoice = voices.find(
    voice => voice.lang.includes('en') && voice.name.toLowerCase().includes('female')
  );
  if (explicitFemaleVoice) return explicitFemaleVoice;

  // Second priority: English voices with common female name patterns
  const femaleNamedVoices = voices.filter(
    voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('Samantha') || 
       voice.name.includes('Karen') || 
       voice.name.includes('Alice') || 
       voice.name.includes('Victoria') ||
       voice.name.includes('Fiona'))
  );
  if (femaleNamedVoices.length > 0) return femaleNamedVoices[0];

  // Third priority: Any English voice
  const englishVoice = voices.find(voice => voice.lang.includes('en'));
  if (englishVoice) return englishVoice;

  // If nothing found, return null (will use default)
  return null;
};

// Text-to-speech function
export const speakText = async (text: string, onStart?: () => void, onEnd?: () => void) => {
  // Don't speak empty text
  if (!text.trim()) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to get a female voice
  const femaleVoice = await selectFemaleVoice();
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }
  
  // Set speech properties
  utterance.rate = SPEECH_RATE;
  utterance.pitch = SPEECH_PITCH;
  
  // Set callbacks
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
  
  return utterance;
};

// Mock responses for offline mode
export const getOfflineResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  
  // Simple pattern matching for common questions
  if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
    return "Hello! I'm DIA, your digital companion. I'm here offline, but I can still chat with you!";
  }
  
  if (lowerInput.includes('how are you')) {
    return "I'm doing well, thank you for asking! Even in offline mode, I'm happy to be here with you.";
  }
  
  if (lowerInput.includes('name')) {
    return "I'm DIA, your Digital Intelligent Assistant. I'm designed to be your helpful companion!";
  }
  
  if (lowerInput.includes('weather')) {
    return "I'm sorry, I can't check the weather while offline. We'll need to wait until we have an internet connection.";
  }
  
  if (lowerInput.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }
  
  if (lowerInput.includes('joke')) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "What did the ocean say to the beach? Nothing, it just waved!",
      "Why did the scarecrow win an award? Because he was outstanding in his field!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  // Default response
  return "I'm currently in offline mode, so my responses are limited. But I'm still here to keep you company!";
};

// Interface for message storage
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: number;
  emotion?: string;
}

// Save messages for offline access
export const saveMessagesToStorage = (messages: Message[]) => {
  try {
    localStorage.setItem(OFFLINE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages to storage:', error);
  }
};

// Retrieve messages from storage
export const getMessagesFromStorage = (): Message[] => {
  try {
    const storedMessages = localStorage.getItem(OFFLINE_MESSAGES_KEY);
    return storedMessages ? JSON.parse(storedMessages) : [];
  } catch (error) {
    console.error('Failed to get messages from storage:', error);
    return [];
  }
};
