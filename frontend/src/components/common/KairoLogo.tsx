interface KairoLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  subtitle?: string
  theme?: 'dark' | 'light'
  className?: string
}

export default function KairoLogo({
  size = 'md',
  showText = true,
  subtitle = 'GATEWAY',
  theme = 'dark',
  className = '',
}: KairoLogoProps) {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 46 : 40
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
  const textColor = theme === 'dark' ? 'text-[#fffcf2]' : 'text-[#17221d]'

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Gateway Geometric Mark */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 42 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="kairo-mark-bg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#255e4c" />
            <stop offset="1" stopColor="#183e32" />
          </linearGradient>
          <linearGradient id="kairo-lime-glow" x1="17" y1="11" x2="30" y2="31" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ddff8f" />
            <stop offset="1" stopColor="#a7e844" />
          </linearGradient>
          <filter id="kairo-glow" x="6" y="6" width="30" height="30" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1.5" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Base Squircle Container */}
        <rect width="42" height="42" rx="12" fill="url(#kairo-mark-bg)" />
        <rect
          x="0.75"
          y="0.75"
          width="40.5"
          height="40.5"
          rx="11.25"
          stroke="#c9f66f"
          strokeWidth="1.2"
          strokeOpacity="0.32"
        />

        {/* Outer Ingress Gateway Conduit Accent */}
        <path
          d="M32 16C33.5 18 34 20 34 21C34 22 33.5 24 32 26"
          stroke="#c9f66f"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />

        {/* Vertical Core Control Plane Spine */}
        <rect
          x="10.5"
          y="10.5"
          width="4.5"
          height="21"
          rx="2.25"
          fill="#fffcf2"
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.25))"
        />

        {/* Upper Routing Vector / Flow */}
        <path
          d="M18.5 21L28.5 11"
          stroke="url(#kairo-lime-glow)"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lower Routing Vector / Flow */}
        <path
          d="M18.5 21L28.5 31"
          stroke="url(#kairo-lime-glow)"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Gateway Convergence Node */}
        <circle cx="18.5" cy="21" r="2.6" fill="#c9f66f" />
        <circle cx="18.5" cy="21" r="1.2" fill="#183e32" />

        {/* Microservice Egress Target Nodes */}
        <circle cx="28.5" cy="11" r="1.5" fill="#fffcf2" />
        <circle cx="28.5" cy="31" r="1.5" fill="#fffcf2" />
      </svg>

      {/* Brand Wordmark & Tag */}
      {showText && (
        <div className="flex items-center gap-2">
          <span className={`font-bold tracking-tight ${textSize} ${textColor} leading-none`}>
            Kairo
          </span>
          {subtitle && (
            <span
              className={`text-[10px] font-mono font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                theme === 'light'
                  ? 'bg-[#386641]/10 border border-[#386641]/30 text-[#294c30]'
                  : 'bg-[#c9f66f]/15 border border-[#c9f66f]/35 text-[#c9f66f]'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

