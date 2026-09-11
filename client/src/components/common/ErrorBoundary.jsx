import React from 'react';

/**
 * ErrorBoundary — Section-level crash isolation.
 *
 * Requirement: Each major route section (Feed, Blood Hub, Emergency SOS, Admin)
 * must be wrapped in its own ErrorBoundary so one broken component cannot
 * blank the entire application.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary:${this.props.section || 'unknown'}]`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null, showStack: false });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { section = 'This section', error, errorInfo, showStack } = this.state;

    return (
      <div className="error-state min-h-[400px]">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center shadow-glass-sm">
          <span className="material-symbols-outlined text-[32px] text-on-error-container">
            emergency
          </span>
        </div>

        {/* Message */}
        <div>
          <h2 className="text-headline-sm font-bold text-on-surface mb-2">
            {section} encountered an error
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-[420px] mx-auto">
            {error?.message || 'An unexpected error occurred. The rest of the application is still working.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-space-sm">
          <button className="btn-primary" onClick={this.handleReset}>
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Try Again
          </button>
          <button
            className="btn-secondary text-body-sm"
            onClick={() => this.setState((s) => ({ showStack: !s.showStack }))}
          >
            {showStack ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {/* Dev-only stack trace */}
        {showStack && errorInfo && (
          <div className="w-full max-w-[600px] text-left">
            <pre className="bg-surface-container-high rounded-lg p-space-md text-body-sm text-on-surface-variant overflow-auto max-h-[200px] font-mono text-[11px] leading-relaxed">
              {error?.stack}
              {'\n\nComponent Stack:'}
              {errorInfo.componentStack}
            </pre>
          </div>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;
