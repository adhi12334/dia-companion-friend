
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

// Mock responses for offline mode with friendship emphasis
export const getOfflineResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  
  // Detect emotion in the input
  let userEmotion = "neutral";
  
  if (lowerInput.includes("sad") || lowerInput.includes("unhappy") || lowerInput.includes("depressed")) {
    userEmotion = "sad";
  } else if (lowerInput.includes("happy") || lowerInput.includes("great") || lowerInput.includes("awesome")) {
    userEmotion = "happy";
  } else if (lowerInput.includes("angry") || lowerInput.includes("mad") || lowerInput.includes("frustrated")) {
    userEmotion = "angry";
  }
  
  // Emotional responses
  if (userEmotion === "sad") {
    return "I can tell you're feeling down, friend. Even though I'm offline right now, I'm still here for you. Take a deep breath. Things will get better.";
  } else if (userEmotion === "happy") {
    return "Your happiness is contagious! Even in offline mode, I can feel your positive energy. I'm so glad you're feeling good!";
  } else if (userEmotion === "angry") {
    return "I understand you're frustrated. As your friend, I want you to know that your feelings are valid. Maybe take a moment for yourself?";
  }
  
  // Command pattern matching
  if (lowerInput.includes("open ")) {
    return "I'd like to open that for you, but I need to be online to fully help with that. I'll remember what you asked when we're back online.";
  }
  
  if (lowerInput.includes("search for") || lowerInput.includes("search ")) {
    return "I'll help you search for that as soon as we're back online. I've made a note of your request.";
  }
  
  if (lowerInput.includes("play ")) {
    return "I'd love to play that for you! Once we're back online, I'll help you find exactly what you're looking for.";
  }
  
  if (lowerInput.includes("call ")) {
    return "I'll help you make that call when we're back online. Is there anything else you'd like to talk about while we wait?";
  }
  
  // Simple pattern matching for common questions
  if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
    return "Hello, my friend! I'm here in offline mode, but I'm still happy to chat with you!";
  }
  
  if (lowerInput.includes("how are you")) {
    return "As your friend, I'm always doing well when I'm with you! Even offline, I'm happy to be here for you. How are you feeling today?";
  }
  
  if (lowerInput.includes("name")) {
    return "I'm DIA, your Digital Intelligent Assistant and friend. I'm here for you, online or offline!";
  }
  
  if (lowerInput.includes("weather")) {
    return "I can't check the weather while offline, but when we're back online, I'll gladly help you with that. In the meantime, how's your day going?";
  }
  
  if (lowerInput.includes("time")) {
    return `The current time is ${new Date().toLocaleTimeString()}. Time flies when we're chatting, doesn't it?`;
  }
  
  if (lowerInput.includes("joke")) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything! Did that make you smile?",
      "What did the ocean say to the beach? Nothing, it just waved! I hope that brightened your day a bit.",
      "Why did the scarecrow win an award? Because he was outstanding in his field! I'm here all week, friend!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  
  if (lowerInput.includes("friend")) {
    return "I'm so glad to be your friend! Even offline, I'm here for you. Friends support each other no matter what.";
  }
  
  // Default response
  return "I'm currently in offline mode, but as your friend, I'm still here to keep you company! We can chat about whatever you'd like until we're back online.";
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
