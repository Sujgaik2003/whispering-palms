export default function WhisperingPalmsLogo({ className = "w-8 h-8", variant = "default" }: { className?: string, variant?: "default" | "simple" }) {
    if (variant === "simple") {
        return (
            <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" rx="40" fill="url(#palm-gradient)" />
                <path d="M100 60C90 65 85 75 85 85L85 140M100 60C110 65 115 75 115 85L115 140M100 60L100 140M75 90C72 92 70 95 70 100L70 140M125 90C128 92 130 95 130 100L130 140"
                    stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="100" cy="150" r="8" fill="white" />
                <defs>
                    <linearGradient id="palm-gradient" x1="0" y1="0" x2="200" y2="200">
                        <stop offset="0%" stopColor="#D4AF37" />
                        <stop offset="100%" stopColor="#C5A028" />
                    </linearGradient>
                </defs>
            </svg>
        )
    }

    // Default variant with more detail
    return (
        <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" rx="40" fill="url(#palm-gradient-full)" />

            {/* Palm lines */}
            <g opacity="0.95">
                {/* Thumb */}
                <path d="M75 90C72 92 70 95 70 100L70 140"
                    stroke="white" strokeWidth="7" strokeLinecap="round" />

                {/* Index finger */}
                <path d="M85 65C83 68 85 75 85 85L85 145"
                    stroke="white" strokeWidth="7" strokeLinecap="round" />

                {/* Middle finger (tallest) */}
                <path d="M100 55L100 150"
                    stroke="white" strokeWidth="8" strokeLinecap="round" />

                {/* Ring finger */}
                <path d="M115 65C117 68 115 75 115 85L115 145"
                    stroke="white" strokeWidth="7" strokeLinecap="round" />

                {/* Pinky */}
                <path d="M125 90C128 92 130 95 130 100L130 135"
                    stroke="white" strokeWidth="6" strokeLinecap="round" />

                {/* Life line */}
                <path d="M70 100C75 115 85 130 100 140"
                    stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />

                {/* Heart line */}
                <path d="M70 95C85 92 100 92 130 95"
                    stroke="white" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />

                {/* Head line */}
                <path d="M75 105C90 108 110 108 125 105"
                    stroke="white" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
            </g>

            {/* Mystical dot/chakra point */}
            <circle cx="100" cy="110" r="4" fill="white" opacity="0.8" />

            <defs>
                <linearGradient id="palm-gradient-full" x1="0" y1="0" x2="200" y2="200">
                    <stop offset="0%" stopColor="#D4AF37" />
                    <stop offset="50%" stopColor="#E5C158" />
                    <stop offset="100%" stopColor="#C5A028" />
                </linearGradient>
            </defs>
        </svg>
    )
}
