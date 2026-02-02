'use client'

/**
 * Whispering Palms Logo Component
 * Replaces the previous SVG logo with the official branded logo image.
 * Ensures sharpness and proper alignment across all devices.
 */
export default function WhisperingPalmsLogo({ className = "w-8 h-8", variant = "default" }: { className?: string, variant?: "default" | "simple" }) {
    return (
        <div className={`relative flex items-center justify-center ${className} overflow-hidden rounded-lg bg-transparent`}>
            <img
                src="/logo.png"
                alt="Whispering Palms Logo"
                className="w-full h-full object-contain select-none"
                style={{ imageRendering: 'auto' }}
                loading="eager"
            />
        </div>
    )
}
