import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="border border-[#E94E2B] bg-[#FBDFD2] p-5 text-[#B13818]">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B13818]" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold">
                {this.props.fallbackTitle || "分析結果呈現時發生暫時性顯示問題"}
              </h4>
              <p className="text-xs leading-relaxed text-[#3F5147]">
                {this.props.fallbackMessage ||
                  "圖紙資料已成功辨識，但畫面在排版渲染特定欄位時遇到異常。請點擊下方按鈕重新整理；若持續發生，可將該欄位或圖紙截圖回報。"}
              </p>
              {this.state.error?.message && (
                <p className="font-mono text-[11px] text-[#8A9590]">
                  詳細資訊：{this.state.error.message}
                </p>
              )}
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 border border-[#B13818] bg-white px-3.5 py-1.5 text-xs font-bold text-[#B13818] transition-colors hover:bg-[#FDE8E8] cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> 重新整理畫面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
