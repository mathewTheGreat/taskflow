import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[UI ErrorBoundary] Caught error', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-tertiary flex items-center justify-center p-6">
          <div className="max-w-xl bg-surface rounded-3xl border border-border-strong shadow-xl p-8 text-center">
            <h1 className="text-2xl font-semibold text-text-primary mb-3">Oops! Something went wrong.</h1>
            <p className="text-sm text-text-secondary mb-6">We hit an unexpected issue while loading the app. Please try refreshing or come back in a moment.</p>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
              onClick={this.handleRetry}
            >
              Refresh app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
