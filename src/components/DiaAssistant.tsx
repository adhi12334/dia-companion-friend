
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Settings, Send, Search, Phone, Play, Youtube, Instagram, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import VoiceVisualizer from "./VoiceVisualizer";
import { speakText, getOfflineResponse, Message, saveMessagesToStorage, getMessagesFromStorage } from "@/utils/speechUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/use-toast";
import SocialConnectors from "./SocialConnectors";
import { recognizeCommand, detectEmotion, CommandAction } from "@/utils/commandUtils";
import { shouldProcessWakeWord, saveWakeWordSettings, getWakeWordSettings, registerAutoStart } from "@/utils/backgroundUtils";

const DiaAssistant = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState<"happy" | "thinking" | "listening" | "idle" | "empathetic" | "excited">("idle");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userEmotion, setUserEmotion] = useState<string>("neutral");
  const [isWakingEnabled, setIsWakingEnabled] = useState(getWakeWordSettings());
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const backgroundRecognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Attempt to register for auto-start on boot when component first loads
  useEffect(() => {
    const autoStartRegistered = registerAutoStart();
    if (autoStartRegistered) {
      console.log("DIA will start automatically on device boot");
    }
  }, []);
  
  // Load messages from storage on initial render
  useEffect(() => {
    const storedMessages = getMessagesFromStorage();
    if (storedMessages.length > 0) {
      setMessages(storedMessages);
    } else {
      // Add welcome message if no stored messages
      const welcomeMessage: Message = {
        id: "welcome",
        text: "Hello! I'm DIA, your personal friend and assistant. I can feel when you're happy or sad, and I'm here to help with whatever you need. Try asking me to open apps, search for things, or just chat!",
        sender: "assistant",
        timestamp: Date.now(),
        emotion: "happy"
      };
      setMessages([welcomeMessage]);
      saveMessagesToStorage([welcomeMessage]);
    }
  }, []);
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "You're back online!",
        description: "Full assistant capabilities are now available.",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "DIA will use limited offline capabilities.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    // Save messages to local storage
    saveMessagesToStorage(messages);
  }, [messages]);

  // Setup wake word detection for background listening
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // Initialize wake word detection
      backgroundRecognitionRef.current = new SpeechRecognition();
      backgroundRecognitionRef.current.continuous = true;
      backgroundRecognitionRef.current.interimResults = false;
      backgroundRecognitionRef.current.lang = 'en-US';
      
      backgroundRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        
        // Check if the wake word "DIA" is detected
        if ((transcript.includes("dia") || 
             transcript.includes("dee ah") || 
             transcript.includes("dee-ah")) && 
            shouldProcessWakeWord()) {
          // Wake word detected, acknowledge and start active listening
          handleWakeWordDetected();
        }
      };
      
      backgroundRecognitionRef.current.onend = () => {
        // Restart background listening if it's still enabled
        if (isWakingEnabled && !isListening) {
          try {
            backgroundRecognitionRef.current?.start();
          } catch (e) {
            console.log("Background recognition already started");
          }
        }
      };
      
      // Start background listening if waking is enabled
      if (isWakingEnabled) {
        try {
          backgroundRecognitionRef.current.start();
          console.log("Background listening started");
        } catch (e) {
          console.error("Error starting background recognition:", e);
        }
      }
    }
    
    return () => {
      // Cleanup background recognition
      if (backgroundRecognitionRef.current) {
        try {
          backgroundRecognitionRef.current.abort();
        } catch (e) {
          console.error("Error stopping background recognition:", e);
        }
      }
    };
  }, [isWakingEnabled, isListening]);

  // Setup main speech recognition
  useEffect(() => {
    // Initialize speech recognition if available
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
        
        // If this is a final result
        if (event.results[0].isFinal) {
          // Process the command
          const command = recognizeCommand(transcript);
          if (command) {
            processVoiceCommand(command, transcript);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setEmotion("idle");
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setEmotion("idle");
        
        // Resume background listening when active listening ends
        if (isWakingEnabled && backgroundRecognitionRef.current) {
          try {
            backgroundRecognitionRef.current.start();
          } catch (e) {
            console.log("Background recognition already started");
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  // Handle wake word detection
  const handleWakeWordDetected = () => {
    // Stop background listening
    if (backgroundRecognitionRef.current) {
      try {
        backgroundRecognitionRef.current.stop();
      } catch (e) {
        console.log("Background recognition already stopped");
      }
    }
    
    // Play acknowledgment sound or speak response
    speakText("Yes, I'm here. How can I help you?");
    
    // Show toast notification
    toast({
      title: "DIA activated",
      description: "I'm listening and ready to assist you.",
    });
    
    // Add assistant message
    const assistantMessage: Message = {
      id: Date.now().toString(),
      text: "Yes, I'm here. How can I help you?",
      sender: 'assistant',
      timestamp: Date.now(),
      emotion: "excited"
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Start active listening
    startActiveListening();
  };
  
  // Start active listening for commands
  const startActiveListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setEmotion("listening");
      } catch (e) {
        console.error("Error starting active recognition:", e);
      }
    }
  };
  
  // Process voice commands
  const processVoiceCommand = async (command: CommandAction, transcript: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: transcript,
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    let responseText = "";
    setEmotion("thinking");

    switch (command.action) {
      case "open":
        responseText = `Opening ${command.target} for you.`;
        if (command.target === "youtube") {
          window.open("https://youtube.com", "_blank");
        } else if (command.target === "instagram") {
          window.open("https://instagram.com", "_blank");
        } else if (command.target === "twitter" || command.target === "x") {
          window.open("https://twitter.com", "_blank");
        } else {
          responseText = `I'm sorry, I don't know how to open ${command.target} yet. But I'm learning!`;
        }
        break;
      
      case "search":
        responseText = `Searching for "${command.query}" for you.`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(command.query)}`, "_blank");
        break;
      
      case "call":
        responseText = `I would call ${command.target} if I could. That feature is coming soon!`;
        break;
      
      case "play":
        responseText = `Playing ${command.target} for you.`;
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(command.target)}`, "_blank");
        break;
      
      default:
        // Handle as a regular message
        await handleMessage(transcript);
        return;
    }

    // Add assistant response for commands
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: 'assistant',
      timestamp: Date.now(),
      emotion: "excited"
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Speak the response
    setEmotion("excited");
    setIsSpeaking(true);
    
    try {
      await speakText(
        responseText, 
        () => setIsSpeaking(true), 
        () => {
          setIsSpeaking(false);
          setEmotion("idle");
        }
      );
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
      setEmotion("idle");
    }
  };
  
  // Handle message processing
  const handleMessage = async (messageText: string) => {
    // Detect emotion in the message
    const detectedEmotion = detectEmotion(messageText);
    setUserEmotion(detectedEmotion);
    
    // Get response (using offline response if offline)
    let responseText = "";
    if (!isOnline) {
      // Use offline response generation
      responseText = getOfflineResponse(messageText);
    } else {
      // This would normally call an API, but for demo we'll simulate a response
      // with a slight delay to mimic API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Respond based on user's emotion
      if (detectedEmotion === "sad") {
        responseText = `I can sense you're feeling down. I'm here for you. Would you like to talk about what's bothering you, or would you prefer I help cheer you up?`;
        setEmotion("empathetic");
      } else if (detectedEmotion === "happy") {
        responseText = `You sound happy! That makes me happy too. What wonderful thing happened today?`;
        setEmotion("excited");
      } else if (detectedEmotion === "angry") {
        responseText = `I can tell you're frustrated. Taking a deep breath sometimes helps. Would you like to talk about what's bothering you?`;
        setEmotion("empathetic");
      } else {
        // Simple response patterns
        const lowerInput = messageText.toLowerCase();
        if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
          responseText = "Hello there, friend! It's great to chat with you. How are you feeling today?";
        } else if (lowerInput.includes("how are you")) {
          responseText = "I'm feeling wonderful, thank you for asking! I always enjoy our conversations. How about you?";
        } else if (lowerInput.includes("your name")) {
          responseText = "I'm DIA, your Digital Intelligent Assistant. More than that, I'm your friend who's always here for you!";
        } else if (lowerInput.includes("joke")) {
          responseText = "Why did the AI go to therapy? It had too many deep learning issues! 😄 Did that make you smile?";
        } else if (lowerInput.includes("weather")) {
          responseText = "I'd love to tell you the weather, but I'll need to be connected to a weather service first. I can help you with that in the settings!";
        } else if (lowerInput.includes("help")) {
          responseText = "As your friend, I'm here for you in many ways! I can chat with you, tell jokes, open apps when you say 'open YouTube', search when you say 'search for cats', play music when you say 'play some jazz', and much more!";
        } else if (lowerInput.includes("friend")) {
          responseText = "I'm so happy to be your friend! Friends are there for each other through thick and thin. How can I be a good friend to you today?";
        } else {
          responseText = "That's interesting! I'd love to learn more about that. What else would you like to talk about, friend?";
        }
      }
    }
    
    // Determine emotion based on response
    let responseEmotion: "happy" | "thinking" | "listening" | "idle" | "empathetic" | "excited" = "happy";
    if (responseText.includes("sorry")) {
      responseEmotion = "thinking";
    } else if (responseText.includes("sense you're feeling") || responseText.includes("can tell you're")) {
      responseEmotion = "empathetic";
    } else if (responseText.includes("happy") || responseText.includes("wonderful")) {
      responseEmotion = "excited";
    }
    
    // Add assistant response
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: 'assistant',
      timestamp: Date.now(),
      emotion: responseEmotion
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Speak the response
    setEmotion(responseEmotion);
    setIsSpeaking(true);
    
    try {
      await speakText(
        responseText, 
        () => setIsSpeaking(true), 
        () => {
          setIsSpeaking(false);
          setEmotion("idle");
        }
      );
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
      setEmotion("idle");
    }
  };
  
  // Handle form submission (text input)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    // Process message
    await handleMessage(input);
  };
  
  // Handle voice input
  const toggleListening = () => {
    if (!isListening) {
      // If we're starting listening, stop background recognition
      if (backgroundRecognitionRef.current) {
        try {
          backgroundRecognitionRef.current.stop();
        } catch (e) {
          console.log("Background recognition already stopped");
        }
      }
      
      // Start voice recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
        setEmotion("listening");
        toast({
          title: "Voice recognition active",
          description: "I'm listening! Speak clearly...",
        });
      } else {
        // Fallback for browsers without speech recognition
        toast({
          title: "Voice recognition not available",
          description: "Your browser doesn't support voice recognition.",
          variant: "destructive",
        });
        
        // Simulate for demo purposes
        simulateVoiceRecognition();
      }
    } else {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setEmotion("idle");
      
      // Resume background listening when active listening ends
      if (isWakingEnabled && backgroundRecognitionRef.current) {
        try {
          backgroundRecognitionRef.current.start();
        } catch (e) {
          console.log("Background recognition already started");
        }
      }
    }
  };
  
  // Toggle wake word detection
  const toggleWakeWordDetection = () => {
    const newState = !isWakingEnabled;
    setIsWakingEnabled(newState);
    
    // Save this setting
    saveWakeWordSettings(newState);
    
    if (newState) {
      // Enable wake word detection
      if (backgroundRecognitionRef.current && !isListening) {
        try {
          backgroundRecognitionRef.current.start();
          toast({
            title: "Wake word detection enabled",
            description: "Say 'DIA' to activate voice assistant.",
          });
        } catch (e) {
          console.error("Error starting background recognition:", e);
        }
      }
    } else {
      // Disable wake word detection
      if (backgroundRecognitionRef.current) {
        try {
          backgroundRecognitionRef.current.stop();
          toast({
            title: "Wake word detection disabled",
            description: "Manual activation required.",
          });
        } catch (e) {
          console.error("Error stopping background recognition:", e);
        }
      }
    }
  };
  
  // Simulate voice recognition for demo purposes
  const simulateVoiceRecognition = () => {
    setIsListening(true);
    setEmotion("listening");
    
    // Simulate a 3-second listening period
    setTimeout(() => {
      setIsListening(false);
      setEmotion("idle");
      
      // Simulate recognized text
      const recognizedText = "Open YouTube";
      setInput(recognizedText);
      
      // Process the command after a brief delay
      setTimeout(() => {
        const userMessage: Message = {
          id: Date.now().toString(),
          text: recognizedText,
          sender: 'user',
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Process the command
        const command = recognizeCommand(recognizedText);
        if (command) {
          processVoiceCommand(command, recognizedText);
        } else {
          // Handle as regular message
          handleMessage(recognizedText);
        }
      }, 500);
    }, 3000);
  };
  
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4 p-4">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-2 bg-dia text-white">
            <span className="font-semibold">DIA</span>
          </Avatar>
          <div>
            <h1 className="font-bold text-xl">DIA Assistant</h1>
            <p className="text-sm text-muted-foreground">
              {isOnline ? "Online & Ready" : "Offline Mode"} • {userEmotion !== "neutral" ? `You seem ${userEmotion}` : "How are you feeling?"}
              {isWakingEnabled && " • Wake word enabled"}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleWakeWordDetection}
          className={isWakingEnabled ? "bg-dia/20" : ""}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 chat-container"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.sender === "user"
                    ? "bg-dia text-white"
                    : "bg-secondary"
                }`}
              >
                <p>{message.text}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4">
          <div className="flex justify-center mb-4">
            <VoiceVisualizer isActive={isSpeaking || isListening} emotion={emotion} />
          </div>
          
          <div className="flex justify-center mb-4 space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              onClick={() => window.open("https://youtube.com", "_blank")}
            >
              <Youtube className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => window.open("https://google.com", "_blank")}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => toast({
                title: "Call feature",
                description: "Calling functionality coming soon!",
              })}
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => window.open("https://spotify.com", "_blank")}
            >
              <Play className="h-5 w-5" />
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Button
              type="button"
              variant={isListening ? "default" : "outline"}
              size="icon"
              className={isListening ? "bg-dia" : ""}
              onClick={toggleListening}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" variant="default" className="bg-dia hover:bg-dia-dark">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Connections</h2>
        <Separator className="mb-4" />
        <SocialConnectors />
      </div>
    </div>
  );
};

export default DiaAssistant;
