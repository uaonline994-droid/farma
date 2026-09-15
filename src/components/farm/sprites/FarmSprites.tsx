import React from "react";
import { motion } from "motion/react";

// 🐤 CHICK SPRITE (Яскраве пухнасте жовте курчатко)
export const ChickSprite: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <motion.div
      animate={{ y: [0, -4, 0], rotate: [0, 6, -6, 0] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
      title="Курча"
    >
      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
        {/* Тінь на траві */}
        <ellipse cx="32" cy="56" rx="16" ry="5" fill="#142c16" opacity="0.6" />
        {/* Лапки помаранчеві */}
        <path d="M26 49 L23 58 M26 49 L28 58 M36 49 L34 58 M36 49 L39 58" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
        {/* Кругле тіло курчати (яскраво-жовте) */}
        <circle cx="32" cy="38" r="16" fill="#facc15" />
        <circle cx="30" cy="36" r="14" fill="#fde047" />
        {/* Крильце */}
        <ellipse cx="23" cy="39" rx="6" ry="8" fill="#eab308" transform="rotate(15 23 39)" />
        {/* Голова з чубчиком */}
        <circle cx="40" cy="24" r="12" fill="#fde047" />
        <path d="M38 12 Q42 8 44 14" stroke="#eab308" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M42 11 Q46 9 46 15" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Око велике блискуче */}
        <circle cx="44" cy="22" r="3" fill="#0f172a" />
        <circle cx="45" cy="21" r="1" fill="#ffffff" />
        {/* Дзьоб */}
        <polygon points="49,23 59,26 49,30" fill="#f97316" stroke="#c2410c" strokeWidth="0.5" />
        {/* Рожева щічка */}
        <circle cx="40" cy="27" r="2.5" fill="#fb7185" opacity="0.7" />
      </svg>
    </motion.div>
  );
};

// 🐓 ROOSTER SPRITE (Великий гордий різнокольоровий Півень з червоним гребенем та хвостом)
export const RoosterSprite: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => {
  return (
    <motion.div
      animate={{ y: [0, -3, 0], rotate: [0, -2, 2, 0] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
      title="Півень"
    >
      <svg viewBox="0 0 90 90" className="w-full h-full drop-shadow-xl">
        {/* Тінь */}
        <ellipse cx="44" cy="80" rx="26" ry="6" fill="#142c16" opacity="0.6" />
        {/* Пишний різнокольоровий хвіст півня */}
        <path d="M26 50 C8 38 4 14 26 20 C10 32 14 60 34 56" fill="#047857" stroke="#065f46" strokeWidth="1" />
        <path d="M24 52 C4 46 2 24 22 28 C6 42 16 64 30 58" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        <path d="M28 54 C12 50 10 34 26 38 C14 48 22 66 36 60" fill="#d97706" />
        {/* Міцні лапи зі шпорами */}
        <path d="M38 66 L36 82 M38 66 L42 82 M52 66 L48 82 M52 66 L56 82" stroke="#ea580c" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M35 74 L30 72 M47 74 L42 72" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" />
        {/* Тулуб півня (коричнево-золотий) */}
        <ellipse cx="46" cy="54" rx="22" ry="18" fill="#92400e" />
        <ellipse cx="46" cy="52" rx="19" ry="15" fill="#b45309" />
        {/* Крило барвисте */}
        <path d="M32 50 C26 62 42 66 48 58 C50 50 42 44 32 50 Z" fill="#b91c1c" />
        <path d="M34 54 C30 60 40 64 45 58" stroke="#f59e0b" strokeWidth="2" fill="none" />
        {/* Шия з золотим пір'ям */}
        <path d="M50 52 L62 36 L54 32 L42 50 Z" fill="#d97706" />
        <path d="M46 52 L58 38 L52 34 L38 50 Z" fill="#f59e0b" />
        {/* Голова */}
        <circle cx="60" cy="32" r="12" fill="#ea580c" />
        {/* Величний яскраво-червоний гребінь */}
        <path d="M54 22 C52 10 62 10 62 18 C66 10 74 12 70 22 C74 18 78 24 72 28 L56 26 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
        {/* Борода (сережки півня) */}
        <path d="M64 38 C70 42 66 50 60 44 Z" fill="#dc2626" />
        <ellipse cx="62" cy="42" rx="4" ry="6" fill="#ef4444" />
        {/* Око горде */}
        <circle cx="64" cy="30" r="3" fill="#111827" />
        <circle cx="65" cy="29" r="1" fill="#ffffff" />
        {/* Гострий міцний дзьоб */}
        <polygon points="70,30 84,34 70,39" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
      </svg>
    </motion.div>
  );
};

// 🐔 HEN SPRITE (Доросла біла/ряба курка-несучка)
export const HenSprite: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => {
  return (
    <motion.div
      animate={{ y: [0, -3, 0], rotate: [0, 2, -2, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
      title="Курка-несучка"
    >
      <svg viewBox="0 0 70 70" className="w-full h-full drop-shadow-md">
        {/* Тінь */}
        <ellipse cx="35" cy="62" rx="18" ry="5" fill="#142c16" opacity="0.6" />
        {/* Лапки */}
        <path d="M28 54 L26 63 M28 54 L30 63 M40 54 L38 63 M40 54 L42 63" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
        {/* Хвостик курки */}
        <path d="M18 42 C12 34 14 24 24 30 C16 36 20 46 26 44 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
        {/* Тіло білої курки */}
        <ellipse cx="36" cy="42" rx="19" ry="15" fill="#ffffff" />
        <ellipse cx="36" cy="44" rx="16" ry="12" fill="#f9fafb" />
        {/* Крильце */}
        <path d="M26 38 C22 48 34 52 40 46 C42 40 36 34 26 38 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="0.8" />
        <path d="M28 42 Q34 46 38 42" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Голова */}
        <circle cx="48" cy="28" r="11" fill="#ffffff" />
        {/* Маленький жіночий гребінець */}
        <path d="M44 20 C42 14 48 14 49 18 C50 14 56 16 54 20 Z" fill="#ef4444" />
        {/* Борідка */}
        <ellipse cx="50" cy="35" rx="3" ry="4" fill="#ef4444" />
        {/* Око */}
        <circle cx="51" cy="26" r="2.5" fill="#1f2937" />
        <circle cx="52" cy="25" r="0.8" fill="#ffffff" />
        {/* Дзьоб */}
        <polygon points="56,27 65,30 56,34" fill="#f59e0b" stroke="#d97706" strokeWidth="0.5" />
        {/* Рум'яна щічка */}
        <circle cx="47" cy="30" r="2.5" fill="#f43f5e" opacity="0.3" />
      </svg>
    </motion.div>
  );
};

// 🐔 Універсальний експорт ChickenSprite
export const ChickenSprite: React.FC<{
  type?: "hen" | "chick" | "rooster";
  className?: string;
}> = ({ type = "hen", className }) => {
  if (type === "chick") return <ChickSprite className={className} />;
  if (type === "rooster") return <RoosterSprite className={className} />;
  return <HenSprite className={className} />;
};

// 🐄 COW SPRITE (Дійна корова з плямами та дзвіночком)
export const CowSprite: React.FC<{ className?: string }> = ({ className = "w-28 h-28" }) => {
  return (
    <motion.div
      animate={{ rotate: [0, 1.5, -1.5, 0], y: [0, -2, 0] }}
      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
      title="Корова"
    >
      <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-lg">
        {/* Тінь */}
        <ellipse cx="50" cy="74" rx="34" ry="6" fill="#142c16" opacity="0.6" />
        {/* Хвіст */}
        <path d="M18 42 Q10 46 12 56" stroke="#e5e7eb" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="57" r="3" fill="#1f2937" />
        {/* Ноги з ратицями */}
        <rect x="26" y="52" width="7" height="19" rx="3" fill="#f3f4f6" />
        <rect x="26" y="67" width="7" height="4" rx="1" fill="#1f2937" />
        <rect x="36" y="52" width="7" height="19" rx="3" fill="#e5e7eb" />
        <rect x="36" y="67" width="7" height="4" rx="1" fill="#1f2937" />
        <rect x="58" y="52" width="7" height="19" rx="3" fill="#e5e7eb" />
        <rect x="58" y="67" width="7" height="4" rx="1" fill="#1f2937" />
        <rect x="68" y="52" width="7" height="19" rx="3" fill="#f3f4f6" />
        <rect x="68" y="67" width="7" height="4" rx="1" fill="#1f2937" />
        {/* Вим'я */}
        <path d="M42 54 Q48 60 54 54 Z" fill="#fbcfe8" />
        <circle cx="45" cy="57" r="1.5" fill="#f472b6" />
        <circle cx="51" cy="57" r="1.5" fill="#f472b6" />
        {/* Тіло корови */}
        <rect x="20" y="28" width="56" height="30" rx="14" fill="#ffffff" />
        {/* Чорні плями */}
        <path d="M28 32 C34 28 38 36 32 42 C26 44 24 36 28 32 Z" fill="#1f2937" />
        <path d="M52 30 C60 28 62 40 56 44 C50 44 48 34 52 30 Z" fill="#1f2937" />
        <path d="M38 48 C42 46 44 54 39 56 C35 56 36 50 38 48 Z" fill="#1f2937" />
        {/* Дзвіночок */}
        <path d="M68 40 L72 48 L68 50" stroke="#b45309" strokeWidth="2.5" fill="none" />
        <circle cx="70" cy="50" r="3.5" fill="#eab308" />
        {/* Голова */}
        <circle cx="76" cy="32" r="14" fill="#ffffff" />
        <path d="M70 20 C68 28 78 30 76 20 Z" fill="#1f2937" />
        {/* Роги */}
        <path d="M70 20 Q66 12 70 14" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M82 20 Q86 12 82 14" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Вуха */}
        <ellipse cx="64" cy="26" rx="5" ry="3" fill="#f3f4f6" transform="rotate(-20 64 26)" />
        <ellipse cx="88" cy="26" rx="5" ry="3" fill="#f3f4f6" transform="rotate(20 88 26)" />
        {/* Очі */}
        <circle cx="72" cy="28" r="2.8" fill="#111827" />
        <circle cx="73" cy="27" r="1" fill="#ffffff" />
        <circle cx="82" cy="28" r="2.8" fill="#111827" />
        <circle cx="83" cy="27" r="1" fill="#ffffff" />
        {/* Мордочка */}
        <ellipse cx="78" cy="38" rx="10" ry="7" fill="#fbcfe8" />
        <circle cx="74" cy="38" r="1.5" fill="#be185d" />
        <circle cx="82" cy="38" r="1.5" fill="#be185d" />
      </svg>
    </motion.div>
  );
};

// 🐖 PIG SPRITE (Рожева вгодована свиня)
export const PigSprite: React.FC<{ className?: string; isPiglet?: boolean }> = ({
  className = "w-24 h-24",
  isPiglet = false,
}) => {
  return (
    <motion.div
      animate={{ y: [0, -3, 0], rotate: [0, 2, -2, 0] }}
      transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
      title={isPiglet ? "Порося" : "Свиня"}
    >
      <svg viewBox="0 0 80 70" className="w-full h-full drop-shadow-md">
        {/* Тінь */}
        <ellipse cx="40" cy="62" rx="26" ry="6" fill="#142c16" opacity="0.6" />
        {/* Хвостик гачком */}
        <path d="M16 38 C10 36 8 44 14 44 C18 44 14 34 10 38" stroke="#f472b6" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Ноги з ратичками */}
        <rect x="24" y="46" width="6" height="15" rx="3" fill="#f472b6" />
        <rect x="24" y="58" width="6" height="3" rx="1" fill="#db2777" />
        <rect x="33" y="46" width="6" height="15" rx="3" fill="#ec4899" />
        <rect x="33" y="58" width="6" height="3" rx="1" fill="#db2777" />
        <rect x="47" y="46" width="6" height="15" rx="3" fill="#ec4899" />
        <rect x="47" y="58" width="6" height="3" rx="1" fill="#db2777" />
        <rect x="56" y="46" width="6" height="15" rx="3" fill="#f472b6" />
        <rect x="56" y="58" width="6" height="3" rx="1" fill="#db2777" />
        {/* Кругле пухке рожеве тіло */}
        <ellipse cx="38" cy="38" rx="22" ry="18" fill="#fbcfe8" />
        <ellipse cx="38" cy="40" rx="19" ry="14" fill="#f9a8d4" opacity="0.6" />
        {/* Голова */}
        <circle cx="56" cy="32" r="14" fill="#fbcfe8" />
        {/* Вушка */}
        <path d="M48 20 C46 14 54 12 56 18 Z" fill="#f472b6" />
        <path d="M64 20 C66 14 72 16 68 22 Z" fill="#f472b6" />
        {/* Оченята */}
        <circle cx="54" cy="28" r="2.5" fill="#1f2937" />
        <circle cx="55" cy="27" r="0.8" fill="#ffffff" />
        <circle cx="63" cy="28" r="2.5" fill="#1f2937" />
        <circle cx="64" cy="27" r="0.8" fill="#ffffff" />
        {/* П'ятачок */}
        <ellipse cx="62" cy="36" rx="7" ry="5" fill="#f472b6" />
        <circle cx="59.5" cy="36" r="1.3" fill="#9d174d" />
        <circle cx="64.5" cy="36" r="1.3" fill="#9d174d" />
        {/* Щічки */}
        <circle cx="50" cy="34" r="2.5" fill="#fb7185" opacity="0.6" />
      </svg>
    </motion.div>
  );
};

// 🦤 OSTRICH SPRITE (Дорослий екзотичний страус)
export const OstrichSprite: React.FC<{ className?: string }> = ({ className = "w-28 h-32" }) => {
  return (
    <motion.div
      animate={{ y: [0, -4, 0], rotate: [0, 1.5, -1.5, 0] }}
      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      className={`relative inline-block ${className}`}
      title="Страус"
    >
      <svg viewBox="0 0 80 100" className="w-full h-full drop-shadow-lg">
        {/* Тінь */}
        <ellipse cx="40" cy="94" rx="24" ry="5" fill="#142c16" opacity="0.6" />
        {/* Довгі міцні ноги */}
        <path d="M36 68 L34 94 M34 94 L28 95 M34 94 L38 95" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <path d="M48 68 L50 94 M50 94 L44 95 M50 94 L54 95" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        {/* Пухнасте темне пір'яне тіло */}
        <ellipse cx="38" cy="58" rx="20" ry="16" fill="#1f2937" />
        {/* Білий пухнастий хвіст */}
        <path d="M20 54 C12 48 14 38 24 44 C14 42 16 58 22 56 Z" fill="#f3f4f6" />
        <path d="M18 58 C10 54 12 46 20 50 Z" fill="#e5e7eb" />
        {/* Крило */}
        <ellipse cx="38" cy="59" rx="15" ry="11" fill="#374151" />
        <path d="M30 62 Q38 68 46 62" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
        {/* Довга граціозна шия */}
        <path d="M50 56 Q58 36 54 22" stroke="#fed7aa" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* Голова */}
        <circle cx="55" cy="18" r="8" fill="#fed7aa" />
        <path d="M52 11 Q55 8 58 12" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Велике око */}
        <circle cx="58" cy="16" r="2.8" fill="#111827" />
        <circle cx="59" cy="15" r="1" fill="#ffffff" />
        <path d="M57 13 L59 11 M60 14 L62 12" stroke="#111827" strokeWidth="1" />
        {/* Дзьоб */}
        <polygon points="62,17 72,20 62,23" fill="#f59e0b" />
        <circle cx="54" cy="20" r="2" fill="#fb7185" opacity="0.5" />
      </svg>
    </motion.div>
  );
};

// 🌾 WHEAT TILE SPRITE (for wheat grid in WheatFieldView)
export const WheatTileSprite: React.FC<{
  stage: number;
  ready?: boolean;
  className?: string;
}> = ({ stage, ready = false, className = "w-full h-full" }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-sm">
        {/* Soil Base */}
        <ellipse cx="40" cy="58" rx="36" ry="16" fill="#603813" />
        <ellipse cx="40" cy="56" rx="32" ry="13" fill="#7a4618" />

        {/* Growth Stages */}
        {stage <= 0 && (
          <text x="40" y="60" textAnchor="middle" fontSize="12" fill="#a16207" opacity="0.7">
            🌱
          </text>
        )}

        {stage === 1 && (
          <g>
            <path d="M36 54 Q38 44 32 38 Q38 42 40 54 Z" fill="#22c55e" />
            <path d="M44 54 Q42 44 48 38 Q42 42 40 54 Z" fill="#22c55e" />
          </g>
        )}

        {stage === 2 && (
          <g>
            <path d="M34 54 Q36 36 28 28 Q36 34 38 54 Z" fill="#16a34a" />
            <path d="M40 54 Q40 32 40 24 Q42 34 40 54 Z" fill="#22c55e" />
            <path d="M46 54 Q44 36 52 28 Q44 34 42 54 Z" fill="#16a34a" />
          </g>
        )}

        {stage === 3 && (
          <g>
            <path d="M32 54 Q34 30 24 20 Q34 28 36 54 Z" fill="#65a30d" />
            <path d="M40 54 Q40 24 40 14 Q42 28 40 54 Z" fill="#84cc16" />
            <path d="M48 54 Q46 30 56 20 Q46 28 44 54 Z" fill="#65a30d" />
            <circle cx="24" cy="20" r="3.5" fill="#ca8a04" />
            <circle cx="40" cy="14" r="3.5" fill="#eab308" />
            <circle cx="56" cy="20" r="3.5" fill="#ca8a04" />
          </g>
        )}

        {stage >= 4 && (
          <g>
            <path d="M30 54 Q32 26 20 14 Q32 24 34 54 Z" fill="#d97706" />
            <path d="M40 54 Q40 20 40 10 Q42 24 40 54 Z" fill="#f59e0b" />
            <path d="M50 54 Q48 26 60 14 Q48 24 46 54 Z" fill="#d97706" />
            <ellipse cx="20" cy="14" rx="4" ry="7" fill="#facc15" transform="rotate(-20 20 14)" />
            <ellipse cx="40" cy="10" rx="4.5" ry="8" fill="#fde047" />
            <ellipse cx="60" cy="14" rx="4" ry="7" fill="#facc15" transform="rotate(20 60 14)" />
            {ready && (
              <path d="M68 20 L70 14 L72 20 L78 22 L72 24 L70 30 L68 24 L62 22 Z" fill="#fef08a" />
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

export const PotatoPlotSprite: React.FC<{
  progress: number;
  ready?: boolean;
  className?: string;
}> = ({ progress, ready = false, className = "w-28 h-28" }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <ellipse cx="50" cy="76" rx="44" ry="18" fill="#5c381e" />
        <ellipse cx="50" cy="74" rx="40" ry="15" fill="#784523" />
        <ellipse cx="50" cy="72" rx="34" ry="11" fill="#8d532b" />
        <path d="M22 72 Q50 82 78 72" stroke="#4a2c16" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M26 76 Q50 85 74 76" stroke="#4a2c16" strokeWidth="1.5" fill="none" opacity="0.6" />

        {progress < 25 && (
          <g>
            <path d="M50 70 Q46 58 42 54 Q48 52 50 60 Q52 52 58 54 Q54 58 50 70 Z" fill="#22c55e" />
            <circle cx="50" cy="68" r="3" fill="#15803d" />
          </g>
        )}

        {progress >= 25 && progress < 60 && (
          <g>
            <path d="M50 70 Q42 50 34 46 Q44 42 48 54 Q50 40 52 38 Q56 42 52 54 Q60 44 66 48 Q58 52 50 70 Z" fill="#16a34a" />
            <circle cx="38" cy="46" r="5" fill="#22c55e" />
            <circle cx="52" cy="38" r="6" fill="#22c55e" />
            <circle cx="62" cy="48" r="5" fill="#22c55e" />
          </g>
        )}

        {progress >= 60 && !ready && (
          <g>
            <path d="M50 70 Q30 46 22 40 Q36 34 44 50 Q50 28 50 24 Q56 30 54 50 Q66 36 78 42 Q66 48 50 70 Z" fill="#15803d" />
            <circle cx="28" cy="40" r="9" fill="#16a34a" />
            <circle cx="50" cy="26" r="10" fill="#22c55e" />
            <circle cx="72" cy="42" r="9" fill="#16a34a" />
            <circle cx="40" cy="34" r="8" fill="#22c55e" />
            <circle cx="60" cy="34" r="8" fill="#22c55e" />
            <circle cx="50" cy="18" r="4" fill="#e0e7ff" />
            <circle cx="50" cy="18" r="1.5" fill="#eab308" />
          </g>
        )}

        {ready && (
          <g>
            <circle cx="28" cy="40" r="10" fill="#16a34a" />
            <circle cx="50" cy="24" r="12" fill="#22c55e" />
            <circle cx="72" cy="42" r="10" fill="#16a34a" />
            <circle cx="40" cy="32" r="9" fill="#15803d" />
            <circle cx="60" cy="32" r="9" fill="#15803d" />
            <circle cx="42" cy="20" r="4" fill="#fdf4ff" />
            <circle cx="42" cy="20" r="1.5" fill="#eab308" />
            <circle cx="58" cy="18" r="4" fill="#fdf4ff" />
            <circle cx="58" cy="18" r="1.5" fill="#eab308" />
            <ellipse cx="32" cy="68" rx="8" ry="6" fill="#d97706" stroke="#92400e" strokeWidth="1" transform="rotate(-15 32 68)" />
            <ellipse cx="66" cy="69" rx="9" ry="6" fill="#f59e0b" stroke="#b45309" strokeWidth="1" transform="rotate(20 66 69)" />
            <ellipse cx="48" cy="74" rx="10" ry="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <path d="M80 20 L82 14 L84 20 L90 22 L84 24 L82 30 L80 24 L74 22 Z" fill="#fde047" />
          </g>
        )}
      </svg>
    </div>
  );
};
