import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChatMessageBubble } from "./ChatMessage";
import type { ChatMessage } from "../../lib/types";

interface AiResponse {
  actions: unknown[];
  message: string;
}

export function ChatPanel({
  projectId,
  contextType,
  onTasksChanged,
}: {
  projectId: number;
  contextType: string;
  onTasksChanged: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ollamaReady, setOllamaReady] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    invoke<boolean>("check_ollama_status").then(setOllamaReady);
    invoke<ChatMessage[]>("get_chat_history", { projectId }).then(setMessages);
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      project_id: projectId,
      role: "user",
      content: userMsg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await invoke<AiResponse>("send_chat_message", {
        projectId,
        content: userMsg,
        contextType,
      });

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        project_id: projectId,
        role: "assistant",
        content: response.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (response.actions.length > 0) {
        onTasksChanged();
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        project_id: projectId,
        role: "assistant",
        content: `Error: ${err}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const retryOllama = () => {
    setOllamaReady(null);
    invoke<boolean>("check_ollama_status").then(setOllamaReady);
  };

  if (ollamaReady === false) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-700">
          <h3 className="font-semibold text-sm">AI Chat</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
            !
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Ollamaに接続できません</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>1. Ollamaをインストール:</p>
              <code className="block bg-gray-800 px-2 py-1 rounded text-gray-300">
                curl -fsSL https://ollama.com/install.sh | sh
              </code>
              <p>2. モデルをダウンロード:</p>
              <code className="block bg-gray-800 px-2 py-1 rounded text-gray-300">
                ollama pull qwen2.5:7b
              </code>
              <p>3. Ollamaを起動:</p>
              <code className="block bg-gray-800 px-2 py-1 rounded text-gray-300">
                ollama serve
              </code>
            </div>
          </div>
          <button
            onClick={retryOllama}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors text-white"
          >
            再接続
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="font-semibold text-sm">AI Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-xs text-center mt-4">
            AIにタスク操作を指示できます
            <br />
            例: 「議事録作成のタスクを作って」
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="flex gap-1 items-center text-gray-400 text-xs">
            <span className="animate-pulse">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="メッセージを入力..."
            disabled={loading || ollamaReady === null}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
