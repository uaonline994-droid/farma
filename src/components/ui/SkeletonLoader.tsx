import React from "react";

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-4 max-w-xl mx-auto w-full animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-24 bg-emerald-900/40 rounded-3xl border border-emerald-800/40" />

      {/* Main Plot Skeleton */}
      <div className="h-56 bg-emerald-900/30 rounded-3xl border border-emerald-800/40 flex flex-col p-4 justify-between">
        <div className="flex justify-between items-center">
          <div className="h-6 w-36 bg-emerald-800/60 rounded-xl" />
          <div className="h-6 w-20 bg-emerald-800/60 rounded-full" />
        </div>
        <div className="h-28 w-28 bg-emerald-800/40 rounded-full mx-auto" />
        <div className="h-10 bg-emerald-800/60 rounded-2xl" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 bg-emerald-900/30 rounded-3xl border border-emerald-800/40" />
        <div className="h-32 bg-emerald-900/30 rounded-3xl border border-emerald-800/40" />
      </div>
    </div>
  );
};
