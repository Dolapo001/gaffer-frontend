'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional custom fallback UI. Defaults to a branded error screen. */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

/**
 * React Error Boundary that catches unhandled render / lifecycle errors.
 * Wrap sections of the app where an isolated crash should not take down
 * the entire page (e.g. a widget, a drawer, a data-heavy list).
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeDangerousComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production, forward to your error-tracking service (Sentry, etc.)
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen bg-gaffer-bg flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-3xl" role="img" aria-label="error">⚠️</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gaffer-muted text-sm font-body leading-relaxed max-w-xs">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.message && (
              <pre className="mt-3 text-left text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg p-3 overflow-auto max-w-xs">
                {this.state.message}
              </pre>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
