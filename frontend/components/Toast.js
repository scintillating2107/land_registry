import { useEffect } from "react";

export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => {
      onClose?.();
    }, 3500);
    return () => clearTimeout(id);
  }, [message, onClose]);

  if (!message) return null;

  const base =
    "fixed top-4 right-4 z-50 max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg border flex items-start gap-2";
  const stylesByType = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-sky-50 border-sky-200 text-sky-800",
  };

  return (
    <div className={`${base} ${stylesByType[type] || stylesByType.success}`}>
      <span className="mt-0.5 text-lg leading-none">●</span>
      <div className="flex-1">{message}</div>
      <button
        className="ml-2 text-xs text-slate-500 hover:text-slate-700"
        onClick={() => onClose?.()}
        type="button"
      >
        Close
      </button>
    </div>
  );
}
