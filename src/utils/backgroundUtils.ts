
// This utility helps DIA run in the background and respond to wake word

// Store the last time the wake word was detected
let lastWakeTime = 0;
const DEBOUNCE_TIME = 3000; // Prevent multiple activations within 3 seconds

// Check if this is a mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Register the app to start on device boot (this is conceptual, actual implementation 
// requires native capabilities through Capacitor or similar)
export const registerAutoStart = (): boolean => {
  // This is a conceptual function - in a real implementation, this would
  // interface with native APIs through Capacitor or similar frameworks
  console.log("Auto-start on boot requested");
  
  if (isMobileDevice()) {
    // In a real implementation, we would register with the OS here
    return true;
  }
  
  return false;
};

// Check if we should process a wake word detection (debounce implementation)
export const shouldProcessWakeWord = (): boolean => {
  const now = Date.now();
  
  // If it's been less than DEBOUNCE_TIME since the last activation, ignore this one
  if (now - lastWakeTime < DEBOUNCE_TIME) {
    return false;
  }
  
  // Update the last wake time
  lastWakeTime = now;
  return true;
};

// Store the wake word detection settings in local storage
export const saveWakeWordSettings = (enabled: boolean): void => {
  try {
    localStorage.setItem('dia-wake-word-enabled', enabled.toString());
  } catch (error) {
    console.error('Failed to save wake word settings:', error);
  }
};

// Get the wake word detection settings from local storage
export const getWakeWordSettings = (): boolean => {
  try {
    const storedValue = localStorage.getItem('dia-wake-word-enabled');
    return storedValue === null ? true : storedValue === 'true';
  } catch (error) {
    console.error('Failed to get wake word settings:', error);
    return true; // Default to enabled if we can't read the setting
  }
};
