import { cn } from "@/lib/utils";

export const PalAvatar = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g>
        {/* Main Body */}
        <rect x="15" y="35" width="70" height="50" rx="15" fill="hsl(var(--primary))" />
        
        {/* Head */}
        <rect x="25" y="15" width="50" height="40" rx="10" fill="hsl(var(--primary))" />
        
        {/* Screen */}
        <rect x="32" y="25" width="36" height="20" rx="5" fill="hsl(var(--background))" />
        
        {/* Blinking Eye */}
        <rect x="37" y="32" width="26" height="6" rx="3" fill="hsl(var(--accent))" className="animate-pulse" />
        
        {/* Antenna */}
        <line x1="65" y1="15" x2="75" y2="5" stroke="hsl(var(--primary-foreground))" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
        <circle cx="77" cy="3" r="4" fill="hsl(var(--accent))" />

        {/* Feet */}
        <rect x="25" y="85" width="20" height="10" rx="5" fill="hsl(var(--primary-foreground))" fillOpacity="0.5" />
        <rect x="55" y="85" width="20" height="10" rx="5" fill="hsl(var(--primary-foreground))" fillOpacity="0.5" />
      </g>
    </svg>
  );
  