'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-error-500 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-neutral-600 mb-4">نعمل على حل المشكلة. يرجى المحاولة مرة أخرى.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="btn-primary btn-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
