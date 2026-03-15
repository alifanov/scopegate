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

function TwitterIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#000" />
      <path
        d="M28.97 13h4.26l-9.31 10.64L34.56 35h-8.58l-6.72-8.78L12.16 35H7.9l9.96-11.38L7.44 13h8.8l6.07 8.02L28.97 13zm-1.5 19.77h2.36L16.65 15.42h-2.53l13.35 17.35z"
        fill="#fff"
      />
    </svg>
  );
}

function LinkedInIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#0A66C2" />
      <path
        d="M15.5 13.5c0 1.38-1.12 2.5-2.5 2.5S10.5 14.88 10.5 13.5 11.62 11 13 11s2.5 1.12 2.5 2.5zM11 19h4v18h-4V19zm7.5 0h3.84v2.46h.05c.53-1.01 1.84-2.46 3.78-2.46 4.04 0 4.78 2.66 4.78 6.12V37h-4V26.12c0-2.59-.05-5.92-3.61-5.92-3.61 0-4.16 2.82-4.16 5.73V37h-4V19h3.32z"
        fill="#fff"
      />
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

function SlackIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#E01E5A" d="M13.1 24.2c0 1.8-1.4 3.2-3.2 3.2-1.8 0-3.2-1.4-3.2-3.2 0-1.8 1.4-3.2 3.2-3.2h3.2v3.2zm1.6 0c0-1.8 1.4-3.2 3.2-3.2 1.8 0 3.2 1.4 3.2 3.2v8c0 1.8-1.4 3.2-3.2 3.2-1.8 0-3.2-1.4-3.2-3.2v-8z"/>
      <path fill="#36C5F0" d="M17.9 13.1c-1.8 0-3.2-1.4-3.2-3.2 0-1.8 1.4-3.2 3.2-3.2 1.8 0 3.2 1.4 3.2 3.2v3.2h-3.2zm0 1.6c1.8 0 3.2 1.4 3.2 3.2 0 1.8-1.4 3.2-3.2 3.2h-8c-1.8 0-3.2-1.4-3.2-3.2 0-1.8 1.4-3.2 3.2-3.2h8z"/>
      <path fill="#2EB67D" d="M34.9 17.9c0-1.8 1.4-3.2 3.2-3.2 1.8 0 3.2 1.4 3.2 3.2 0 1.8-1.4 3.2-3.2 3.2h-3.2v-3.2zm-1.6 0c0 1.8-1.4 3.2-3.2 3.2-1.8 0-3.2-1.4-3.2-3.2v-8c0-1.8 1.4-3.2 3.2-3.2 1.8 0 3.2 1.4 3.2 3.2v8z"/>
      <path fill="#ECB22E" d="M30.1 34.9c1.8 0 3.2 1.4 3.2 3.2 0 1.8-1.4 3.2-3.2 3.2-1.8 0-3.2-1.4-3.2-3.2v-3.2h3.2zm0-1.6c-1.8 0-3.2-1.4-3.2-3.2 0-1.8 1.4-3.2 3.2-3.2h8c1.8 0 3.2 1.4 3.2 3.2 0 1.8-1.4 3.2-3.2 3.2h-8z"/>
    </svg>
  );
}

function NotionIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
      <path d="M15.2 10.8l14.4-1.1c1.8-.1 2.2 0 3.3.8l4.6 3.2c.8.5 1 .7 1 1.3v20.6c0 1.1-.4 1.8-1.8 1.9l-17.2 1c-1 0-1.5-.1-2-.8l-3.7-4.8c-.6-.8-.9-1.4-.9-2.1V12.6c0-.9.4-1.7 1.8-1.8z" fill="#000"/>
      <path d="M29.6 9.7l-14.4 1.1c-1.4.1-1.8.9-1.8 1.8v18.2c0 .7.3 1.3.9 2.1l3.7 4.8c.5.7 1 .8 2 .8l17.2-1c1.4-.1 1.8-.8 1.8-1.9V15c0-.6-.2-.8-1-1.3l-4.6-3.2c-1.1-.8-1.5-.9-3.3-.8z" fill="#fff" stroke="#e0e0e0" strokeWidth=".5"/>
      <path d="M20.8 15.6c-1.1.1-1.4.1-2-.4l-2.6-2c-.3-.2-.1-.5.3-.5l13.7-1c1.2-.1 1.7.3 2.2.7l3 2.1c.1.1.3.3.3.5 0 .3-.3.3-.6.3l-14.3.3z" fill="#000"/>
      <path d="M17.4 34.5V18.1c0-.6.2-.9.8-1l14.9-.8c.5 0 .8.3.8.9v16.2c0 .6-.1 1.1-.9 1.1l-14.3.8c-.8.1-1.3-.2-1.3-.8z" fill="#000"/>
      <path d="M30.4 19.5c.1.5 0 1-.5 1l-.7.2v12c-.6.3-1.2.4-1.6.4-.8 0-1-.2-1.5-.8l-4.8-7.5v7.2l1.5.3s0 .8-1.1.8l-2.9.2c-.1-.2 0-.6.3-.7l.7-.2v-9.5l-1-.1c-.1-.5.2-1.1.8-1.2l3.1-.2 5 7.6v-6.7l-1.2-.1c-.1-.6.3-1 .8-1l3.1-.2z" fill="#fff"/>
    </svg>
  );
}

function HubSpotIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#FF7A59"/>
      <path d="M32.5 18.5v-3.2a2.8 2.8 0 0 0 1.6-2.5c0-1.5-1.3-2.8-2.8-2.8s-2.8 1.3-2.8 2.8c0 1.1.7 2.1 1.6 2.5v3.2c-1.5.4-2.8 1.2-3.9 2.3l-10.3-8c.1-.3.1-.6.1-.9 0-2-1.7-3.7-3.7-3.7S8.6 9.9 8.6 11.9s1.7 3.7 3.7 3.7c.7 0 1.3-.2 1.8-.5l10.1 7.9c-1 1.4-1.5 3.1-1.5 4.8 0 4.7 3.8 8.5 8.5 8.5s8.5-3.8 8.5-8.5c0-4.2-3-7.7-7.2-8.3zm-1.2 13.6c-2.9 0-5.3-2.4-5.3-5.3s2.4-5.3 5.3-5.3 5.3 2.4 5.3 5.3-2.4 5.3-5.3 5.3z" fill="#fff"/>
    </svg>
  );
}

function GitHubIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#24292f"/>
      <path d="M24 6C14.06 6 6 14.06 6 24c0 7.95 5.16 14.69 12.31 17.08.9.17 1.23-.39 1.23-.87 0-.43-.02-1.56-.02-3.06-5.01 1.09-6.07-2.41-6.07-2.41-.82-2.08-2-2.63-2-2.63-1.63-1.11.12-1.09.12-1.09 1.81.13 2.76 1.86 2.76 1.86 1.6 2.75 4.21 1.96 5.24 1.5.16-1.16.63-1.96 1.14-2.41-4-.45-8.2-2-8.2-8.9 0-1.97.7-3.57 1.86-4.83-.19-.46-.81-2.29.18-4.77 0 0 1.52-.49 4.97 1.84A17.34 17.34 0 0 1 24 14.51c1.54.01 3.08.21 4.53.61 3.45-2.33 4.96-1.84 4.96-1.84.99 2.48.37 4.31.18 4.77 1.16 1.26 1.86 2.86 1.86 4.83 0 6.92-4.21 8.44-8.22 8.89.65.56 1.22 1.66 1.22 3.34 0 2.41-.02 4.36-.02 4.95 0 .48.33 1.05 1.24.87C36.85 38.68 42 31.94 42 24c0-9.94-8.06-18-18-18z" fill="#fff"/>
    </svg>
  );
}

function JiraIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#0052CC"/>
      <path d="M37.4 22.6L25.4 10.6 24 9.2l-13.4 13.4c-.5.5-.5 1.3 0 1.8l8.6 8.6L24 37.8l13.4-13.4c.5-.5.5-1.3 0-1.8zM24 28.2l-4.2-4.2L24 19.8l4.2 4.2L24 28.2z" fill="#fff"/>
    </svg>
  );
}

function SalesforceIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#00A1E0"/>
      <path d="M20.1 14.2c1.3-1.4 3.1-2.2 5.1-2.2 2.5 0 4.7 1.3 5.9 3.2 1.1-.5 2.3-.7 3.5-.7 4.8 0 8.7 3.9 8.7 8.7s-3.9 8.7-8.7 8.7c-.6 0-1.1-.1-1.7-.2-1.1 1.9-3.1 3.2-5.5 3.2-1.1 0-2.2-.3-3.1-.8-1.1 2.3-3.5 3.9-6.2 3.9-2.8 0-5.2-1.7-6.3-4.1-.5.1-1 .1-1.5.1C6.2 34 3 30.8 3 26.7c0-3 1.8-5.6 4.4-6.8-.2-.7-.3-1.5-.3-2.3 0-4.5 3.7-8.2 8.2-8.2 2 0 3.7.7 5.1 1.8l-.3 3z" fill="#fff"/>
    </svg>
  );
}

function MetaAdsIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#0081FB"/>
      <path d="M14.5 18c-2.5 0-4.5 2.7-4.5 6.5 0 2.5.8 4.3 1.9 5.5.8 1 1.8 1.4 2.7 1.4 1.2 0 2.2-.5 3.6-2.6l2-3.1 2 3.1c1.4 2.1 2.4 2.6 3.6 2.6.9 0 1.9-.4 2.7-1.4 1.1-1.2 1.9-3 1.9-5.5 0-3.8-2-6.5-4.5-6.5-1.6 0-2.8 1-4.3 3.2L24 22l-1.6-2.8C20.8 17 19.6 18 14.5 18zm20 0c-1.6 0-2.8 1-4.3 3.2L24 31.4h4.7l6.9-10.8c1.4 2.1 2.4 2.6 3.6 2.6.9 0 1.9-.4 2.7-1.4 1.1-1.2 1.9-3 1.9-5.5 0-3.8-2-6.5-4.5-6.5z" fill="#fff"/>
    </svg>
  );
}

function TwitterAdsIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#000"/>
      <path d="M28.97 13h4.26l-9.31 10.64L34.56 35h-8.58l-6.72-8.78L12.16 35H7.9l9.96-11.38L7.44 13h8.8l6.07 8.02L28.97 13zm-1.5 19.77h2.36L16.65 15.42h-2.53l13.35 17.35z" fill="#fff"/>
      <circle cx="37" cy="13" r="6" fill="#1DA1F2"/>
      <text x="37" y="16" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Arial">$</text>
    </svg>
  );
}

function TelegramIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#26A5E4"/>
      <path d="M10.9 23.3l21.8-8.4c1-.4 4.3-1.8 4.3-1.8s1.5-.6 1.4.8c0 .6-.1 2.6-.1 4.8l-1.7 14.6s-.1 1.4-1.4 1.5c-1.3.1-3.4-2.4-3.8-2.7-.3-.2-5.7-3.7-7.7-5.4-.5-.5-1.1-1.4.1-2.5l8.1-7.7c.9-.9.9-3-2-1l-10.8 7.3s-1.1.7-3.2.1l-4.5-1.4s-1.7-1-.4-2.2z" fill="#fff"/>
    </svg>
  );
}

function SemrushIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#FF642D"/>
      <text x="24" y="30" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="Arial">S</text>
    </svg>
  );
}

function AhrefsIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#1D4ED8"/>
      <text x="24" y="30" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="Arial">Ah</text>
    </svg>
  );
}

function StripeIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#635BFF"/>
      <path d="M22.3 19.8c0-1.2 1-1.7 2.6-1.7 2.3 0 5.2.7 7.5 2v-7.1c-2.5-1-5-1.4-7.5-1.4-6.1 0-10.2 3.2-10.2 8.5 0 8.3 11.4 7 11.4 10.6 0 1.4-1.2 1.9-2.9 1.9-2.5 0-5.7-1-8.2-2.4v7.2c2.8 1.2 5.6 1.7 8.2 1.7 6.3 0 10.6-3.1 10.6-8.5-.1-9-11.5-7.4-11.5-10.8z" fill="#fff"/>
    </svg>
  );
}

function AirtableIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#18BFFF"/>
      <path d="M23.1 9.1L9.4 14.7c-.7.3-.7 1.3 0 1.6l13.8 5.3c.5.2 1.1.2 1.6 0l13.8-5.3c.7-.3.7-1.3 0-1.6L24.8 9.1c-.5-.2-1.2-.2-1.7 0z" fill="#FCB400"/>
      <path d="M25.3 24.2v13.2c0 .6.6 1 1.1.8l14.8-5.7c.4-.2.7-.5.7-1V18.3c0-.6-.6-1-1.1-.8L26 23.2c-.4.2-.7.5-.7 1z" fill="#18BFFF"/>
      <path d="M22.7 24.2v13.2c0 .6-.6 1-1.1.8L6.8 32.5c-.4-.2-.7-.5-.7-1V18.3c0-.6.6-1 1.1-.8L22 23.2c.4.2.7.5.7 1z" fill="#F82B60"/>
    </svg>
  );
}

function YouTubeIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#FF3D00" d="M43.2 13.6c-.5-1.8-1.9-3.2-3.7-3.7C36.2 9 24 9 24 9s-12.2 0-15.5.9c-1.8.5-3.2 1.9-3.7 3.7C4 16.9 4 24 4 24s0 7.1.8 10.4c.5 1.8 1.9 3.2 3.7 3.7C11.8 39 24 39 24 39s12.2 0 15.5-.9c1.8-.5 3.2-1.9 3.7-3.7C44 31.1 44 24 44 24s0-7.1-.8-10.4z"/>
      <path fill="#fff" d="M20 30.5V17.5l10 6.5z"/>
    </svg>
  );
}

function CalendlyIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#006BFF"/>
      <path d="M31 17.5c-1.4-1.4-3.3-2.2-5.3-2.2-2 0-3.9.8-5.3 2.2-1.4 1.4-2.2 3.3-2.2 5.3 0 2 .8 3.9 2.2 5.3l5.3 5.3 5.3-5.3c1.4-1.4 2.2-3.3 2.2-5.3 0-2-.8-3.9-2.2-5.3zm-5.3 8.5c-1.8 0-3.2-1.4-3.2-3.2s1.4-3.2 3.2-3.2 3.2 1.4 3.2 3.2-1.4 3.2-3.2 3.2z" fill="#fff"/>
    </svg>
  );
}

function ThreadsIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#000" />
      <path
        d="M32.5 22.3c-.1-.1-.3-.1-.4-.2-1-4.5-4.1-7-8.5-7-3.1 0-5.7 1.5-7.1 4.1l2.8 1.6c1-1.8 2.5-2.7 4.3-2.7 1.7 0 2.9.5 3.7 1.5.6.7.9 1.7 1.1 2.8-1.2-.3-2.5-.4-3.9-.4-4.5 0-7.4 2.3-7.4 5.7 0 3.4 2.8 5.6 6.3 5.6 2.7 0 4.7-1.2 5.9-3.5.7-1.3 1-2.9 1.1-4.9 1.3.8 2.2 1.9 2.6 3.3.5 1.8.6 3.5-.3 5.2-1.6 3-4.7 4.2-8.3 4.2-4 0-7.1-1.3-9.1-3.9-1.8-2.3-2.8-5.6-2.8-9.6s1-7.3 2.8-9.6c2-2.6 5.1-3.9 9.1-3.9 4.1 0 7.2 1.3 9.2 4 1 1.3 1.7 2.9 2.2 4.7l3-1c-.6-2.3-1.6-4.2-2.9-5.9-2.6-3.3-6.4-5-11.4-5-5 0-8.8 1.7-11.4 5.1-2.2 2.8-3.4 6.7-3.4 11.6 0 4.9 1.2 8.8 3.4 11.6 2.6 3.3 6.4 5.1 11.4 5.1 4.6 0 8.3-1.7 10.5-5 1.4-2.5 1.5-5.3.8-8-.6-2.1-2-3.8-4-5zm-9.6 8c-2 0-3.3-1-3.3-2.5 0-1.9 1.7-2.7 4.3-2.7 1.2 0 2.3.1 3.3.4-.2 3.1-1.8 4.8-4.3 4.8z"
        fill="#fff"
      />
    </svg>
  );
}

function EmailIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <rect width="48" height="48" rx="10" fill="#0EA5E9" />
      <path
        d="M10 16c0-1.1.9-2 2-2h24c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H12c-1.1 0-2-.9-2-2V16z"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      />
      <path
        d="M10 16l14 10 14-10"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS: Record<string, (props: SvgProps) => React.ReactElement> = {
  gmail: GmailIcon,
  calendar: CalendarIcon,
  drive: DriveIcon,
  googleAds: GoogleAdsIcon,
  searchConsole: SearchConsoleIcon,
  linkedin: LinkedInIcon,
  openRouter: OpenRouterIcon,
  twitter: TwitterIcon,
  slack: SlackIcon,
  notion: NotionIcon,
  hubspot: HubSpotIcon,
  github: GitHubIcon,
  jira: JiraIcon,
  salesforce: SalesforceIcon,
  metaAds: MetaAdsIcon,
  twitterAds: TwitterAdsIcon,
  telegram: TelegramIcon,
  semrush: SemrushIcon,
  ahrefs: AhrefsIcon,
  stripe: StripeIcon,
  airtable: AirtableIcon,
  calendly: CalendlyIcon,
  youtube: YouTubeIcon,
  threads: ThreadsIcon,
  email: EmailIcon,
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
