import React from "react";
import { motion } from "motion/react";

// 🐔 CHICKEN SPRITE
export const ChickenSprite: React.FC<{
  type?: "hen" | "chick" | "rooster";
  className?: string;
  isPecking?: boolean;
}> = ({ type = "hen", className = "w-16 h-16", isPecking = true }) => {
  if (type === "chick") {
    return (
      <motion.div
        animate={isPecking ? { y: [0, -3, 0], rotate: [0, 5, -5, 0] } : {}}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        className={`relative inline-block ${className}`}
      >
        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
          {/* Shadow */}
          <ellipse cx="32" cy="56" rx="16" ry="5" fill="#1b3d1f" opacity="0.4" />
          {/* Little Feet */}
          <path d="M26 50 L24 57 M26 50 L27 57 M36 50 L35 57 M36 50 L38 57" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          {/* Chick Body */}
          <ellipse cx="32" cy="38" rx="18" ry="16" fill="#fde047" />
          <ellipse cx="32" cy="38" rx="15" ry="13" fill="#facc15" />
          {/* Little Wing */}
          <path d="M22 36 Q18 42 24 44 Q28 44 26 36 Z" fill="#eab308" />
          {/* Head & Fluff */}
          <circle cx="38" cy="26" r="12" fill="#fde047" />
          <path d="M36 15 Q39 12 42 16" stroke="#facc15" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Eye */}
          <circle cx="42" cy="24" r="2.5" fill="#1f2937" />
          <circle cx="43" cy="23" r="0.8" fill="#ffffff" />
          {/* Beak */}
          <polygon points="46,26 54,29 46,32" fill="#f97316" />
          {/* Blush */}
          <circle cx="40" cy="28" r="2" fill="#f43f5e" opacity="0.5" />
        </svg>
      </motion.div>
    );
  }

  if (type === "rooster") {
    return (
      <motion.div
        animate={isPecking ? { y: [0, -4, 0], rotate: [0, -2, 2, 0] } : {}}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        className={`relative inline-block ${className}`}
      >
        <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-lg">
          {/* Shadow */}
          <ellipse cx="40" cy="70" rx="22" ry="6" fill="#1b3d1f" opacity="0.45" />
          {/* Tail Feathers - Proud & Colorful */}
          <path d="M24 45 C12 35 10 16 26 22 C12 28 16 50 30 48" fill="#047857" />
          <path d="M22 46 C10 42 6 26 22 28 C10 38 18 54 28 50" fill="#0284c7" />
          <path d="M26 48 C18 44 14 34 26 36" fill="#d97706" />
          {/* Legs */}
          <path d="M34 60 L32 72 M34 60 L36 72 M46 60 L44 72 M46 60 L48 72" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
          {/* Rooster Body */}
          <ellipse cx="42" cy="48" rx="20" ry="17" fill="#b45309" />
          <path d="M32 42 Q40 56 48 44" fill="#92400e" opacity="0.5" />
          {/* Wing */}
          <path d="M30 46 C26 55 36 60 42 54 C44 48 38 42 30 46 Z" fill="#b91c1c" />
          <path d="M32 48 C28 54 36 57 40 53" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
          {/* Neck & Head */}
          <path d="M46 48 L56 34 L50 32 L40 46 Z" fill="#d97706" />
          <circle cx="54" cy="30" r="11" fill="#ea580c" />
          {/* Majestic Rooster Comb */}
          <path d="M50 20 C48 12 56 12 56 18 C58 12 66 14 62 22 C64 20 68 24 64 26 L52 24 Z" fill="#dc2626" />
          {/* Wattle (beard) */}
          <path d="M58 35 C62 38 58 44 54 40 Z" fill="#dc2626" />
          {/* Eye */}
          <circle cx="57" cy="28" r="2.8" fill="#111827" />
          <circle cx="58" cy="27" r="1" fill="#ffffff" />
          {/* Sharp Beak */}
          <polygon points="62,28 73,32 62,36" fill="#f59e0b" stroke="#d97706" strokeWidth="0.5" />
        </svg>
      </motion.div>
    );
  }

  // Standard Hen
  return (
    <motion.div
      animate={isPecking ? { y: [0, -3, 0], rotate: [0, 2, -2, 0] } : {}}
      transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
    >
      <svg viewBox="0 0 70 70" className="w-full h-full drop-shadow-md">
        {/* Shadow */}
        <ellipse cx="35" cy="62" rx="18" ry="5" fill="#1b3d1f" opacity="0.4" />
        {/* Feet */}
        <path d="M28 54 L26 63 M28 54 L30 63 M40 54 L38 63 M40 54 L42 63" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        {/* Hen Tail */}
        <path d="M18 42 C12 34 14 24 24 30 C16 36 20 46 26 44 Z" fill="#e5e7eb" />
        {/* Body */}
        <ellipse cx="36" cy="42" rx="19" ry="15" fill="#ffffff" />
        <ellipse cx="36" cy="44" rx="16" ry="12" fill="#f3f4f6" />
        {/* Wing with feather curves */}
        <path d="M26 38 C22 48 34 52 40 46 C42 40 36 34 26 38 Z" fill="#e5e7eb" />
        <path d="M28 42 Q34 46 38 42" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Head */}
        <circle cx="48" cy="28" r="11" fill="#ffffff" />
        {/* Comb */}
        <path d="M44 20 C42 14 48 14 49 18 C50 14 56 16 54 20 Z" fill="#ef4444" />
        {/* Wattle */}
        <ellipse cx="50" cy="35" rx="3" ry="4" fill="#ef4444" />
        {/* Eye */}
        <circle cx="51" cy="26" r="2.5" fill="#1f2937" />
        <circle cx="52" cy="25" r="0.8" fill="#ffffff" />
        {/* Beak */}
        <polygon points="56,27 65,30 56,34" fill="#f59e0b" stroke="#d97706" strokeWidth="0.5" />
        {/* Cute blush */}
        <circle cx="47" cy="30" r="2.5" fill="#f43f5e" opacity="0.3" />
      </svg>
    </motion.div>
  );
};

// 🐄 COW SPRITE
export const CowSprite: React.FC<{ className?: string; isEating?: boolean }> = ({
  className = "w-24 h-24",
  isEating = true,
}) => {
  return (
    <motion.div
      animate={isEating ? { rotate: [0, 1.5, -1.5, 0], y: [0, -2, 0] } : {}}
      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
    >
      <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-lg">
        {/* Shadow */}
        <ellipse cx="50" cy="74" rx="34" ry="6" fill="#1b3d1f" opacity="0.45" />
        {/* Tail */}
        <path d="M18 42 Q10 46 12 56" stroke="#e5e7eb" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="57" r="3" fill="#1f2937" />
        {/* Legs with hooves */}
        <rect x="26" y="52" width="7" height="19" rx="3" fill="#f3f4f6" />
        <rect x="26" y="67" width="7" height="4" rx="1" fill="#1f2937" />
        <rect x="36" y="52" width="7" height="19" rx="3" fill="#e5e7eb" />
        <rect x="36" y="67" width="7" height="4" rx="1" fill="#1f2937" />
        <rect x="58" y="52" width="7" height="19" rx="3" fill="#e5e7eb" />
        <rect x="58" y="67" width="7" height="4" rx="1" fill="#1f2937" />
        <rect x="68" y="52" width="7" height="19" rx="3" fill="#f3f4f6" />
        <rect x="68" y="67" width="7" height="4" rx="1" fill="#1f2937" />
        {/* Udder */}
        <path d="M42 54 Q48 60 54 54 Z" fill="#fbcfe8" />
        <circle cx="45" cy="57" r="1.5" fill="#f472b6" />
        <circle cx="51" cy="57" r="1.5" fill="#f472b6" />
        {/* Cow Main Body */}
        <rect x="20" y="28" width="56" height="30" rx="14" fill="#ffffff" />
        {/* Spots */}
        <path d="M28 32 C34 28 38 36 32 42 C26 44 24 36 28 32 Z" fill="#1f2937" />
        <path d="M52 30 C60 28 62 40 56 44 C50 44 48 34 52 30 Z" fill="#1f2937" />
        <path d="M38 48 C42 46 44 54 39 56 C35 56 36 50 38 48 Z" fill="#1f2937" />
        {/* Neck Bell */}
        <path d="M68 40 L72 48 L68 50" stroke="#b45309" strokeWidth="2.5" fill="none" />
        <circle cx="70" cy="50" r="3.5" fill="#eab308" />
        {/* Head */}
        <circle cx="76" cy="32" r="14" fill="#ffffff" />
        <path d="M70 20 C68 28 78 30 76 20 Z" fill="#1f2937" />
        {/* Horns */}
        <path d="M70 20 Q66 12 70 14" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M82 20 Q86 12 82 14" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Ears */}
        <ellipse cx="64" cy="26" rx="5" ry="3" fill="#f3f4f6" transform="rotate(-20 64 26)" />
        <ellipse cx="88" cy="26" rx="5" ry="3" fill="#f3f4f6" transform="rotate(20 88 26)" />
        {/* Big cute eyes */}
        <circle cx="72" cy="28" r="2.8" fill="#111827" />
        <circle cx="73" cy="27" r="1" fill="#ffffff" />
        <circle cx="82" cy="28" r="2.8" fill="#111827" />
        <circle cx="83" cy="27" r="1" fill="#ffffff" />
        {/* Muzzle (Snout) */}
        <ellipse cx="78" cy="38" rx="10" ry="7" fill="#fbcfe8" />
        <circle cx="74" cy="38" r="1.5" fill="#be185d" />
        <circle cx="82" cy="38" r="1.5" fill="#be185d" />
      </svg>
    </motion.div>
  );
};

// 🐖 PIG SPRITE
export const PigSprite: React.FC<{ className?: string; isPiglet?: boolean }> = ({
  className = "w-20 h-20",
  isPiglet = false,
}) => {
  return (
    <motion.div
      animate={{ y: [0, -3, 0], rotate: [0, 2, -2, 0] }}
      transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
    >
      <svg viewBox="0 0 80 70" className="w-full h-full drop-shadow-md">
        {/* Shadow */}
        <ellipse cx="40" cy="62" rx="26" ry="6" fill="#1b3d1f" opacity="0.4" />
        {/* Curly Tail */}
        <path d="M16 38 C10 36 8 44 14 44 C18 44 14 34 10 38" stroke="#f472b6" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Legs with trotter hooves */}
        <rect x="24" y="46" width="6" height="15" rx="3" fill="#f472b6" />
        <rect x="24" y="58" width="6" height="3" rx="1" fill="#db2777" />
        <rect x="33" y="46" width="6" height="15" rx="3" fill="#ec4899" />
        <rect x="33" y="58" width="6" height="3" rx="1" fill="#db2777" />
        <rect x="47" y="46" width="6" height="15" rx="3" fill="#ec4899" />
        <rect x="47" y="58" width="6" height="3" rx="1" fill="#db2777" />
        <rect x="56" y="46" width="6" height="15" rx="3" fill="#f472b6" />
        <rect x="56" y="58" width="6" height="3" rx="1" fill="#db2777" />
        {/* Round Body */}
        <ellipse cx="38" cy="38" rx="22" ry="18" fill="#fbcfe8" />
        <ellipse cx="38" cy="40" rx="19" ry="14" fill="#f9a8d4" opacity="0.6" />
        {/* Head */}
        <circle cx="56" cy="32" r="14" fill="#fbcfe8" />
        {/* Floppy Ears */}
        <path d="M48 20 C46 14 54 12 56 18 Z" fill="#f472b6" />
        <path d="M64 20 C66 14 72 16 68 22 Z" fill="#f472b6" />
        {/* Eyes */}
        <circle cx="54" cy="28" r="2.5" fill="#1f2937" />
        <circle cx="55" cy="27" r="0.8" fill="#ffffff" />
        <circle cx="63" cy="28" r="2.5" fill="#1f2937" />
        <circle cx="64" cy="27" r="0.8" fill="#ffffff" />
        {/* Pig Snout */}
        <ellipse cx="62" cy="36" rx="7" ry="5" fill="#f472b6" />
        <circle cx="59.5" cy="36" r="1.3" fill="#9d174d" />
        <circle cx="64.5" cy="36" r="1.3" fill="#9d174d" />
        {/* Cheerful Blush */}
        <circle cx="50" cy="34" r="2.5" fill="#fb7185" opacity="0.6" />
      </svg>
    </motion.div>
  );
};

// 🪶 OSTRICH SPRITE
export const OstrichSprite: React.FC<{ className?: string }> = ({ className = "w-24 h-28" }) => {
  return (
    <motion.div
      animate={{ y: [0, -4, 0], rotate: [0, 1.5, -1.5, 0] }}
      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
    >
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-lg">
        {/* Shadow */}
        <ellipse cx="40" cy="94" rx="24" ry="5" fill="#1b3d1f" opacity="0.4" />
        {/* Long Legs */}
        <path d="M36 68 L34 94 M34 94 L28 95 M34 94 L38 95" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <path d="M48 68 L50 94 M50 94 L44 95 M50 94 L54 95" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        {/* Big Fluffy Feathered Body */}
        <ellipse cx="38" cy="58" rx="20" ry="16" fill="#1f2937" />
        {/* White fluffy tail feathers */}
        <path d="M20 54 C12 48 14 38 24 44 C14 42 16 58 22 56 Z" fill="#f3f4f6" />
        <path d="M18 58 C10 54 12 46 20 50 Z" fill="#e5e7eb" />
        {/* Wing layer */}
        <ellipse cx="38" cy="59" rx="15" ry="11" fill="#374151" />
        <path d="M30 62 Q38 68 46 62" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
        {/* Long Graceful Neck */}
        <path d="M50 56 Q58 36 54 22" stroke="#fed7aa" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Head */}
        <circle cx="55" cy="18" r="8" fill="#fed7aa" />
        <path d="M52 11 Q55 8 58 12" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Big Expressive Eye */}
        <circle cx="58" cy="16" r="2.8" fill="#111827" />
        <circle cx="59" cy="15" r="1" fill="#ffffff" />
        {/* Eyelash */}
        <path d="M57 13 L59 11 M60 14 L62 12" stroke="#111827" strokeWidth="1" />
        {/* Beak */}
        <polygon points="62,17 72,20 62,23" fill="#f59e0b" />
        <circle cx="54" cy="20" r="2" fill="#fb7185" opacity="0.5" />
      </svg>
    </motion.div>
  );
};

// 🥔 POTATO PLOT SPRITE
export const PotatoPlotSprite: React.FC<{
  progress: number;
  ready?: boolean;
  className?: string;
}> = ({ progress, ready = false, className = "w-28 h-28" }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Ground Mound / Rich Soil Patch */}
        <ellipse cx="50" cy="76" rx="44" ry="18" fill="#5c381e" />
        <ellipse cx="50" cy="74" rx="40" ry="15" fill="#784523" />
        <ellipse cx="50" cy="72" rx="34" ry="11" fill="#8d532b" />
        {/* Furrow lines */}
        <path d="M22 72 Q50 82 78 72" stroke="#4a2c16" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M26 76 Q50 85 74 76" stroke="#4a2c16" strokeWidth="1.5" fill="none" opacity="0.6" />

        {/* Growth Stages */}
        {progress < 25 && (
          /* Stage 1: Fresh green sprout */
          <g>
            <path d="M50 70 Q46 58 42 54 Q48 52 50 60 Q52 52 58 54 Q54 58 50 70 Z" fill="#22c55e" />
            <circle cx="50" cy="68" r="3" fill="#15803d" />
          </g>
        )}

        {progress >= 25 && progress < 60 && (
          /* Stage 2: Growing Bush */
          <g>
            <path d="M50 70 Q42 50 34 46 Q44 42 48 54 Q50 40 52 38 Q56 42 52 54 Q60 44 66 48 Q58 52 50 70 Z" fill="#16a34a" />
            <circle cx="38" cy="46" r="5" fill="#22c55e" />
            <circle cx="52" cy="38" r="6" fill="#22c55e" />
            <circle cx="62" cy="48" r="5" fill="#22c55e" />
          </g>
        )}

        {progress >= 60 && !ready && (
          /* Stage 3: Lush Flowering Potato Plant */
          <g>
            {/* Stems & Foliage */}
            <path d="M50 70 Q30 46 22 40 Q36 34 44 50 Q50 28 50 24 Q56 30 54 50 Q66 36 78 42 Q66 48 50 70 Z" fill="#15803d" />
            <circle cx="28" cy="40" r="9" fill="#16a34a" />
            <circle cx="50" cy="26" r="10" fill="#22c55e" />
            <circle cx="72" cy="42" r="9" fill="#16a34a" />
            <circle cx="40" cy="34" r="8" fill="#22c55e" />
            <circle cx="60" cy="34" r="8" fill="#22c55e" />
            {/* Cute white-purple flower */}
            <circle cx="50" cy="18" r="4" fill="#e0e7ff" />
            <circle cx="50" cy="18" r="1.5" fill="#eab308" />
          </g>
        )}

        {ready && (
          /* Stage 4: Harvest Ready with Golden Tubers Peek */
          <g className="animate-bounce-subtle">
            {/* Lush Bush */}
            <circle cx="28" cy="40" r="10" fill="#16a34a" />
            <circle cx="50" cy="24" r="12" fill="#22c55e" />
            <circle cx="72" cy="42" r="10" fill="#16a34a" />
            <circle cx="40" cy="32" r="9" fill="#15803d" />
            <circle cx="60" cy="32" r="9" fill="#15803d" />
            {/* Flowers */}
            <circle cx="42" cy="20" r="4" fill="#fdf4ff" />
            <circle cx="42" cy="20" r="1.5" fill="#eab308" />
            <circle cx="58" cy="18" r="4" fill="#fdf4ff" />
            <circle cx="58" cy="18" r="1.5" fill="#eab308" />
            {/* Visible Golden Potato Tubers popping out! */}
            <ellipse cx="32" cy="68" rx="8" ry="6" fill="#d97706" stroke="#92400e" strokeWidth="1" transform="rotate(-15 32 68)" />
            <circle cx="30" cy="67" r="0.8" fill="#78350f" />
            <circle cx="34" cy="69" r="0.8" fill="#78350f" />
            <ellipse cx="66" cy="69" rx="9" ry="6" fill="#f59e0b" stroke="#b45309" strokeWidth="1" transform="rotate(20 66 69)" />
            <circle cx="64" cy="68" r="0.8" fill="#78350f" />
            <circle cx="68" cy="70" r="0.8" fill="#78350f" />
            <ellipse cx="48" cy="74" rx="10" ry="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <circle cx="45" cy="73" r="1" fill="#78350f" />
            <circle cx="52" cy="74" r="1" fill="#78350f" />
            {/* Sparkles */}
            <path d="M80 20 L82 14 L84 20 L90 22 L84 24 L82 30 L80 24 L74 22 Z" fill="#fde047" />
            <path d="M16 30 L17 26 L18 30 L22 31 L18 32 L17 36 L16 32 L12 31 Z" fill="#fde047" />
          </g>
        )}
      </svg>
    </div>
  );
};

// 🌾 ISOMETRIC WHEAT TILE
export const WheatTileSprite: React.FC<{
  stage: number; // 0: empty soil, 1: shoots, 2: green stalks, 3: golden stalks, 4: ready
  onClick?: () => void;
  selected?: boolean;
}> = ({ stage = 0, onClick, selected = false }) => {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-transform duration-200 active:scale-95 ${
        selected ? "ring-4 ring-amber-400 rounded-2xl" : ""
      }`}
    >
      <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
        {/* Isometric Base Ground */}
        {/* Side depths for 3D isometric chunk */}
        <polygon points="50,75 5,50 5,60 50,85" fill="#422511" />
        <polygon points="50,75 95,50 95,60 50,85" fill="#2d190b" />
        {/* Top Diamond Face */}
        <polygon points="50,15 95,45 50,75 5,45" fill={stage === 0 ? "#713f12" : "#854d0e"} />
        {/* Furrow lines */}
        <path d="M25,32 L68,61 M35,26 L78,55 M15,39 L58,68" stroke="#542e0c" strokeWidth="1.5" opacity="0.6" />

        {/* Stage 0: Empty prepared soil with marker */}
        {stage === 0 && (
          <g opacity="0.5">
            <circle cx="50" cy="45" r="4" fill="#a16207" />
            <path d="M50 41 L50 49 M46 45 L54 45" stroke="#fef08a" strokeWidth="1.5" />
          </g>
        )}

        {/* Stage 1: Green shoots popping up */}
        {stage === 1 && (
          <g>
            <path d="M35 40 Q33 32 30 28 Q36 29 36 38 Z" fill="#4ade80" />
            <path d="M48 48 Q46 36 42 30 Q50 32 49 46 Z" fill="#22c55e" />
            <path d="M62 42 Q65 34 68 30 Q63 32 61 40 Z" fill="#4ade80" />
            <path d="M52 35 Q50 26 46 22 Q54 24 53 33 Z" fill="#16a34a" />
          </g>
        )}

        {/* Stage 2: Tall Green Wheat */}
        {stage === 2 && (
          <g>
            {/* Cluster of stalks */}
            <path d="M32 42 Q28 24 24 16 Q32 20 34 38 Z" fill="#16a34a" />
            <path d="M44 48 Q40 22 36 12 Q44 16 46 44 Z" fill="#22c55e" />
            <path d="M52 46 Q54 20 52 10 Q58 14 54 42 Z" fill="#15803d" />
            <path d="M64 42 Q68 22 72 14 Q65 18 62 38 Z" fill="#22c55e" />
            <path d="M40 36 Q46 16 50 14 Q44 22 41 34 Z" fill="#86efac" />
          </g>
        )}

        {/* Stage 3: Ripening Yellow-Green Wheat */}
        {stage === 3 && (
          <g>
            <path d="M30 42 Q25 20 20 12 Q28 15 32 38 Z" fill="#ca8a04" />
            <path d="M42 48 Q36 18 32 8 Q42 12 44 44 Z" fill="#eab308" />
            <path d="M50 46 Q52 16 50 6 Q56 10 52 42 Z" fill="#facc15" />
            <path d="M62 42 Q68 18 74 10 Q66 14 60 38 Z" fill="#eab308" />
            {/* Grain Heads */}
            <ellipse cx="20" cy="11" rx="3" ry="5" fill="#fde047" transform="rotate(-15 20 11)" />
            <ellipse cx="32" cy="7" rx="3.5" ry="6" fill="#fef08a" transform="rotate(-10 32 7)" />
            <ellipse cx="50" cy="5" rx="3.5" ry="6" fill="#fef08a" />
            <ellipse cx="74" cy="9" rx="3" ry="5" fill="#fde047" transform="rotate(15 74 9)" />
          </g>
        )}

        {/* Stage 4: Harvest Ready Golden Wheat with Sparkles! */}
        {stage >= 4 && (
          <g>
            {/* Heavy golden bowing stalks */}
            <path d="M28 44 Q20 22 14 14 Q24 16 30 40 Z" fill="#d97706" />
            <path d="M40 48 Q32 18 26 8 Q38 12 42 44 Z" fill="#f59e0b" />
            <path d="M52 46 Q54 14 50 4 Q58 8 54 42 Z" fill="#fbbf24" />
            <path d="M64 44 Q74 18 82 12 Q72 15 62 40 Z" fill="#f59e0b" />
            {/* Big Fat Golden Wheat Ears */}
            <g fill="#fef08a" stroke="#b45309" strokeWidth="0.5">
              <ellipse cx="14" cy="13" rx="4" ry="7" transform="rotate(-25 14 13)" />
              <ellipse cx="26" cy="7" rx="4.5" ry="8" transform="rotate(-15 26 7)" />
              <ellipse cx="50" cy="4" rx="5" ry="9" />
              <ellipse cx="82" cy="11" rx="4.5" ry="7.5" transform="rotate(25 82 11)" />
            </g>
            {/* Awns / Bristles */}
            <path d="M12 7 L8 2 M25 2 L22 -4 M50 -2 L50 -8 M83 5 L88 0" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />
            {/* Golden Sparkles */}
            <circle cx="18" cy="22" r="1.5" fill="#ffffff" className="animate-ping" />
            <circle cx="68" cy="18" r="2" fill="#ffffff" className="animate-ping" />
          </g>
        )}
      </svg>
    </div>
  );
};
