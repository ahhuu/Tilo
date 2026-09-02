import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-slate-900 text-white p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 mb-2">应用界面遇到轻微异常</h2>
            <p className="text-xs text-slate-400 mb-4 break-words font-mono bg-slate-950/60 p-3 rounded-lg w-full max-h-32 overflow-auto text-left">
              {this.state.error?.message || '未知渲染错误'}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新加载界面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
