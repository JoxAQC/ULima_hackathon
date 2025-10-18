import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export const IntiIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    className={cn("w-4 h-4", props.className)}
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const YakuIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    className={cn("w-4 h-4", props.className)}
  >
    <path d="M12 2a10 10 0 00-10 10c0 4.4 3.8 8.2 8 9.7" />
    <path d="M12 2a10 10 0 0110 10c0 4.4-3.8 8.2-8 9.7" />
    <path d="M12 2a10 10 0 00-10 10c0 4.4 3.8 8.2 8 9.7" />
    <path d="M22 12c0-4.4-3.8-8.2-8-9.7" />
  </svg>
);

export const SachaIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    className={cn("w-4 h-4", props.className)}
  >
    <path d="M12 2l-7 7h14l-7-7z" />
    <path d="M6 13l-4 4h20l-4-4" />
    <path d="M8 22l-2-4h12l-2 4" />
  </svg>
);

export const WayraIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
    className={cn("w-4 h-4", props.className)}
  >
    <path d="M3 12h18" />
    <path d="M3 6h12" />
    <path d="M3 18h6" />
    <path d="M21 12c-3 0-3-4-6-4s-3 4-6 4" />
  </svg>
);
