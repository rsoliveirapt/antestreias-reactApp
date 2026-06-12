import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { API_BASE } from '../config';

const reportedErrorsCache = new Map<string, number>();

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);

    const errorMessage = error.message || error.toString();
    const cacheKey = errorMessage + ':' + (error.stack || '');
    const now = Date.now();
    const lastReportedTime = reportedErrorsCache.get(cacheKey);

    // Throttle identical error reporting to once every 10 seconds client-side
    if (lastReportedTime && (now - lastReportedTime < 10000)) {
      console.warn("Duplicate error report throttled client-side:", errorMessage);
      return;
    }
    reportedErrorsCache.set(cacheKey, now);

    fetch(`${API_BASE}/report_error.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error_type: 'Frontend Error',
        message: errorMessage,
        stack_trace: error.stack || '',
        component_stack: errorInfo.componentStack || '',
        url: window.location.href,
        user_agent: navigator.userAgent
      })
    }).catch(err => {
      console.error("Failed to post error report to backend:", err);
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: 20
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: 500,
            padding: 40,
            borderRadius: 24,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              background: 'rgba(229, 9, 21, 0.15)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#e50914',
              boxShadow: '0 8px 25px rgba(229, 9, 21, 0.2)'
            }}>
              <AlertOctagon size={32} />
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Ups! Algo correu mal.</h1>
            <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.6, marginBottom: 25 }}>
              Ocorreu um erro inesperado na aplicação. Pedimos desculpa pelo incómodo.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#e57373',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: 30,
                maxHeight: 120
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--accent, #e50914)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 4px 15px rgba(229, 9, 21, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                <RefreshCw size={16} /> Recarregar Página
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              >
                <Home size={16} /> Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
