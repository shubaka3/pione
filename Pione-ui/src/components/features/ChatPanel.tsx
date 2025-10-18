import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Card, Button, Input } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addMessage } from '@/features/chat/chatSlice';
import type { Tree, ChatMessage } from '@/types';

interface ChatPanelProps {
  tree: Tree;
  sensorReadingsCount: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ tree, sensorReadingsCount }) => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((state) => state.chat.messages);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const message = inputValue.trim();
    if (!message) return;

    // Add user message
    dispatch(
      addMessage({
        content: message,
        sender: 'user',
      })
    );
    setInputValue('');

    // Auto-reply (mock AI)
    setTimeout(() => {
      let reply = 'Cảm ơn câu hỏi của bạn! Chức năng AI chat đang được phát triển.';

      if (message.toLowerCase().includes('sensor') || message.toLowerCase().includes('cảm biến')) {
        reply = `Cây ${tree.name} hiện có ${sensorReadingsCount} dữ liệu cảm biến. Bạn có thể xem chi tiết bằng cách nhấn vào nút "Batches".`;
      } else if (
        message.toLowerCase().includes('trạng thái') ||
        message.toLowerCase().includes('status')
      ) {
        reply = `Cây hiện đang ${
          tree.is_active ? 'hoạt động' : 'không hoạt động'
        }. Bạn có thể thay đổi trạng thái bằng các nút điều khiển.`;
      } else if (
        message.toLowerCase().includes('số lượng') ||
        message.toLowerCase().includes('bao nhiêu')
      ) {
        reply = `Hệ thống đã phát hiện ${sensorReadingsCount} điểm dữ liệu từ cảm biến của cây ${tree.name}.`;
      }

      dispatch(
        addMessage({
          content: reply,
          sender: 'bot',
        })
      );
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Card className="p-4 flex flex-col h-full">
      <h3 className="text-xl font-bold text-text-dark border-b border-sand-beige/40 pb-2 mb-4">AI Chat</h3>
      <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4 min-h-0 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`p-3 rounded-lg max-w-xs ${
                msg.sender === 'user' ? 'bg-primary-green text-cloud-white' : 'bg-bg-secondary text-text-dark'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-grow"
        />
        <Button onClick={handleSend} className="px-4 py-2">
          <Send size={20} />
        </Button>
      </div>
    </Card>
  );
};
