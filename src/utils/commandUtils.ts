
// Types for command actions
export type CommandAction = {
  action: 'open' | 'search' | 'call' | 'play' | 'none';
  target?: string;
  query?: string;
};

// Recognize commands from speech input
export const recognizeCommand = (text: string): CommandAction | null => {
  const lowerText = text.toLowerCase();
  
  // Check for open commands
  if (lowerText.includes('open ')) {
    const matches = lowerText.match(/open\s+([a-z0-9\s]+)/i);
    if (matches && matches[1]) {
      const target = matches[1].trim();
      return { action: 'open', target };
    }
  }
  
  // Check for search commands
  if (lowerText.includes('search for ') || lowerText.includes('search ')) {
    const matches = lowerText.match(/search(?:\s+for)?\s+([a-z0-9\s]+)/i);
    if (matches && matches[1]) {
      const query = matches[1].trim();
      return { action: 'search', query };
    }
  }
  
  // Check for call commands
  if (lowerText.includes('call ')) {
    const matches = lowerText.match(/call\s+([a-z0-9\s]+)/i);
    if (matches && matches[1]) {
      const target = matches[1].trim();
      return { action: 'call', target };
    }
  }
  
  // Check for play commands
  if (lowerText.includes('play ')) {
    const matches = lowerText.match(/play\s+([a-z0-9\s]+)/i);
    if (matches && matches[1]) {
      const target = matches[1].trim();
      return { action: 'play', target };
    }
  }
  
  // No command recognized
  return null;
};

// Emotion detection in text
export const detectEmotion = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  // Happy emotions
  if (
    lowerText.includes('happy') || 
    lowerText.includes('great') || 
    lowerText.includes('awesome') || 
    lowerText.includes('wonderful') || 
    lowerText.includes('excited') || 
    lowerText.includes('joy') || 
    lowerText.includes('love') || 
    lowerText.includes('glad') ||
    lowerText.includes(':)') ||
    lowerText.includes('😊') ||
    lowerText.includes('😃')
  ) {
    return 'happy';
  }
  
  // Sad emotions
  if (
    lowerText.includes('sad') || 
    lowerText.includes('unhappy') || 
    lowerText.includes('depressed') || 
    lowerText.includes('miserable') || 
    lowerText.includes('upset') || 
    lowerText.includes('down') || 
    lowerText.includes('blue') || 
    lowerText.includes('cry') ||
    lowerText.includes(':(') ||
    lowerText.includes('😢') ||
    lowerText.includes('😭')
  ) {
    return 'sad';
  }
  
  // Angry emotions
  if (
    lowerText.includes('angry') || 
    lowerText.includes('mad') || 
    lowerText.includes('frustrated') || 
    lowerText.includes('annoyed') || 
    lowerText.includes('irritated') ||
    lowerText.includes('furious') ||
    lowerText.includes('😡') ||
    lowerText.includes('🤬')
  ) {
    return 'angry';
  }
  
  // Default to neutral
  return 'neutral';
};
