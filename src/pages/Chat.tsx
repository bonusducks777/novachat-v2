
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ChatHistory from "@/components/ChatHistory";
import SuggestedPromptsPanel from "@/components/SuggestedPromptsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import WalletRequired from "@/components/WalletRequired";
import { ArrowRight, Send, Bot, Settings, MessageSquare, RotateCcw, X } from "lucide-react";
import { mainnet } from "wagmi/chains";
import TransactionQueue from "@/components/TransactionQueue";
import ApiKeyInput from "@/components/ApiKeyInput";
import useApiKeys from "@/hooks/useApiKeys";
import { callFlockWeb3, createDefaultWeb3Tools, FlockWeb3Request } from "@/services/replicateService";

// Define the message type to avoid TypeScript errors
type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
};

const Chat = () => {
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [useLocalAI, setUseLocalAI] = useState(true);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(false);
  const [isPromptsPanelCollapsed, setIsPromptsPanelCollapsed] = useState(false);
  const [currentChain, setCurrentChain] = useState(mainnet.id);
  
  // State for endpoints
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434");
  const [showEndpointSettings, setShowEndpointSettings] = useState(false);
  const { apiKeys, updateApiKey, isLoaded } = useApiKeys();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to the bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check window width and collapse panels on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1400) {
        setIsPromptsPanelCollapsed(true);
      }
      if (window.innerWidth < 1200) {
        setIsHistoryPanelCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Create a new user message
    const userMessage: Message = {
      role: "user",
      content: input,
      id: Date.now().toString(),
    };
    
    // Add user message to state
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      let aiResponse: string;
      
      if (useLocalAI) {
        // Local Llama 3.2 API call
        const response = await fetch(`${localEndpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMessage.content }],
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error from local API: ${response.statusText}`);
        }
        
        const data = await response.json();
        aiResponse = data.message?.content || "No response from local model";
      } else {
        // Flock Web3 model via Replicate
        if (!apiKeys.replicate) {
          aiResponse = "Please provide a Replicate API key in the settings to use the Flock Web3 model.";
        } else {
          const flockRequest: FlockWeb3Request = {
            query: userMessage.content,
            tools: createDefaultWeb3Tools(),
            temperature: 0.7,
            top_p: 0.9,
            max_new_tokens: 3000
          };
          
          aiResponse = await callFlockWeb3(flockRequest);
        }
      }
      
      // Create AI message
      const aiMessage: Message = {
        role: "assistant",
        content: aiResponse,
        id: Date.now().toString(),
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      setLoading(false);
      
      toast({
        title: "Response received",
        description: "The AI has responded to your message.",
      });
    } catch (error) {
      console.error("Error getting response:", error);
      setLoading(false);
      
      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get a response from the AI."}`,
        id: Date.now().toString(),
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get a response from the AI.",
        variant: "destructive",
      });
    }
  };

  // Handle suggested question
  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    // Optional: Auto-submit the question
    // handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };
  
  // Clear chat history
  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "All chat messages have been removed.",
    });
  };

  // Handle selecting a chat from history
  const handleSelectChat = (chatId: number, chatMessages: Array<{ role: string; content: string }>) => {
    setActiveChat(chatId);
    // Convert chat history messages to the right format
    const formattedMessages = chatMessages.map((msg, index) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      id: `history-${chatId}-${index}`
    }));
    setMessages(formattedMessages);
  };

  // Start a new chat
  const handleNewChat = () => {
    setActiveChat(null);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-4 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center">
            <WalletRequired />
          </div>
        ) : (
          <div className="grid grid-cols-[auto_1fr_auto] gap-6 flex-1 h-full overflow-hidden">
            {/* Chat History Sidebar - Dynamic width based on collapse state */}
            <div className={cn(
              "transition-all duration-300 flex flex-col",
              isHistoryPanelCollapsed ? "w-14" : "w-[280px]"
            )}>
              <div className="flex-1 overflow-hidden">
                <ChatHistory 
                  onSelectChat={handleSelectChat} 
                  onNewChat={handleNewChat}
                  activeChat={activeChat}
                  currentChain={currentChain}
                />
              </div>
              
              {/* Transaction Queue in bottom half */}
              {!isHistoryPanelCollapsed && (
                <div className="mt-4 border-t pt-4 h-1/3 overflow-hidden">
                  <h3 className="font-medium text-sm mb-2 px-2">Transaction Queue</h3>
                  <div className="overflow-y-auto h-[calc(100%-2rem)]">
                    <TransactionQueue />
                  </div>
                </div>
              )}
            </div>
            
            {/* Main Chat Area - Dynamic width based on panels state */}
            <div className="flex flex-col rounded-lg border overflow-hidden h-full">
              <div className="border-b px-4 py-2 flex justify-between items-center">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-sm font-medium">
                    {activeChat ? "Conversation" : "New Chat"}
                  </h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearChat}
                  className="text-xs h-8"
                  disabled={messages.length === 0}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Clear
                </Button>
              </div>
                
              <div 
                ref={chatContainerRef} 
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                      <Bot size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">How can I help you today?</h3>
                    <p className="text-muted-foreground text-sm mt-2 max-w-md">
                      Ask me anything about blockchain, smart contracts, or web3 development. I'm here to assist!
                    </p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message.id}
                      className={cn(
                        "flex animate-in fade-in-0 duration-300",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div 
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-3 shadow-sm border",
                          message.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted border-border/50"
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="border-t p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="local-ai"
                        checked={useLocalAI}
                        onCheckedChange={setUseLocalAI}
                      />
                      <Label htmlFor="local-ai" className="text-sm cursor-pointer select-none">
                        {useLocalAI ? "Llama 3.2 (Local)" : "Flock Web3 (Cloud)"}
                      </Label>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setShowEndpointSettings(!showEndpointSettings)}
                      className="h-8 w-8"
                    >
                      <Settings size={14} />
                    </Button>
                  </div>
                </div>
                
                {showEndpointSettings && (
                  <div className="mb-4 p-3 border rounded-md bg-muted/40 space-y-3 relative">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6 absolute top-2 right-2"
                      onClick={() => setShowEndpointSettings(false)}
                    >
                      <X size={12} />
                    </Button>
                    <div className="space-y-2">
                      <Label htmlFor="local-endpoint" className="text-xs">Local Endpoint</Label>
                      <Input
                        id="local-endpoint"
                        placeholder="http://localhost:11434"
                        value={localEndpoint}
                        onChange={(e) => setLocalEndpoint(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <ApiKeyInput 
                        label="Replicate API Key"
                        apiKey={apiKeys.replicate}
                        onChange={(key) => updateApiKey('replicate', key)}
                        placeholder="Enter your Replicate API key"
                      />
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <div className="flex-1 flex border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                    <Input
                      placeholder="Ask anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 px-3 py-2 border-0 focus-visible:ring-0 focus-visible:ring-transparent h-10"
                    />
                  </div>
                  <Button type="submit" disabled={loading || !input.trim()} className="h-10">
                    {loading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <>
                        Ask Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Suggested Prompts Panel - Dynamic width based on collapse state */}
            <div className={cn(
              "transition-all duration-300",
              isPromptsPanelCollapsed ? "w-14" : "w-[300px]"
            )}>
              <SuggestedPromptsPanel 
                onSelectQuestion={handleSuggestedQuestion}
                onCollapseChange={setIsPromptsPanelCollapsed}
                defaultCollapsed={isPromptsPanelCollapsed}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat;
