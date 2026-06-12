import { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
  type?: 'success' | 'error';
}

export default function Toast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const newMessage = { 
        id: Date.now(), 
        text: e.detail.text, 
        type: e.detail.type || 'success' 
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Auto-remove after 4s
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== newMessage.id));
      }, 4000);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="toast-container">
      {messages.map(m => (
        <div key={m.id} className={`toast ${m.type === 'error' ? 'toast-error' : ''}`}>
          <div className="toast-icon">
            {m.type === 'error' ? (
              <X size={14} strokeWidth={3} />
            ) : (
              <Check size={14} strokeWidth={3} />
            )}
          </div>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{m.text}</span>
          <div className="toast-close" onClick={() => removeToast(m.id)}>
            <X size={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function showToast(text: string, type: 'success' | 'error' = 'success') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { text, type } }));
}
