export interface Permission {
  name: string;
  description: string;
  example: string;
}

export interface IntegrationData {
  slug: string;
  service: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  intro: string;
  problem: string;
  permissions: Permission[];
  useCases: string[];
  relatedIntegrations: string[];
}

export const integrations: IntegrationData[] = [
  {
    slug: "google-drive",
    service: "Google Drive",
    icon: "\uD83D\uDCC1",
    metaTitle: "Secure Google Drive for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Restrict AI agent access to specific Google Drive folders. Prevent file deletion, limit to read-only, and control which directories your agents can see.",
    headline: "Secure Google Drive Access for AI Agents",
    intro:
      "Google Drive is the backbone of document storage for most teams, which makes it a prime target for AI agent access. But a single OAuth scope grants access to every file, folder, and shared drive in your account. ScopeGate lets you expose only the folders your agent actually needs \u2014 nothing more.",
    problem:
      "Without scoped access, an AI agent with Google Drive permissions can browse your entire file tree, read confidential HR documents, download financial spreadsheets, and even permanently delete files. A misconfigured prompt or a prompt-injection attack could lead to mass file deletion or exfiltration of sensitive data across every shared drive in your organization.",
    permissions: [
      {
        name: "Folder-scoped read",
        description:
          "Restrict the agent to reading files within one or more specific folders, hiding everything else in the drive.",
        example:
          "Allow reading only files inside /Projects/Marketing-Q1 \u2014 the agent cannot see or access /Finance or /HR.",
      },
      {
        name: "No delete",
        description:
          "Strip all delete and trash capabilities so the agent can never remove files, even if instructed to.",
        example:
          "Agent can summarize and quote documents but cannot move them to trash or permanently delete them.",
      },
      {
        name: "Download prevention",
        description:
          "Allow the agent to read file metadata and content in-place without downloading or exporting copies.",
        example:
          "Agent reads a Google Doc's text for analysis but cannot export it as PDF or DOCX.",
      },
      {
        name: "Specific file type access",
        description:
          "Limit the agent to interacting with certain file types only, such as Google Docs but not Sheets or Slides.",
        example:
          "Agent processes only .pdf and .docx files in the target folder, ignoring spreadsheets and presentations.",
      },
    ],
    useCases: [
      "AI research assistant that reads project briefs from a specific folder to answer team questions",
      "Document summarization bot that processes new files in a shared marketing folder",
      "Compliance checker that scans contracts in a legal folder without accessing other departments",
      "Meeting notes organizer that reads transcripts from one folder and creates summaries",
    ],
    relatedIntegrations: ["google-calendar", "gmail", "notion"],
  },
  {
    slug: "gmail",
    service: "Gmail",
    icon: "\u2709\uFE0F",
    metaTitle: "Secure Gmail for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Control how AI agents interact with Gmail. Enable send-only, read-only, or label-specific access. Prevent inbox snooping and unauthorized email sending.",
    headline: "Secure Gmail Access for AI Agents",
    intro:
      "Email is one of the most sensitive channels in any workflow \u2014 it contains contracts, credentials, personal conversations, and confidential business data. Giving an AI agent full Gmail access is like handing over the keys to your digital identity. ScopeGate lets you carve out exactly which email capabilities your agent needs.",
    problem:
      "A fully-authorized Gmail agent can read every email in your inbox, send messages as you to any recipient, delete conversations, and access attachments containing passwords or financial data. Without restrictions, a compromised agent could impersonate you, forward sensitive threads to external addresses, or silently delete evidence of its own actions.",
    permissions: [
      {
        name: "Send-only mode",
        description:
          "Allow the agent to compose and send emails without reading any inbox content.",
        example:
          "Agent sends weekly project status reports to stakeholders but cannot read incoming replies or other threads.",
      },
      {
        name: "Read-only mode",
        description:
          "Allow the agent to read and search emails without sending, deleting, or modifying any messages.",
        example:
          "Agent scans incoming support emails to extract ticket information but cannot reply or forward them.",
      },
      {
        name: "Label-scoped access",
        description:
          "Restrict the agent to emails within specific Gmail labels, hiding all other conversations.",
        example:
          "Agent can only see emails labeled 'Vendor Invoices' \u2014 personal emails and other business threads are invisible.",
      },
      {
        name: "No attachment access",
        description:
          "Allow reading email body text while blocking access to any file attachments.",
        example:
          "Agent processes the text of customer inquiries but cannot open or download attached contracts or spreadsheets.",
      },
    ],
    useCases: [
      "Customer support triage bot that reads emails labeled 'Support' and categorizes them by urgency",
      "Outreach agent that sends personalized follow-up emails from templates without reading your inbox",
      "Invoice processing assistant that reads emails in a 'Billing' label to extract payment information",
      "Newsletter drafting agent that composes and sends marketing emails on a schedule",
    ],
    relatedIntegrations: ["google-drive", "google-calendar", "slack"],
  },
  {
    slug: "google-calendar",
    service: "Google Calendar",
    icon: "\uD83D\uDCC5",
    metaTitle: "Secure Google Calendar for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Limit AI agent access to Google Calendar. Enable read-only events, block event creation or deletion, and restrict to specific calendars.",
    headline: "Secure Google Calendar Access for AI Agents",
    intro:
      "Calendar data reveals your daily schedule, meeting participants, locations, and private notes \u2014 a detailed map of your professional life. AI agents that help with scheduling need some calendar access, but they rarely need all of it. ScopeGate ensures your agent sees only the calendars and event details you explicitly allow.",
    problem:
      "An unrestricted calendar agent can view every event across all your calendars, including personal appointments, confidential 1-on-1s, and private notes in event descriptions. It can also create fake meetings, delete real ones, or invite external participants to internal events \u2014 disrupting your schedule and leaking organizational information.",
    permissions: [
      {
        name: "Read-only events",
        description:
          "Allow the agent to view event titles, times, and attendees without creating, modifying, or deleting any events.",
        example:
          "Agent checks your availability for the week to suggest meeting times but cannot book anything.",
      },
      {
        name: "No event creation",
        description:
          "Block the agent from adding new events to any calendar while still allowing it to read existing ones.",
        example:
          "Agent reads upcoming deadlines from your project calendar but cannot create new entries.",
      },
      {
        name: "Specific calendar access",
        description:
          "Restrict the agent to one or more named calendars, hiding all others.",
        example:
          "Agent accesses only your 'Work' calendar \u2014 personal, family, and holiday calendars are invisible.",
      },
      {
        name: "Hide attendee details",
        description:
          "Allow the agent to see event times and titles but strip attendee lists and email addresses.",
        example:
          "Agent sees you have a 'Board Meeting' at 2pm but cannot see who else is invited.",
      },
    ],
    useCases: [
      "Scheduling assistant that reads free/busy times and suggests optimal meeting slots",
      "Daily briefing agent that summarizes your upcoming meetings each morning",
      "Project tracker that monitors milestone events on a shared team calendar",
      "Time audit tool that analyzes how you spend your week based on calendar categories",
    ],
    relatedIntegrations: ["gmail", "slack", "notion"],
  },
  {
    slug: "slack",
    service: "Slack",
    icon: "\uD83D\uDCAC",
    metaTitle: "Secure Slack for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Restrict AI agent access to specific Slack channels. Enable read-only mode, block DM access, and rate-limit message posting.",
    headline: "Secure Slack Access for AI Agents",
    intro:
      "Slack is where your team shares everything \u2014 strategy discussions, customer complaints, hiring decisions, and credentials. AI agents that participate in Slack workflows can be incredibly useful, but standard Slack bot tokens grant workspace-wide visibility. ScopeGate puts channel-level boundaries around what your agent can see and do.",
    problem:
      "A Slack bot with broad permissions can read every public and private channel, browse direct messages between employees, access shared files and credentials, and post messages impersonating the bot in any channel. Without guardrails, a compromised agent could harvest confidential conversations, spam channels, or leak private discussions to external systems.",
    permissions: [
      {
        name: "Channel-specific access",
        description:
          "Restrict the agent to one or more named channels, hiding all other channels and conversations.",
        example:
          "Agent monitors only #customer-support and #bug-reports \u2014 cannot see #executive-team or #salary-discussions.",
      },
      {
        name: "Read-only mode",
        description:
          "Allow the agent to read messages in permitted channels without posting, reacting, or threading.",
        example:
          "Agent reads #product-feedback to extract feature requests but cannot reply or react to messages.",
      },
      {
        name: "No DM access",
        description:
          "Block the agent from reading or sending direct messages, limiting it to channel-based interactions only.",
        example:
          "Agent operates in public channels but has zero visibility into any private 1-on-1 conversations.",
      },
      {
        name: "Rate-limited posting",
        description:
          "Cap the number of messages the agent can send per minute or per hour to prevent spam.",
        example:
          "Agent can post at most 5 messages per hour in #daily-standup to share summaries, preventing message floods.",
      },
    ],
    useCases: [
      "Standup bot that reads messages in #engineering and posts daily summaries",
      "Customer escalation agent that monitors #support and flags urgent issues to #support-escalation",
      "Knowledge base assistant that answers questions in #help-desk by reading pinned resources",
      "Incident response bot that posts alerts to #incidents from monitoring data without reading other channels",
    ],
    relatedIntegrations: ["gmail", "notion", "github"],
  },
  {
    slug: "notion",
    service: "Notion",
    icon: "\uD83D\uDCD3",
    metaTitle: "Secure Notion for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Limit AI agent access to specific Notion databases and pages. Enforce read-only mode and prevent workspace-wide browsing.",
    headline: "Secure Notion Access for AI Agents",
    intro:
      "Notion has become the operating system for many companies \u2014 housing wikis, product roadmaps, meeting notes, and HR policies in one workspace. The Notion API grants access at the integration level, which typically means the entire workspace. ScopeGate lets you scope an agent down to the specific databases and pages it actually needs.",
    problem:
      "A Notion integration with workspace-level access can read every page, database, and comment \u2014 including employee handbooks, compensation data, board meeting notes, and strategic plans. It can also edit or delete any page, potentially corrupting critical documentation or exposing proprietary roadmap details to external systems.",
    permissions: [
      {
        name: "Database-specific access",
        description:
          "Restrict the agent to one or more Notion databases by ID, hiding all other content in the workspace.",
        example:
          "Agent queries the 'Customer Feedback' database but cannot see the 'Hiring Pipeline' or 'Board Notes' databases.",
      },
      {
        name: "Page-level read-only",
        description:
          "Allow the agent to read specific pages without editing, commenting, or creating new content.",
        example:
          "Agent reads the 'Product Roadmap Q2' page to answer questions but cannot modify priorities or add items.",
      },
      {
        name: "No workspace browsing",
        description:
          "Prevent the agent from listing or searching across the workspace, limiting it to pre-configured content.",
        example:
          "Agent cannot use the search API to discover pages \u2014 it can only access the databases explicitly granted.",
      },
      {
        name: "Block property access",
        description:
          "Hide specific database properties from the agent while allowing access to the rest of the data.",
        example:
          "Agent sees task names, statuses, and due dates but cannot see the 'Internal Notes' or 'Cost' properties.",
      },
    ],
    useCases: [
      "Project status agent that reads a task database and generates weekly progress reports",
      "Onboarding assistant that answers new hire questions from a specific wiki section",
      "Meeting notes summarizer that reads pages in a 'Meeting Notes' database and extracts action items",
      "Product research bot that queries a feedback database to surface common feature requests",
    ],
    relatedIntegrations: ["google-drive", "slack", "github"],
  },
  {
    slug: "github",
    service: "GitHub",
    icon: "\uD83D\uDC19",
    metaTitle: "Secure GitHub for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Control AI agent access to GitHub repos. Enforce read-only code access, block admin actions, and prevent secrets exposure.",
    headline: "Secure GitHub Access for AI Agents",
    intro:
      "GitHub houses your source code, CI/CD pipelines, secrets, and deployment configurations. AI coding agents are transforming development workflows, but GitHub's permission model grants tokens broad access across repositories. ScopeGate ensures your AI agent can read or contribute to specific repos without risking your entire codebase.",
    problem:
      "A GitHub token with repo scope can read and write to every repository in your organization, access encrypted secrets, modify branch protection rules, manage webhooks, and delete repositories. A compromised coding agent could inject malicious code, exfiltrate proprietary source code, expose API keys stored in secrets, or disable security protections.",
    permissions: [
      {
        name: "Specific repo access",
        description:
          "Restrict the agent to one or more repositories by name, hiding all other repos in the organization.",
        example:
          "Agent can access 'frontend-app' and 'design-system' but cannot see 'infrastructure' or 'salary-calculator'.",
      },
      {
        name: "Read-only code",
        description:
          "Allow the agent to read source code, issues, and pull requests without pushing commits or merging.",
        example:
          "Agent reviews code in pull requests and leaves comments but cannot push changes or approve merges.",
      },
      {
        name: "No admin access",
        description:
          "Block all administrative actions including repository settings, branch protection, and team management.",
        example:
          "Agent can interact with code and issues but cannot change branch rules, add collaborators, or delete the repo.",
      },
      {
        name: "No secrets access",
        description:
          "Prevent the agent from reading, creating, or modifying repository or organization secrets.",
        example:
          "Agent can read workflow files but cannot access the encrypted secrets used in CI/CD pipelines.",
      },
    ],
    useCases: [
      "Code review agent that reads pull requests and suggests improvements without pushing code",
      "Documentation bot that reads source code to auto-generate API reference pages",
      "Issue triage agent that labels and categorizes new issues based on content analysis",
      "Dependency audit assistant that scans package files across specific repos for vulnerabilities",
    ],
    relatedIntegrations: ["slack", "notion", "google-drive"],
  },
  {
    slug: "twitter",
    service: "Twitter/X",
    icon: "\uD83D\uDC26",
    metaTitle: "Secure Twitter/X for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Control AI agent posting on Twitter/X. Enable post-only mode, block DM reading, rate-limit tweets, and restrict to specific accounts.",
    headline: "Secure Twitter/X Access for AI Agents",
    intro:
      "Social media agents can amplify your brand, but Twitter's API grants broad account control once authorized. An agent that posts updates should not also be able to read your private DMs, follow/unfollow accounts, or tweet without rate limits. ScopeGate creates a controlled posting lane for your AI agent on Twitter/X.",
    problem:
      "An unrestricted Twitter agent can read all your direct messages, follow or unfollow accounts en masse, like or retweet content that conflicts with your brand, delete past tweets, and post unlimited content that could trigger spam flags or damage your reputation. A single rogue prompt could cause a PR crisis before anyone notices.",
    permissions: [
      {
        name: "Post-only mode",
        description:
          "Allow the agent to create tweets and threads without reading timelines, DMs, or follower data.",
        example:
          "Agent publishes scheduled content threads but cannot browse your timeline or see who follows you.",
      },
      {
        name: "No DM reading",
        description:
          "Block all access to direct messages, preventing the agent from reading or sending private conversations.",
        example:
          "Agent manages your public tweets but has zero visibility into any private message conversations.",
      },
      {
        name: "Rate-limited posting",
        description:
          "Cap the number of tweets the agent can publish per day to prevent spam and API abuse.",
        example:
          "Agent can post a maximum of 10 tweets per day, preventing accidental flooding of your followers' timelines.",
      },
      {
        name: "No follow/unfollow",
        description:
          "Prevent the agent from following, unfollowing, blocking, or muting any accounts.",
        example:
          "Agent publishes content but cannot change your follow list or block/mute other users.",
      },
    ],
    useCases: [
      "Content scheduler agent that publishes pre-approved tweet threads at optimal times",
      "Product launch bot that posts announcements and feature highlights on release day",
      "Social listening agent that reads public mentions (not DMs) and drafts response suggestions",
      "Thread writer agent that converts blog posts into Twitter threads for distribution",
    ],
    relatedIntegrations: ["linkedin", "slack", "notion"],
  },
  {
    slug: "linkedin",
    service: "LinkedIn",
    icon: "\uD83D\uDCBC",
    metaTitle: "Secure LinkedIn for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Control AI agent access to LinkedIn. Enable post-only mode, block connection data, and prevent messaging access for safe automation.",
    headline: "Secure LinkedIn Access for AI Agents",
    intro:
      "LinkedIn is your professional identity \u2014 your network, endorsements, and business reputation live there. AI agents that automate LinkedIn posting can save hours, but LinkedIn's API exposes connection graphs, messaging, and profile data. ScopeGate ensures your agent can post content without mining your professional network.",
    problem:
      "An agent with full LinkedIn access can harvest your entire connection list with emails and job titles, read and send messages on your behalf, view profile analytics of people you've stalked, and post content that misrepresents your professional brand. LinkedIn is also aggressive about banning accounts that exhibit bot-like behavior with broad API access.",
    permissions: [
      {
        name: "Post-only mode",
        description:
          "Allow the agent to publish posts and articles to your profile without accessing any other LinkedIn features.",
        example:
          "Agent publishes thought leadership posts on your behalf but cannot see your connections or messages.",
      },
      {
        name: "No connection data",
        description:
          "Block access to your connections list, including names, titles, emails, and mutual connections.",
        example:
          "Agent cannot export or read your connection list \u2014 your professional network stays private.",
      },
      {
        name: "No messaging access",
        description:
          "Prevent the agent from reading, sending, or deleting LinkedIn messages and InMail.",
        example:
          "Agent publishes content but cannot read recruiter messages, business inquiries, or any DMs.",
      },
      {
        name: "Company page restriction",
        description:
          "Limit the agent to posting on a specific company page rather than your personal profile.",
        example:
          "Agent posts only to the ScopeGate company page and cannot publish anything on your personal feed.",
      },
    ],
    useCases: [
      "Content marketing agent that publishes company updates and thought leadership posts",
      "Job posting bot that shares open positions on your company page on a schedule",
      "Event promotion agent that posts about upcoming webinars and conferences",
      "Repurposing agent that converts blog posts into LinkedIn articles without accessing your network",
    ],
    relatedIntegrations: ["twitter", "slack", "notion"],
  },
  {
    slug: "google-ads",
    service: "Google Ads",
    icon: "\uD83D\uDCB0",
    metaTitle: "Secure Google Ads for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Restrict AI agent access to Google Ads. Enforce read-only campaign data, block budget changes, and prevent unauthorized ad creation.",
    headline: "Secure Google Ads Access for AI Agents",
    intro:
      "Google Ads controls real advertising spend \u2014 budgets, bids, and targeting decisions that directly affect your revenue and costs. AI agents that analyze ad performance are valuable, but giving them write access to campaigns is a financial risk. ScopeGate lets you expose reporting data while keeping budget and creative controls locked down.",
    problem:
      "An agent with full Google Ads access can change daily budgets to unlimited, create new campaigns with arbitrary targeting, pause high-performing ads, modify bid strategies, and burn through your entire advertising budget in minutes. A single misinterpreted instruction could redirect thousands of dollars to ineffective keywords or audiences.",
    permissions: [
      {
        name: "Read-only campaign data",
        description:
          "Allow the agent to read campaign metrics, performance reports, and keyword data without modifying anything.",
        example:
          "Agent pulls daily spend, CTR, and conversion data for reporting but cannot change any campaign settings.",
      },
      {
        name: "No budget changes",
        description:
          "Block the agent from modifying daily budgets, bid strategies, or spending limits on any campaign.",
        example:
          "Agent can see that Campaign A has a $500/day budget but cannot increase, decrease, or reallocate it.",
      },
      {
        name: "No ad creation",
        description:
          "Prevent the agent from creating new ads, ad groups, or campaigns while allowing it to analyze existing ones.",
        example:
          "Agent analyzes the performance of existing ad copy but cannot create new ads or duplicate campaigns.",
      },
      {
        name: "Account-level restriction",
        description:
          "Limit the agent to a specific ads account in a multi-account (MCC) setup.",
        example:
          "Agent accesses only the 'US Brand Campaign' account and cannot see or modify ads in other regional accounts.",
      },
    ],
    useCases: [
      "Performance reporting agent that generates daily ad spend and ROAS summaries for stakeholders",
      "Keyword analysis bot that identifies underperforming keywords and suggests (but cannot implement) changes",
      "Competitor monitoring agent that tracks quality scores and auction insights across campaigns",
      "Budget forecasting assistant that reads historical spend data to predict monthly costs",
    ],
    relatedIntegrations: ["linkedin", "google-drive", "slack"],
  },
  {
    slug: "openrouter",
    service: "OpenRouter",
    icon: "\uD83E\uDD16",
    metaTitle: "Secure OpenRouter for AI Agents \u2014 ScopeGate MCP Proxy",
    metaDescription:
      "Control AI agent access to OpenRouter models. Set budget caps, restrict to specific models, and prevent API key exposure.",
    headline: "Secure OpenRouter Access for AI Agents",
    intro:
      "OpenRouter provides a unified API to dozens of LLM providers \u2014 OpenAI, Anthropic, Google, Meta, and more. When your AI agents call other models through OpenRouter, costs can spiral fast and API keys can leak. ScopeGate wraps OpenRouter access with budget limits and model restrictions so your agents stay within bounds.",
    problem:
      "An agent with unrestricted OpenRouter access can call any model at any price point \u2014 including expensive models like GPT-5 or Claude Opus at scale \u2014 and rack up hundreds of dollars in minutes. It can also expose your OpenRouter API key to downstream systems, access usage data from other projects, or bypass rate limits by spawning parallel requests.",
    permissions: [
      {
        name: "Specific model access",
        description:
          "Restrict the agent to a whitelist of approved models, blocking access to all others.",
        example:
          "Agent can call GPT-5-mini and Claude Haiku but cannot use GPT-5, Claude Opus, or any other premium model.",
      },
      {
        name: "Budget caps",
        description:
          "Set a maximum spend per hour, day, or month that the agent cannot exceed.",
        example:
          "Agent has a $10/day budget cap \u2014 once reached, all API calls are blocked until the next day.",
      },
      {
        name: "No API key exposure",
        description:
          "Proxy all requests through ScopeGate so the underlying OpenRouter API key is never visible to the agent.",
        example:
          "Agent sends requests to a ScopeGate MCP endpoint \u2014 the real OpenRouter key stays in ScopeGate's vault.",
      },
      {
        name: "Request rate limiting",
        description:
          "Cap the number of API calls the agent can make per minute to prevent runaway loops.",
        example:
          "Agent is limited to 30 requests per minute, preventing infinite retry loops from draining your budget.",
      },
    ],
    useCases: [
      "Multi-model research agent that queries different LLMs for comparison within a fixed budget",
      "Content generation pipeline that uses a specific cheap model for drafts and a better model for editing",
      "Customer support agent that routes queries to approved models without exposing API credentials",
      "Testing harness that evaluates prompt performance across models with strict per-run cost limits",
    ],
    relatedIntegrations: ["github", "slack", "notion"],
  },
];
