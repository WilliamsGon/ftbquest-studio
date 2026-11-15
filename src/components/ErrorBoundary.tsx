import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', background: '#1e1e2e', color: '#f38ba8', border: '2px solid #f38ba8', borderRadius: '12px', margin: '40px', fontFamily: 'monospace', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <h2 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#f38ba8' }}>⚠️ Error en el Editor</h2>
          <p style={{ fontWeight: 'bold', color: '#cdd6f4', fontSize: '1rem', marginBottom: '15px' }}>{this.state.error?.toString()}</p>
          <pre style={{ background: '#11111b', padding: '15px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', color: '#a6adc8', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack}
          </pre>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '20px', background: '#f38ba8', color: '#11111b', fontWeight: 'bold', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }} 
            onClick={() => window.location.reload()}
          >
            Recargar Aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
