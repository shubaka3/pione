import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
}

const initialState: ChatState = {
  messages: [
    {
      id: '1',
      content: 'Hello! How can I help you?',
      sender: 'bot',
      timestamp: new Date().toISOString(),
    },
  ],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Omit<ChatMessage, 'id' | 'timestamp'>>) => {
      state.messages.push({
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      });
    },
    clearMessages: (state) => {
      state.messages = initialState.messages;
    },
  },
});

export const { addMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
