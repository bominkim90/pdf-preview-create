import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <h1 className="error-boundary-title">화면을 불러오지 못했습니다</h1>
            <p className="error-boundary-message">
              {error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="error-boundary-actions">
              <button type="button" className="error-boundary-btn" onClick={this.handleRetry}>
                다시 시도
              </button>
              <button
                type="button"
                className="error-boundary-btn error-boundary-btn--secondary"
                onClick={() => window.location.reload()}
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
