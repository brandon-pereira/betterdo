import { Component } from "react";
import GlobalError from "./GlobalError";

interface Props {
  children: React.ReactChild;
}
class ErrorBoundary extends Component<Props, { hasError: boolean; errorMessage?: string }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      includesStackTrace: true,
      errorMessage: error.stack
    };
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <GlobalError errorMessage={this.state.errorMessage || "Unexpected error occurred"} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
