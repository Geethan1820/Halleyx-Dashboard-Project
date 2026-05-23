import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
}

/** Catches render errors so the app shows a recovery UI instead of a blank page */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-gray-50 text-gray-800 min-h-[320px]">
          <p className="text-lg font-semibold">{this.props.title ?? 'Something went wrong'}</p>
          <p className="text-sm text-gray-500 text-center max-w-md">
            The page hit an error while rendering. Reload to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
