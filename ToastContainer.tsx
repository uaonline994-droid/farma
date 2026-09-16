import React from "react";
import { useGameStore } from "../../store/gameStore";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useGameStore();

  return (
    <div className="fixed top-24 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-4 gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgColor = "bg-amber-950/95 border-amber-500/80 text-amber-100";
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;

          if (toast.type === "warning") {
            bgColor = "bg-red-950/95 border-red-500/80 text-red-100";
            icon = <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
          } else if (toast.type === "level_up") {
            bgColor = "bg-gradient-to-r from-amber-900 to-yellow-900 border-yellow-400 text-yellow-100";
            icon = <Sparkles className="w-5 h-5 text-yellow-300 animate-spin-slow shrink-0" />;
          } else if (toast.type === "info") {
            bgColor = "bg-blue-950/95 border-blue-500/80 text-blue-100";
            icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.85 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`pointer-events-auto max-w-sm w-full backdrop-blur-md rounded-2xl border-2 px-3.5 py-2.5 shadow-2xl flex items-center justify-between gap-2.5 ${bgColor}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {icon}
                <span className="text-xs font-semibold font-['Nunito'] tracking-wide break-words">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-amber-200/60 hover:text-amber-100 p-1 rounded-lg shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
