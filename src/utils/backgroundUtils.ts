// This utility helps DIA run in the background and respond to wake word

// Store the last time the wake word was detected
let lastWakeTime = 0;
const DEBOUNCE_TIME = 3000; // Prevent multiple activations within 3 seconds

// Check if this is a mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if this is specifically an Android device
export const isAndroidDevice = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

// Register the app to start on device boot (this is conceptual, actual implementation 
// requires native capabilities through Capacitor or similar)
export const registerAutoStart = (): boolean => {
  // This is a conceptual function - in a real implementation, this would
  // interface with native APIs through Capacitor or similar frameworks
  console.log("Auto-start on boot requested");
  
  if (isMobileDevice()) {
    // In a real implementation with Capacitor, we would register with the OS here
    // For a production app, you would need a Capacitor plugin for autostart
    // such as capacitor-autostart or similar
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

// Request microphone permission for Android
export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
    console.error('Media devices API not available');
    return false;
  }

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.error('Failed to get microphone permission:', error);
    return false;
  }
};

// Keep device awake (would require a Capacitor plugin in production)
export const keepDeviceAwake = (): void => {
  // In a real implementation, we would use a Capacitor plugin like 
  // capacitor-keep-awake to prevent the device from sleeping
  console.log("Keeping device awake requested");
};
