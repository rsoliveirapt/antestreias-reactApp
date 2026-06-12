import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function InputModal({ 
  isOpen, 
  title, 
  placeholder,
  confirmLabel = 'Procurar', 
  cancelLabel = 'Cancelar', 
  onConfirm, 
  onCancel
}: InputModalProps) {
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
      setValue('');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      padding: 20
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: 450,
        padding: 30,
        position: 'relative'
      }}>
        <button 
          onClick={onCancel}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 25 }}>
          <div style={{ 
            width: 60, height: 60, borderRadius: 20, 
            background: 'rgba(229,9,20,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
            margin: '0 auto 20px'
          }}>
            <Search size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>{title}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <input 
              autoFocus
              className="form-input"
              placeholder={placeholder}
              value={value}
              onChange={e => setValue(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 15 }}>
            <button 
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              {cancelLabel}
            </button>
            <button 
              type="submit"
              className="btn-primary"
              style={{ flex: 1 }}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
