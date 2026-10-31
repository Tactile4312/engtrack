import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui';

/** Stops an error on one screen from blanking the whole app. Saved data is not affected. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen failed to render', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="grid h-full place-items-center p-6 text-center">
        <div className="grid max-w-[400px] justify-items-center gap-3">
          <h1 className="text-[18px] font-semibold text-ink">This screen could not be shown</h1>
          <p className="text-[13.5px] text-ink-2">Your saved data is not affected. Reload the page, or open another screen from the menu if it is showing.</p>
          <Button kind="primary" onClick={() => location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }
}
