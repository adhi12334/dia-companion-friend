
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Settings, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import VoiceVisualizer from "./VoiceVisualizer";
import { speakText, getOfflineResponse, Message, saveMessagesToStorage, getMessagesFromStorage } from "@/utils/speechUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/use-toast";
import SocialConnectors from "./SocialConnectors";

const DiaAssistant = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState<"happy" | "thinking" | "listening" | "idle">("idle");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Load messages from storage on initial render
  useEffect(() => {
    const storedMessages = getMessagesFromStorage();
    if (storedMessages.length > 0) {
      setMessages(storedMessages);
    } else {
      // Add welcome message if no stored messages
      const welcomeMessage: Message = {
        id: "welcome",
        text: "Hello! I'm DIA, your personal assistant. How can I help you today?",
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
    
    // Set thinking emotion
    setEmotion("thinking");
    
    // Get response (using offline response if offline)
    let responseText = "";
    if (!isOnline) {
      // Use offline response generation
      responseText = getOfflineResponse(input);
    } else {
      // This would normally call an API, but for demo we'll simulate a response
      // with a slight delay to mimic API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple response patterns
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
        responseText = "Hello there! It's great to chat with you. How are you feeling today?";
      } else if (lowerInput.includes("how are you")) {
        responseText = "I'm feeling wonderful, thank you for asking! I always enjoy our conversations.";
      } else if (lowerInput.includes("your name")) {
        responseText = "I'm DIA, your Digital Intelligent Assistant. I'm here to be your friend and helper!";
      } else if (lowerInput.includes("joke")) {
        responseText = "Why did the AI go to therapy? It had too many deep learning issues! 😄";
      } else if (lowerInput.includes("weather")) {
        responseText = "I'd love to tell you the weather, but I'll need to be connected to a weather service first. I can help you with that in the settings!";
      } else if (lowerInput.includes("help")) {
        responseText = "I can chat with you, tell jokes, and be your friend! You can also connect me to various services using the social connector buttons below.";
      } else {
        responseText = "That's interesting! I'd love to learn more about that. What else would you like to talk about?";
      }
    }
    
    // Determine emotion based on response
    let responseEmotion: "happy" | "thinking" | "listening" | "idle" = "happy";
    if (responseText.includes("sorry")) {
      responseEmotion = "thinking";
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
  
  // Handle voice input (simulated for demo)
  const toggleListening = () => {
    if (!isListening) {
      // Simulate starting voice recognition
      setIsListening(true);
      setEmotion("listening");
      
      // For demo, we'll simulate a 3-second listening period
      setTimeout(() => {
        setIsListening(false);
        setEmotion("idle");
        
        // Simulate recognized text
        const recognizedText = "What can you help me with?";
        setInput(recognizedText);
        
        // Submit the form after a brief delay
        setTimeout(() => {
          const userMessage: Message = {
            id: Date.now().toString(),
            text: recognizedText,
            sender: 'user',
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          // Now trigger the assistant response
          setEmotion("thinking");
          setTimeout(() => {
            const responseText = "I can be your friend, chat with you, tell jokes, and help you stay connected with various services. What would you like to talk about?";
            
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: responseText,
              sender: 'assistant',
              timestamp: Date.now(),
              emotion: "happy"
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            setEmotion("happy");
            setIsSpeaking(true);
            
            speakText(
              responseText, 
              () => setIsSpeaking(true), 
              () => {
                setIsSpeaking(false);
                setEmotion("idle");
              }
            );
          }, 1000);
        }, 500);
      }, 3000);
    } else {
      // Stop listening
      setIsListening(false);
      setEmotion("idle");
    }
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
              {isOnline ? "Online & Ready" : "Offline Mode"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
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
