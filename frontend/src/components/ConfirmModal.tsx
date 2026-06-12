import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmLabel = 'Confirmar', 
  cancelLabel = 'Cancelar', 
  onConfirm, 
  onCancel,
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantColor = () => {
    switch (variant) {
      case 'danger': return 'var(--accent)';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return 'var(--accent)';
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      padding: 20,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @media (max-width: 480px) {
          .confirm-modal-content {
            padding: 20px !important;
            border-radius: 20px !important;
          }
          .confirm-modal-buttons {
            flex-direction: column-reverse !important;
            gap: 10px !important;
          }
          .confirm-modal-buttons button {
            width: 100% !important;
            flex: none !important;
            padding: 12px !important;
          }
        }
      `}</style>
      
      <div className="confirm-modal-content" style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 24,
        padding: 30,
        width: '100%',
        maxWidth: 450,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}>
        <button 
          onClick={onCancel}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 5 }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 25 }}>
          <div style={{ 
            width: 60, height: 60, borderRadius: 20, 
            background: `${getVariantColor()}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: getVariantColor(),
            margin: '0 auto 20px'
          }}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>{title}</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {message}
          </p>
        </div>

        <div className="confirm-modal-buttons" style={{ display: 'flex', gap: 15 }}>
          <button 
            onClick={onCancel}
            style={{ 
              flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--glass-border)',
              background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            style={{ 
              flex: 1, padding: '14px', borderRadius: 12, border: 'none',
              background: getVariantColor(), color: 'white', fontWeight: 700,
              cursor: 'pointer', boxShadow: `0 10px 20px ${getVariantColor()}30`,
              transition: 'all 0.2s'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
