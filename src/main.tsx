
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check if running in Capacitor
const isCapacitor = 'Capacitor' in window;

// Log platform info for debugging
if (isCapacitor) {
  console.log(`Running on ${window.Capacitor.getPlatform()} with Capacitor`);
} else {
  console.log('Running on web without Capacitor');
}

createRoot(document.getElementById("root")!).render(<App />);
