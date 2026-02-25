import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [pendingRecipient, setPendingRecipient] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async (autoSelectRecipientId?: string) => {
    try {
      const data = await api<Conversation[]>("/messages/conversations");
      setConversations(data);

      const targetId = autoSelectRecipientId ?? searchParams.get("recipientId");
      const targetName = searchParams.get("recipientName") ?? "";

      if (targetId) {
        const existing = data.find((c) => c.otherUserId === targetId);
        if (existing) {
          setSelectedConv(existing.id);
          setPendingRecipient(null);
        } else {
          setPendingRecipient({ id: targetId, name: decodeURIComponent(targetName) });
          setSelectedConv(null);
        }
        // Clear params from URL without navigation
        setSearchParams({}, { replace: true });
      } else if (data.length > 0 && !selectedConv) {
        setSelectedConv(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv);
    }
  }, [selectedConv]);

  const fetchMessages = async (convId: string) => {
    try {
      const data = await api<Message[]>(`/messages/conversations/${convId}`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      if (pendingRecipient) {
        // First message — creates the conversation
        const result = await api<{ conversationId: string }>("/messages", {
          method: "POST",
          body: { recipientId: pendingRecipient.id, body: newMessage }
        });
        setNewMessage("");
        setPendingRecipient(null);
        await fetchConversations(pendingRecipient.id);
        setSelectedConv(result.conversationId);
        return;
      }

      if (!selectedConv) return;
      const conv = conversations.find((c) => c.id === selectedConv);
      if (!conv) return;

      await api("/messages", {
        method: "POST",
        body: { recipientId: conv.otherUserId, body: newMessage }
      });
      setNewMessage("");
      fetchMessages(selectedConv);
    } catch (err) {
      toast({ title: "Failed to send message", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-8">Messages</h1>

          <div className="grid lg:grid-cols-4 gap-6 lg:h-[600px]">
            {/* Conversations List */}
            <Card className={`lg:col-span-1 lg:overflow-y-auto ${mobileView === "thread" ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
              <CardHeader>
                <CardTitle className="text-sm">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {conversations.length === 0 && !pendingRecipient ? (
                  <p className="text-muted-foreground text-sm p-4">No conversations yet</p>
                ) : (
                  <div className="divide-y">
                    {pendingRecipient && (
                      <button
                        onClick={() => { setSelectedConv(null); setMobileView("thread"); }}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          !selectedConv ? "bg-muted" : ""
                        }`}
                      >
                        <p className="font-medium">{pendingRecipient.name}</p>
                        <p className="text-xs text-muted-foreground">New conversation</p>
                      </button>
                    )}
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => { setSelectedConv(conv.id); setPendingRecipient(null); setMobileView("thread"); }}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedConv === conv.id ? "bg-muted" : ""
                        }`}
                      >
                        <p className="font-medium">{conv.otherUserName}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className={`lg:col-span-3 flex flex-col ${mobileView === "list" ? "hidden lg:flex" : "h-[calc(100vh-180px)] lg:h-auto"}`}>
              <CardHeader className="border-b flex flex-row items-center gap-2 py-3 px-4">
                <button
                  className="lg:hidden shrink-0 p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileView("list")}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <CardTitle className="text-sm">
                  {selectedConv
                    ? conversations.find((c) => c.id === selectedConv)?.otherUserName
                    : pendingRecipient
                    ? pendingRecipient.name
                    : "Select a conversation"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.senderId === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.body}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {(selectedConv || pendingRecipient) && (
                  <div className="border-t p-4 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Messages;
