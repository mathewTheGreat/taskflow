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
        <div className="error-boundary">
          <div className="error-boundary__card">
            <h1 className="error-boundary__title">Oops! Something went wrong.</h1>
            <p className="error-boundary__text">We hit an unexpected issue while loading the app. Please try refreshing or come back in a moment.</p>
            <button type="button" className="error-boundary__btn" onClick={this.handleRetry}>
              Refresh app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
