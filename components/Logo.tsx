export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
    return (
        <svg
            viewBox="10 25 80 75"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="40%" stopColor="#F2D06B" />
                    <stop offset="100%" stopColor="#B4941F" />
                </linearGradient>
            </defs>

            {/* Left Lapel */}
            <path
                d="M15 35 L30 28 L50 95 L15 45 Z"
                fill="url(#gold-gradient)"
            />

            {/* Right Lapel */}
            <path
                d="M85 35 L70 28 L50 95 L85 45 Z"
                fill="url(#gold-gradient)"
            />

            {/* Bow Tie - Left */}
            <path
                d="M30 28 L44 33 L44 41 L30 46 Z"
                fill="url(#gold-gradient)"
            />

            {/* Bow Tie - Right */}
            <path
                d="M70 28 L56 33 L56 41 L70 46 Z"
                fill="url(#gold-gradient)"
            />

            {/* Bow Tie - Center Knot */}
            <rect x="44" y="33" width="12" height="8" rx="1" fill="url(#gold-gradient)" />

            {/* Buttons */}
            <circle cx="50" cy="55" r="3.5" fill="url(#gold-gradient)" />
            <circle cx="50" cy="70" r="3.5" fill="url(#gold-gradient)" />
            <circle cx="50" cy="85" r="3.5" fill="url(#gold-gradient)" />
        </svg>
    );
}
