import { Component, ErrorInfo, ReactNode } from 'react';
import { getLastMutation, getLastRoute, getLastRuntimeError, isDebugMode, setLastRuntimeError } from '../debug/runtimeDebug';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string;
  stack?: string;
  componentStack?: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: ''
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error.message || 'Unbekannter Fehler',
      stack: error.stack ?? undefined
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('APP_RUNTIME_ERROR', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack ?? undefined });

    setLastRuntimeError({
      message: error.message || 'Unbekannter Fehler',
      stack: error.stack ?? undefined,
      componentStack: errorInfo.componentStack ?? undefined,
      route: getLastRoute(),
      lastMutation: getLastMutation(),
      timestamp: new Date().toISOString()
    });
  }

  reload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const debugEnabled = isDebugMode();
    const storedError = getLastRuntimeError();
    const route = storedError?.route ?? getLastRoute();
    const lastMutation = storedError?.lastMutation ?? getLastMutation();

    return (
      <main className="app-shell">
        <section className="card stack-sm down-card" role="alert" aria-live="assertive">
          <h2>Ein Fehler ist aufgetreten</h2>
          <p>Die Anwendung konnte nicht korrekt gerendert werden.</p>
          <div className="inline-end">
            <button type="button" className="btn" onClick={this.reload}>Neu laden</button>
          </div>

          {debugEnabled && (
            <div className="stack-xs" style={{ marginTop: 8 }}>
              <p className="muted"><strong>Letzte Route:</strong> {route}</p>
              <p className="muted"><strong>Last action:</strong> {lastMutation ? `${lastMutation.mutation} (${lastMutation.status})` : '—'}</p>
              {lastMutation?.responseSnippet && <pre className="error-debug-pre">{lastMutation.responseSnippet}</pre>}
              <p className="muted"><strong>Fehler:</strong> {this.state.errorMessage}</p>
              {this.state.stack && <pre className="error-debug-pre">{this.state.stack}</pre>}
              {this.state.componentStack && <pre className="error-debug-pre">{this.state.componentStack}</pre>}
            </div>
          )}
        </section>
      </main>
    );
  }
}
