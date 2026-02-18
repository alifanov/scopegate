import { ComponentProps } from "react";

type SvgProps = ComponentProps<"svg">;

function GmailIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
      <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
      <path fill="#e53935" d="M35,11.2L24,19.45L13,11.2V8c0-1.657,1.343-3,3-3h16c1.657,0,3,1.343,3,3V11.2z" />
      <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
      <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z" />
    </svg>
  );
}

function CalendarIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="36" height="36" x="6" y="6" fill="#fff" rx="2" />
      <path fill="#1e88e5" d="M34,42H14c-4.411,0-8-3.589-8-8V14c0-4.411,3.589-8,8-8h20c4.411,0,8,3.589,8,8v20 C42,38.411,38.411,42,34,42z M14,10c-2.206,0-4,1.794-4,4v20c0,2.206,1.794,4,4,4h20c2.206,0,4-1.794,4-4V14 c0-2.206-1.794-4-4-4H14z" />
      <rect width="4" height="5.5" x="15" y="4.5" fill="#1e88e5" rx="1" />
      <rect width="4" height="5.5" x="29" y="4.5" fill="#1e88e5" rx="1" />
      <path fill="#1e88e5" d="M13,20h22v2H13z" />
      <circle cx="17" cy="27" r="2.5" fill="#1e88e5" />
      <circle cx="24" cy="27" r="2.5" fill="#1e88e5" />
      <circle cx="31" cy="27" r="2.5" fill="#1e88e5" />
      <circle cx="17" cy="34" r="2.5" fill="#1e88e5" />
      <circle cx="24" cy="34" r="2.5" fill="#1e88e5" />
    </svg>
  );
}

function DriveIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#ffc107" d="M17.4,4L6,22l5.4,9.3L22.8,13.3L17.4,4z" />
      <path fill="#1976d2" d="M42,22L30.6,4H17.4l11.4,18H42z" />
      <path fill="#4caf50" d="M42,22H28.8l-11.4,9.3L22.8,40l19.2,0L42,22z" />
      <path fill="#e8710a" d="M17.4,31.3L11.4,22l-5.4,9.3l5.4,8.7h11.4L17.4,31.3z" />
      <path fill="#1565c0" d="M28.8,22L17.4,4l-6,9.3l11.4,18L28.8,22z" />
      <path fill="#2e7d32" d="M42,22l-6-9.3L22.8,31.3l5.4,8.7H42L42,22z" />
    </svg>
  );
}

function GoogleAdsIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#4caf50" d="M43.6,20L32,5c-1.9-2.4-5.4-2.8-7.8-0.9c-2.4,1.9-2.8,5.4-0.9,7.8l11.6,15 c1.9,2.4,5.4,2.8,7.8,0.9C45.2,25.9,45.5,22.4,43.6,20z" />
      <path fill="#1565c0" d="M24.2,27.8L12.6,12.8c-1.9-2.4-5.4-2.8-7.8-0.9c-2.4,1.9-2.8,5.4-0.9,7.8l11.6,15 c1.9,2.4,5.4,2.8,7.8,0.9S26.1,30.2,24.2,27.8z" />
      <circle cx="7.6" cy="38" r="5.5" fill="#ffc107" />
    </svg>
  );
}

function SearchConsoleIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#1565c0" d="M24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20S35.046,4,24,4z" />
      <path fill="#fff" d="M24,8c8.837,0,16,7.163,16,16S32.837,40,24,40S8,32.837,8,24S15.163,8,24,8z" />
      <path fill="#1565c0" d="M24,12c6.627,0,12,5.373,12,12s-5.373,12-12,12S12,30.627,12,24S17.373,12,24,12z" />
      <path fill="#fff" d="M24,16c4.418,0,8,3.582,8,8s-3.582,8-8,8s-8-3.582-8-8S19.582,16,24,16z" />
      <path fill="#1565c0" d="M30,18l8-8v10L30,18z" />
      <path fill="#1565c0" d="M24,20c2.209,0,4,1.791,4,4s-1.791,4-4,4s-4-1.791-4-4S21.791,20,24,20z" />
    </svg>
  );
}

function OpenRouterIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <rect width="48" height="48" rx="10" fill="#1a1a2e" />
      <path
        d="M24 10C16.268 10 10 16.268 10 24s6.268 14 14 14 14-6.268 14-14S31.732 10 24 10zm0 4a10 10 0 0 1 9.95 8.95H14.05A10 10 0 0 1 24 14zm0 20a10 10 0 0 1-9.95-8.95h19.9A10 10 0 0 1 24 34z"
        fill="#6366f1"
      />
      <circle cx="24" cy="24" r="4" fill="#a5b4fc" />
    </svg>
  );
}

const ICONS: Record<string, (props: SvgProps) => React.ReactElement> = {
  gmail: GmailIcon,
  calendar: CalendarIcon,
  drive: DriveIcon,
  googleAds: GoogleAdsIcon,
  searchConsole: SearchConsoleIcon,
  openRouter: OpenRouterIcon,
};

export function ServiceIcon({
  provider,
  className = "size-6",
  ...props
}: { provider: string } & SvgProps) {
  const Icon = ICONS[provider];
  if (!Icon) return null;
  return <Icon className={className} {...props} />;
}
