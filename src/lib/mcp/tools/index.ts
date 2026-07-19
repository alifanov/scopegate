import type { ToolDefinition } from './types';
export type { ToolContext, ToolDefinition } from './types';

import { gmailTools } from './gmail';
import { calendarTools } from './calendar';
import { driveTools } from './drive';
import { googleAdsTools } from './google-ads';
import { searchConsoleTools } from './google-search-console';
import { openRouterTools } from './openrouter';
import { linkedinTools } from './linkedin';
import { twitterTools } from './twitter';
import { slackTools } from './slack';
import { notionTools } from './notion';
import { hubspotTools } from './hubspot';
import { githubTools } from './github';
import { jiraTools } from './jira';
import { salesforceTools } from './salesforce';
import { metaAdsTools } from './meta-ads';
import { twitterAdsTools } from './twitter-ads';
import { telegramTools } from './telegram';
import { semrushTools } from './semrush';
import { ahrefsTools } from './ahrefs';
import { stripeTools } from './stripe';
import { airtableTools } from './airtable';
import { calendlyTools } from './calendly';
import { youtubeTools } from './youtube';
import { threadsTools } from './threads';
import { instagramTools } from './instagram';
import { emailTools } from './email';
import { googleTagManagerTools } from './google-tag-manager';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  ...gmailTools,
  ...calendarTools,
  ...driveTools,
  ...googleAdsTools,
  ...searchConsoleTools,
  ...openRouterTools,
  ...linkedinTools,
  ...twitterTools,
  ...slackTools,
  ...notionTools,
  ...hubspotTools,
  ...githubTools,
  ...jiraTools,
  ...salesforceTools,
  ...metaAdsTools,
  ...twitterAdsTools,
  ...telegramTools,
  ...semrushTools,
  ...ahrefsTools,
  ...stripeTools,
  ...airtableTools,
  ...calendlyTools,
  ...youtubeTools,
  ...threadsTools,
  ...instagramTools,
  ...emailTools,
  ...googleTagManagerTools,
];

export function getToolsByActions(actions: string[]): ToolDefinition[] {
  const actionSet = new Set(actions);
  return TOOL_DEFINITIONS.filter((t) => actionSet.has(t.action));
}
