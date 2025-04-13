
import { useEffect, useState } from 'react';

interface VoiceVisualizerProps {
  isActive: boolean;
  emotion?: 'happy' | 'thinking' | 'listening' | 'idle';
}

const VoiceVisualizer = ({ isActive, emotion = 'idle' }: VoiceVisualizerProps) => {
  const [visualizerBars, setVisualizerBars] = useState<number[]>([]);
  
  useEffect(() => {
    // Generate random bars for our voice visualizer
    const generateBars = () => {
      const barCount = 5;
      if (isActive) {
        // When active, have dynamic heights
        return Array.from({ length: barCount }, () => 
          Math.floor(Math.random() * 70) + 30
        );
      } else {
        // When inactive, all bars at a low height
        return Array.from({ length: barCount }, () => 20);
      }
    };
    
    // Update bars on a regular interval when active
    const interval = setInterval(() => {
      if (isActive) {
        setVisualizerBars(generateBars());
      } else if (visualizerBars.some(height => height !== 20)) {
        // Reset to idle state if not already
        setVisualizerBars(generateBars());
      }
    }, 150);
    
    // Initialize bars
    setVisualizerBars(generateBars());
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  // Different animations and colors based on emotion
  const getEmotionStyles = () => {
    switch(emotion) {
      case 'happy':
        return 'bg-green-400';
      case 'thinking':
        return 'bg-amber-400';
      case 'listening':
        return 'bg-dia animate-pulse-soft';
      default:
        return 'bg-dia';
    }
  };
  
  return (
    <div className="flex items-end justify-center space-x-1 h-16 w-32">
      {visualizerBars.map((height, index) => (
        <div 
          key={index}
          className={`rounded-full w-3 transition-all duration-150 ${getEmotionStyles()}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
