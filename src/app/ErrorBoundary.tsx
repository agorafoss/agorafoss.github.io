import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: string | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error.message : "ui-crash" };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("agora-ui", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 24, color: "#ede4d4", fontFamily: "IBM Plex Sans, sans-serif" }}>
        <p>A interface tropeçou. Recarrega a aba.</p>
        <pre style={{ color: "#9a8f80", whiteSpace: "pre-wrap" }}>{this.state.error}</pre>
        <button type="button" onClick={() => window.location.reload()}>
          Recarregar
        </button>
      </div>
    );
  }
}
