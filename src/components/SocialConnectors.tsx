
import { Instagram, Twitter, Music, Youtube, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

const SocialConnectors = () => {
  const [connectedServices, setConnectedServices] = useState<string[]>([]);

  const handleConnect = (service: string) => {
    if (connectedServices.includes(service)) {
      setConnectedServices(connectedServices.filter(s => s !== service));
      toast({
        title: "Service Disconnected",
        description: `${service} has been disconnected successfully.`,
      });
    } else {
      // This would typically open an OAuth flow or connection dialog
      // For now, we'll just simulate connecting
      setConnectedServices([...connectedServices, service]);
      toast({
        title: "Service Connected",
        description: `${service} has been connected successfully.`,
      });
    }
  };

  const isConnected = (service: string) => connectedServices.includes(service);

  const services = [
    { name: "Instagram", icon: Instagram, color: "bg-pink-500" },
    { name: "X", icon: Twitter, color: "bg-black" },
    { name: "WhatsApp", icon: MessageCircle, color: "bg-green-500" },
    { name: "YouTube", icon: Youtube, color: "bg-red-500" },
    { name: "Spotify", icon: Music, color: "bg-green-600" },
    { name: "Calls", icon: Phone, color: "bg-blue-500" },
  ];

  return (
    <div className="w-full">
      <h3 className="font-semibold text-lg mb-4">Connect Your Services</h3>
      <div className="grid grid-cols-3 gap-3">
        {services.map((service) => (
          <button
            key={service.name}
            onClick={() => handleConnect(service.name)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300 ${
              isConnected(service.name)
                ? `${service.color} text-white`
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <service.icon className="h-6 w-6 mb-2" />
            <span className="text-xs font-medium">{service.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SocialConnectors;
