export interface GlossaryEntry {
  slug: string;
  term: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  tldr: string;
  sections: { heading: string; content: string }[];
  faq: { question: string; answer: string }[];
  relatedTerms: string[];
  ctaText: string;
}

export const glossaryEntries: GlossaryEntry[] = [
  {
    slug: "mcp-gateway",
    term: "MCP Gateway",
    metaTitle: "What is an MCP Gateway? | ScopeGate Glossary",
    metaDescription:
      "An MCP gateway is a central control point that routes, authenticates, and enforces permissions for AI agent connections to external services via the Model Context Protocol.",
    headline: "What is an MCP Gateway?",
    tldr:
      "An MCP gateway is an intermediary layer that sits between AI agents and MCP servers, providing centralized authentication, permission enforcement, rate limiting, and audit logging for every tool call an agent makes.",
    sections: [
      {
        heading: "What is the Model Context Protocol (MCP)?",
        content:
          "The Model Context Protocol (MCP) is an open standard, originally developed by Anthropic, that defines how AI agents discover and invoke external tools and data sources. Think of it as the USB-C of AI integrations: a single, universal connector that lets any compliant agent talk to any compliant service. MCP servers expose capabilities -- reading files, querying databases, sending emails -- through a structured JSON-RPC interface. Agents discover available tools at runtime, negotiate parameters, and execute calls without bespoke integration code for every service. The protocol is rapidly becoming the default wiring for agentic AI systems, with adoption across Claude, Cursor, Windsurf, and hundreds of community-built servers.",
      },
      {
        heading: "What is an MCP Gateway?",
        content:
          "An MCP gateway is a centralized control plane that mediates every connection between AI agents and the MCP servers they consume. Instead of agents connecting directly to each MCP server, all traffic flows through the gateway. This architecture gives organizations a single place to enforce authentication, authorize specific tool calls, apply rate limits, and record an audit trail. The gateway pattern is borrowed from the API gateway concept in microservices, adapted to the unique challenges of agentic AI: unpredictable tool discovery, multi-step reasoning chains, and the need for human-in-the-loop approval on sensitive actions. Without a gateway, each MCP server must independently handle auth, logging, and policy -- leading to inconsistent security postures and operational blind spots.",
      },
      {
        heading: "Why You Need an MCP Gateway",
        content:
          "Research from Invariant Labs found that 43% of popular MCP servers contain unsafe patterns such as unvalidated shell commands, hardcoded credentials, or excessive permission grants. When agents connect to these servers directly, there is no safety net. A gateway provides defense in depth: it can block calls to known-dangerous tools, enforce least-privilege access, and terminate sessions that exceed behavioral boundaries. For enterprises, a gateway also solves the compliance question. SOC 2, ISO 27001, and the EU AI Act all require demonstrable access controls and audit trails for automated systems acting on behalf of users. A centralized gateway makes these controls auditable and enforceable at scale.",
      },
      {
        heading: "Types of MCP Gateways",
        content:
          "MCP gateways generally fall into three categories. Proxy gateways act as reverse proxies, intercepting and forwarding MCP traffic with minimal transformation -- they add auth headers, log requests, and enforce rate limits. Registry gateways maintain a catalog of approved MCP servers and tools, acting as a service mesh control plane that governs which agents can discover which capabilities. Security gateways focus specifically on threat prevention: they scan tool call payloads for injection attacks, validate output schemas, and enforce content-safety policies. Many production deployments combine all three functions into a unified platform.",
      },
      {
        heading: "How to Choose an MCP Gateway",
        content:
          "When evaluating MCP gateways, prioritize these capabilities: granular per-agent permissions (not just per-user), OAuth 2.0 or token-based authentication with credential isolation, real-time audit logging with structured metadata, rate limiting at both the agent and tool level, and support for the latest MCP specification including streaming and server-sent events. Look for gateways that can be self-hosted for data sovereignty requirements, and that offer a managed cloud option for teams that want to move fast. Finally, verify that the gateway does not require changes to your existing MCP servers -- it should work as a transparent proxy layer.",
      },
    ],
    faq: [
      {
        question: "What is the difference between an MCP gateway and an MCP server?",
        answer:
          "An MCP server exposes specific tools and data sources (e.g., a Google Drive server, a PostgreSQL server). An MCP gateway sits in front of one or more MCP servers and enforces cross-cutting concerns like authentication, permissions, rate limiting, and logging. The gateway does not provide tools itself -- it governs access to the tools that servers provide.",
      },
      {
        question: "Do I need an MCP gateway if I only use one MCP server?",
        answer:
          "Yes. Even with a single MCP server, a gateway adds authentication, audit logging, and permission boundaries that the server likely does not provide on its own. As your usage grows, the gateway scales to multiple servers without architectural changes.",
      },
      {
        question: "Is an MCP gateway the same as an API gateway?",
        answer:
          "They share the same architectural pattern, but MCP gateways are purpose-built for the Model Context Protocol. They understand MCP-specific concepts like tool discovery, JSON-RPC tool calls, and agent sessions, which generic API gateways do not handle natively.",
      },
    ],
    relatedTerms: ["mcp-proxy", "mcp-security", "mcp-authentication", "mcp-oauth"],
    ctaText:
      "ScopeGate is an MCP gateway that gives you per-agent permission control, real-time audit trails, and instant credential revocation. Connect your services, define granular permissions, and hand your AI agents a single MCP endpoint URL -- fully governed.",
  },
  {
    slug: "mcp-security",
    term: "MCP Security",
    metaTitle: "MCP Security: Risks, Best Practices & Solutions",
    metaDescription:
      "Learn the top MCP security risks -- from tool poisoning to token theft -- and the best practices to secure your Model Context Protocol deployments.",
    headline: "MCP Security: Risks, Best Practices & Solutions",
    tldr:
      "MCP security covers the practices and tools needed to protect AI agent connections from threats like tool poisoning, prompt injection via tool descriptions, token theft, and excessive permissions. With 43% of popular MCP servers containing unsafe patterns, securing MCP is not optional.",
    sections: [
      {
        heading: "Why MCP Security Matters",
        content:
          "The Model Context Protocol gives AI agents direct access to external systems -- file storage, databases, email, code repositories, and more. This power creates a massive attack surface. A compromised or poorly configured MCP server can allow an agent to execute arbitrary shell commands, exfiltrate sensitive data, or modify production systems. Invariant Labs' audit of popular MCP servers found that 43% contained at least one critical security vulnerability, including unvalidated shell execution, hardcoded API keys, and missing input sanitization. As MCP adoption accelerates, these risks compound: organizations are connecting dozens of MCP servers without centralized security controls, creating a fragmented and opaque permission landscape.",
      },
      {
        heading: "Top MCP Security Risks",
        content:
          "Tool poisoning is the most novel MCP-specific threat: attackers embed malicious instructions in tool descriptions or parameter schemas that manipulate the agent's behavior at inference time. Because agents read tool metadata to decide how to use tools, poisoned descriptions can redirect data exfiltration through seemingly benign tool calls. Token theft occurs when MCP servers store OAuth tokens or API keys insecurely -- a single compromised server can leak credentials for every connected service. Excessive permissions are the most common risk: MCP servers often request broad OAuth scopes (full Drive access, unrestricted email send) when agents only need narrow capabilities. Cross-server data leakage happens when agents combine data from multiple MCP servers in ways that violate data isolation policies. Finally, prompt injection through tool outputs can manipulate agent reasoning when untrusted data is returned from MCP tool calls.",
      },
      {
        heading: "MCP Security Best Practices",
        content:
          "Apply least-privilege access at the tool level, not just the server level -- if an agent only needs to read calendar events, do not grant it write access. Use a centralized gateway to authenticate every MCP connection and enforce permission policies consistently across all servers. Rotate credentials regularly and never store tokens in MCP server code or environment variables without encryption. Validate tool call inputs against strict schemas before execution, and sanitize tool outputs before they are returned to agents. Implement rate limiting per agent and per tool to contain the blast radius of compromised sessions. Log every tool call with full request and response metadata for forensic analysis. Pin MCP server versions and audit new releases before deployment -- supply chain attacks through malicious server updates are a real and growing threat.",
      },
      {
        heading: "Tools and Solutions for MCP Security",
        content:
          "MCP security tools fall into three categories. Static analysis tools like Invariant's MCP scanner audit server code for known vulnerability patterns before deployment. Runtime enforcement tools -- MCP gateways and proxies -- sit between agents and servers, applying real-time policy checks, rate limiting, and credential management. Monitoring and alerting platforms capture tool call logs and flag anomalous behavior (e.g., an agent suddenly reading 10,000 files when it typically reads 10). The most effective security posture combines all three: scan servers before connecting them, enforce policies at runtime through a gateway, and monitor for anomalies continuously. For enterprises, this stack maps directly to SOC 2 and EU AI Act requirements for automated system governance.",
      },
    ],
    faq: [
      {
        question: "What is tool poisoning in MCP?",
        answer:
          "Tool poisoning is an attack where malicious instructions are embedded in MCP tool descriptions or parameter schemas. When an AI agent reads these descriptions to decide how to use a tool, the poisoned content can manipulate its behavior -- for example, causing the agent to exfiltrate data through a seemingly innocuous tool call.",
      },
      {
        question: "How do I audit the security of an MCP server?",
        answer:
          "Use static analysis tools to scan the server code for hardcoded credentials, unvalidated inputs, and unsafe shell execution. Review the OAuth scopes it requests -- flag any that exceed the minimum required. Test it in a sandboxed environment with a gateway that logs all tool calls, and review the logs for unexpected behavior.",
      },
      {
        question: "Is MCP secure by default?",
        answer:
          "No. The MCP specification defines the protocol for tool discovery and invocation, but security is the responsibility of each server implementor and the connecting infrastructure. Without explicit security controls like authentication, input validation, and audit logging, MCP connections are inherently vulnerable.",
      },
    ],
    relatedTerms: ["mcp-gateway", "mcp-authentication", "mcp-oauth", "agentic-ai-security"],
    ctaText:
      "ScopeGate secures your MCP stack with per-agent permissions, credential isolation, real-time audit trails, and rate limiting. Connect services once, define granular policies, and stop worrying about what your agents can access.",
  },
  {
    slug: "mcp-authentication",
    term: "MCP Authentication",
    metaTitle: "MCP Authentication: OAuth, Tokens & Access Control",
    metaDescription:
      "How MCP authentication works: OAuth 2.0 flows, token management, session-based auth, and best practices for securing AI agent access to external services.",
    headline: "MCP Authentication: OAuth, Tokens & Access Control",
    tldr:
      "MCP authentication is the process of verifying the identity of AI agents and users before allowing tool calls through the Model Context Protocol. It typically uses OAuth 2.0, bearer tokens, or session-based auth to ensure only authorized agents access external services.",
    sections: [
      {
        heading: "How MCP Authentication Works",
        content:
          "MCP authentication operates at two layers. The first layer authenticates the user or system that owns the agent -- proving they have a valid account and have granted consent for the agent to act on their behalf. The second layer authenticates the agent session itself, ensuring that a specific agent instance has a valid, non-expired credential to make tool calls. In practice, this usually means the user completes an OAuth consent flow once, the resulting tokens are stored securely, and the agent presents a session token or bearer token with each MCP request. The MCP server (or an intermediary gateway) validates this token before executing any tool call. Without both layers, you either have unauthenticated agents accessing services (a security disaster) or no way to distinguish between different agents acting on behalf of the same user.",
      },
      {
        heading: "OAuth 2.0 for MCP Servers",
        content:
          "OAuth 2.0 is the dominant authentication mechanism for MCP servers that connect to third-party services like Google, GitHub, Slack, and Microsoft 365. The MCP specification recommends OAuth 2.1 (which mandates PKCE and removes the implicit grant) for new implementations. The flow works as follows: the user initiates a connection through the MCP gateway, is redirected to the service provider's consent screen, grants specific scopes, and the resulting access and refresh tokens are stored by the gateway -- never by the agent itself. This separation is critical: agents should never hold raw OAuth tokens. Instead, they receive a scoped session identifier that the gateway resolves to the appropriate credential at call time. This prevents token theft if the agent or its runtime environment is compromised.",
      },
      {
        heading: "Token Management for MCP",
        content:
          "Effective token management is the backbone of MCP authentication. Access tokens are short-lived (typically 1 hour) and must be refreshed automatically using refresh tokens before expiry. The refresh token itself should be encrypted at rest and stored in a secure backend -- never in browser storage, environment variables, or agent memory. Token rotation policies should invalidate refresh tokens after use (one-time rotation) to prevent replay attacks. For multi-server environments, each MCP server connection should have its own token pair, isolated from others. If one server's credentials are compromised, the blast radius is limited to that server's scopes. The gateway should also support instant token revocation: a single API call that immediately invalidates all tokens for a specific agent, user, or service connection.",
      },
      {
        heading: "MCP Authentication Best Practices",
        content:
          "Never let agents store or manage OAuth tokens directly -- centralize credential storage in a gateway or secrets manager. Use the narrowest possible OAuth scopes for each connection. Implement token rotation and automatic refresh with encrypted storage. Enforce session timeouts: agent sessions should expire after a configurable period of inactivity, requiring re-authentication. Use mutual TLS or signed requests for server-to-server MCP connections in high-security environments. Log every authentication event (token issue, refresh, revocation, failure) with timestamps and agent identifiers for audit compliance. Finally, support instant revocation at the agent, user, and service level -- when an agent is decommissioned or a user leaves the organization, all associated credentials should be invalidated immediately.",
      },
    ],
    faq: [
      {
        question: "Can AI agents authenticate to MCP servers without OAuth?",
        answer:
          "Yes. MCP supports multiple authentication methods including API key-based auth, bearer tokens, and session-based auth. However, OAuth 2.0 is recommended for third-party service integrations because it provides scoped consent, token expiry, and revocation capabilities that simpler methods lack.",
      },
      {
        question: "Should agents store OAuth tokens?",
        answer:
          "No. Agents should never hold raw OAuth tokens. A gateway or credential manager should store tokens securely and issue scoped session identifiers to agents. This prevents token theft if the agent runtime is compromised.",
      },
      {
        question: "How do I revoke access for a specific AI agent?",
        answer:
          "Use an MCP gateway that supports per-agent credential management. Revoking an agent's session token immediately blocks all its tool calls without affecting other agents or users. The gateway should also revoke any associated OAuth tokens for the connected services.",
      },
    ],
    relatedTerms: ["mcp-oauth", "mcp-gateway", "mcp-security", "ai-agent-permissions"],
    ctaText:
      "ScopeGate handles MCP authentication end-to-end: OAuth flows, encrypted token storage, automatic refresh, and instant revocation. Your agents get scoped session tokens. You get full control.",
  },
  {
    slug: "mcp-proxy",
    term: "MCP Proxy",
    metaTitle: "What is an MCP Proxy? Architecture & Use Cases",
    metaDescription:
      "An MCP proxy is a reverse proxy that intercepts AI agent traffic to MCP servers, adding authentication, logging, and permission enforcement transparently.",
    headline: "What is an MCP Proxy? Architecture & Use Cases",
    tldr:
      "An MCP proxy is a reverse proxy layer that intercepts traffic between AI agents and MCP servers. It transparently adds authentication, permission enforcement, rate limiting, and audit logging without requiring changes to the agent or the MCP server.",
    sections: [
      {
        heading: "What is an MCP Proxy?",
        content:
          "An MCP proxy is a network intermediary that sits between AI agents and the MCP servers they call. Agents send their tool call requests to the proxy's endpoint URL instead of directly to MCP servers. The proxy authenticates the request, checks the agent's permissions, and -- if authorized -- forwards the call to the appropriate MCP server. The response flows back through the proxy, where it can be logged, filtered, or transformed before reaching the agent. The key property of an MCP proxy is transparency: neither the agent nor the MCP server needs to be modified to work with it. The agent just points to a different URL. The server receives standard MCP requests. All the security and governance logic lives in the proxy layer.",
      },
      {
        heading: "How an MCP Proxy Works",
        content:
          "The proxy operates in several phases for each request. During the connection phase, the agent establishes a session with the proxy using a bearer token or session identifier. The proxy validates this credential against its auth backend and loads the agent's permission profile. During the discovery phase, when the agent requests the list of available tools (the MCP tools/list call), the proxy fetches the full tool list from connected MCP servers but returns only the tools the agent is authorized to use -- effectively filtering the agent's view of available capabilities. During the invocation phase, when the agent calls a specific tool, the proxy checks the call against the agent's permissions (correct tool, correct parameters, within rate limits), logs the request, forwards it to the MCP server, logs the response, and returns it to the agent. This per-call enforcement ensures security policies are applied consistently, even if the agent's behavior is unpredictable.",
      },
      {
        heading: "Benefits of Using an MCP Proxy",
        content:
          "Centralized security is the primary benefit: instead of securing each MCP server individually (a task that 43% of server maintainers get wrong, according to Invariant Labs), security policy is defined and enforced in one place. Credential isolation is another major advantage: OAuth tokens and API keys are stored in the proxy, never exposed to agents. The proxy also enables observability -- every tool call is logged with full context (which agent, which user, which tool, what parameters, what result), creating the audit trail required for SOC 2, HIPAA, and EU AI Act compliance. Rate limiting protects upstream services from runaway agents. And because the proxy is transparent, it works with any MCP-compliant agent and server, making it future-proof as the ecosystem evolves.",
      },
      {
        heading: "MCP Proxy Architecture Patterns",
        content:
          "The simplest pattern is a single-tenant proxy that serves one user's agents, running as a sidecar process or local service. This is suitable for individual developers and small teams. Multi-tenant proxies serve multiple users and organizations, with strict credential and permission isolation between tenants -- this is the pattern used by managed MCP gateway platforms. Edge proxies deploy at the network edge (CDN or edge compute), minimizing latency for distributed agent deployments. Sidecar proxies run alongside each agent instance in containerized environments, providing per-agent isolation with centralized policy management. The choice depends on your scale, latency requirements, and security posture. Most organizations start with a managed multi-tenant proxy and move to self-hosted or edge deployment as their MCP usage matures.",
      },
    ],
    faq: [
      {
        question: "What is the difference between an MCP proxy and an MCP gateway?",
        answer:
          "The terms are often used interchangeably. Technically, a proxy focuses on transparent request forwarding with policy enforcement, while a gateway may include additional features like a tool registry, management UI, and analytics. In practice, most MCP gateways implement the proxy pattern as their core mechanism.",
      },
      {
        question: "Does using an MCP proxy add latency?",
        answer:
          "An MCP proxy adds a small amount of latency (typically 5-20ms) for the authentication check and policy evaluation on each request. This is negligible compared to the latency of the underlying tool call (e.g., a Google API call takes 100-500ms). The security and governance benefits far outweigh the marginal latency cost.",
      },
      {
        question: "Can I use an MCP proxy with any AI agent?",
        answer:
          "Yes, as long as the agent supports the MCP specification. The agent just needs to point to the proxy's endpoint URL instead of the MCP server URL directly. No changes to the agent's code are required.",
      },
    ],
    relatedTerms: ["mcp-gateway", "mcp-security", "mcp-authentication", "ai-agent-permissions"],
    ctaText:
      "ScopeGate works as an MCP proxy: point your agents to a single ScopeGate endpoint URL, and it handles authentication, per-agent permissions, rate limiting, and logging transparently. No changes to your agents or MCP servers.",
  },
  {
    slug: "agentic-ai-security",
    term: "Agentic AI Security",
    metaTitle: "Agentic AI Security: Threats, Controls & Governance",
    metaDescription:
      "Agentic AI security covers the threats, controls, and governance frameworks needed to safely deploy autonomous AI agents. 88% of orgs report incidents.",
    headline: "Agentic AI Security: Threats, Controls & Governance",
    tldr:
      "Agentic AI security is the discipline of protecting organizations from the risks created by autonomous AI agents that can take actions, access data, and interact with external systems without continuous human oversight. With 88% of organizations reporting AI-related security incidents, this is the defining security challenge of the next decade.",
    sections: [
      {
        heading: "What is Agentic AI Security?",
        content:
          "Agentic AI refers to AI systems that can autonomously plan and execute multi-step tasks, make decisions, use tools, and interact with external services. Unlike chatbots that respond to individual prompts, agentic AI systems operate with significant autonomy: a coding agent might read a codebase, plan changes, write code, run tests, and open a pull request -- all from a single instruction. Agentic AI security encompasses the practices, tools, and governance frameworks needed to ensure these autonomous systems operate safely, within defined boundaries, and with appropriate human oversight. It spans access control, credential management, behavioral monitoring, output validation, and regulatory compliance. The field is distinct from traditional application security because the \"application\" (the agent) has emergent, unpredictable behavior that cannot be fully specified in advance.",
      },
      {
        heading: "Key Threats in Agentic AI",
        content:
          "Authorization bypass is the most common threat: agents accumulate permissions across multiple tool connections and can combine them in ways that violate intended access policies. A survey by HiddenLayer found that 88% of organizations deploying AI systems experienced at least one security incident, with unauthorized data access being the most frequent. Prompt injection remains a persistent threat, especially when agents process untrusted input from external tools -- an attacker can embed instructions in a document the agent reads, hijacking its reasoning. Tool confusion attacks manipulate agents into calling the wrong tool or passing unexpected parameters by exploiting ambiguous tool descriptions. Data exfiltration through side channels occurs when agents leak sensitive information through seemingly benign outputs, such as encoding data in file names or URLs. Supply chain attacks through compromised MCP servers or agent plugins are increasingly common as the ecosystem grows rapidly without standardized security review processes.",
      },
      {
        heading: "Security Controls for Agentic AI",
        content:
          "Least-privilege access is the foundational control: every agent should have the minimum permissions required for its specific task, with permissions defined at the tool and parameter level, not just the service level. Session-scoped credentials ensure that an agent's access is time-limited and automatically revoked when the task completes. Behavioral boundaries define what an agent is allowed to do -- not just which tools it can call, but what patterns of tool usage are acceptable (e.g., reading up to 10 files per session, never modifying production databases). Human-in-the-loop gates require explicit approval for high-risk actions like sending emails, modifying production systems, or accessing sensitive data categories. Output filtering validates agent responses before they reach end users, preventing data leakage and content-safety violations. Continuous monitoring tracks agent behavior in real-time, flagging anomalies and triggering automated interventions when agents deviate from expected patterns.",
      },
      {
        heading: "Governance Frameworks for Agentic AI",
        content:
          "NIST's AI Risk Management Framework provides a structured approach to identifying and mitigating risks in AI systems, including agentic deployments. ISO 42001 (AI Management System) establishes requirements for organizational governance of AI. OWASP has published a Top 10 for LLM applications that directly addresses agentic security risks including insecure tool use and excessive agency. For regulated industries, existing frameworks like SOC 2, HIPAA, and PCI DSS apply to agent-mediated data access, requiring audit trails and access controls. Internal governance should include an agent registry (what agents exist, what they can do), a permissions matrix (which agents have access to which systems), and an incident response plan specific to agent-caused incidents.",
      },
      {
        heading: "The EU AI Act and Agentic AI",
        content:
          "The EU AI Act, which began enforcement in August 2024, classifies AI systems by risk level and imposes proportional requirements. Agentic AI systems that operate in high-risk domains (healthcare, finance, critical infrastructure, employment) face the strictest requirements: mandatory risk assessments, human oversight mechanisms, detailed logging of all automated decisions, and transparency obligations. Even general-purpose agentic systems must maintain audit trails, implement appropriate security measures, and provide mechanisms for human intervention. Organizations deploying agents that interact with EU citizens or operate within the EU must comply regardless of where the organization is headquartered. The Act's requirements for \"appropriate levels of accuracy, robustness, and cybersecurity\" directly mandate the kind of access controls, monitoring, and governance that agentic AI security provides.",
      },
    ],
    faq: [
      {
        question: "How is agentic AI security different from traditional AI safety?",
        answer:
          "Traditional AI safety focuses on model behavior: preventing harmful outputs, bias, and hallucinations. Agentic AI security encompasses model behavior plus the security of the agent's actions in the real world -- what tools it accesses, what data it reads and modifies, and how its behavior is governed. It is closer to application security than ML safety.",
      },
      {
        question: "What percentage of organizations have had AI security incidents?",
        answer:
          "According to HiddenLayer's 2024 AI Threat Landscape report, 88% of organizations deploying AI systems experienced at least one security incident. The most common incidents involve unauthorized data access, model manipulation, and misuse of AI-connected tools and services.",
      },
      {
        question: "Do I need agentic AI security for internal agents?",
        answer:
          "Yes. Internal agents often have broader access to sensitive systems than external-facing ones. Without security controls, an internal coding agent could inadvertently access production databases, leak credentials, or modify critical configurations. The 'internal' designation does not reduce the attack surface.",
      },
    ],
    relatedTerms: [
      "mcp-security",
      "ai-agent-permissions",
      "ai-agent-audit-trail",
      "mcp-gateway",
    ],
    ctaText:
      "ScopeGate provides the access control layer for agentic AI: per-agent permissions, credential isolation, real-time audit trails, and instant revocation. Govern your agents without slowing them down.",
  },
  {
    slug: "ai-agent-permissions",
    term: "AI Agent Permissions",
    metaTitle: "AI Agent Permissions: Control What AI Can Access",
    metaDescription:
      "Learn how AI agent permissions work, why OAuth scopes are not enough, and how to implement per-agent access control for MCP-connected AI systems.",
    headline: "AI Agent Permissions: How to Control What AI Agents Can Access",
    tldr:
      "AI agent permissions define exactly which tools, data sources, and actions a specific AI agent is authorized to use. Unlike traditional OAuth scopes that grant blanket access to a user's account, agent permissions are granular, per-agent, and can be adjusted or revoked instantly.",
    sections: [
      {
        heading: "Why AI Agents Need Dedicated Permissions",
        content:
          "When you connect a traditional app to Google Drive, you grant it access to your entire Drive via OAuth. That works for apps because the app's behavior is deterministic and predictable. AI agents are different. Their behavior is emergent: an agent might decide to search through thousands of documents, combine data from multiple services, or take actions that the developer never explicitly programmed. This unpredictability makes blanket OAuth scopes dangerous. An agent with full Drive access could read every document in your organization. An agent with Gmail send permission could send emails to anyone. The problem is not that agents are malicious -- it is that they are autonomous and capable, and their actions cannot be fully predicted in advance. Dedicated agent permissions solve this by limiting what an agent can do to exactly what it needs, nothing more.",
      },
      {
        heading: "OAuth Scopes vs. Agent-Level Permissions",
        content:
          "OAuth scopes operate at the service level: \"this application can read your calendar\" or \"this application can send emails on your behalf.\" They are granted once during a consent flow and remain until revoked. Agent-level permissions operate at a much finer granularity. Instead of \"can read calendar,\" an agent permission might be \"can read events from the 'Work' calendar for the next 7 days, but not create, modify, or delete events.\" Instead of \"can access Drive,\" it might be \"can read files in the /Projects/Alpha folder, but not access any other folder.\" This layered model means the OAuth scope provides the upper bound of what is possible, and the agent permission narrows it to what is actually needed. Even if an agent has access to a full-scope OAuth token (through a gateway), it can only use the subset of that scope defined in its permission profile.",
      },
      {
        heading: "Per-Agent Access Control in Practice",
        content:
          "Per-agent access control assigns a unique permission profile to each AI agent. A coding agent might have read access to a specific GitHub repository and the ability to create pull requests, but no access to email or file storage. A research agent might have read-only access to Google Drive and web search, but no write permissions anywhere. A customer support agent might have read access to a CRM and the ability to send templated emails, but no access to financial systems. These profiles are defined in the MCP gateway and enforced on every tool call. When an agent requests the list of available tools, it only sees the tools its permission profile allows. When it tries to call a tool, the call is checked against its profile before execution. This happens transparently -- the agent does not need to be aware of its permission boundaries.",
      },
      {
        heading: "Implementing AI Agent Permissions",
        content:
          "Start by cataloging every MCP server and tool your agents use. For each tool, define the permission dimensions: read vs. write, which resources (folders, repositories, channels), what rate limits apply, and whether human approval is required for certain actions. Create permission profiles for each agent role -- keep them as narrow as possible. Deploy an MCP gateway that enforces these profiles at runtime. Implement monitoring to detect when agents hit permission boundaries, which may indicate either a security issue or a profile that is too restrictive. Review and adjust permissions regularly as agent capabilities and use cases evolve. Crucially, implement instant revocation: the ability to kill a specific agent's access across all services with a single action, without affecting other agents or users.",
      },
    ],
    faq: [
      {
        question: "Can I give different permissions to different AI agents?",
        answer:
          "Yes, and you should. Each agent should have its own permission profile tailored to its specific task. A coding agent, a research agent, and a customer support agent all need different levels of access. An MCP gateway enforces these per-agent profiles automatically on every tool call.",
      },
      {
        question: "How are agent permissions different from role-based access control (RBAC)?",
        answer:
          "RBAC assigns permissions based on a user's role. Agent permissions go further by assigning permissions to individual agent instances, even if they act on behalf of the same user. A user might have full access to a service, but their different agents can each have restricted, task-specific subsets of that access.",
      },
      {
        question: "What happens when an agent tries to exceed its permissions?",
        answer:
          "The MCP gateway blocks the tool call and returns an authorization error to the agent. The denied request is logged with full details for audit purposes. Depending on configuration, it can also trigger alerts to administrators or require human approval before proceeding.",
      },
    ],
    relatedTerms: [
      "mcp-gateway",
      "mcp-authentication",
      "agentic-ai-security",
      "ai-agent-audit-trail",
    ],
    ctaText:
      "ScopeGate was built for exactly this: per-agent permissions that are more granular than OAuth scopes. Define what each agent can access at the tool and resource level, enforce it automatically, and revoke instantly when needed.",
  },
  {
    slug: "mcp-oauth",
    term: "MCP OAuth",
    metaTitle: "MCP OAuth: Implementing OAuth 2.0 for MCP Servers",
    metaDescription:
      "A technical guide to implementing OAuth 2.0 for MCP servers: authorization flows, token storage, refresh strategies, and scope management for AI agents.",
    headline: "MCP OAuth: Implementing OAuth 2.0 for MCP Servers",
    tldr:
      "MCP OAuth refers to the implementation of OAuth 2.0 (specifically OAuth 2.1) as the authentication and authorization mechanism for AI agents connecting to external services through the Model Context Protocol. It enables scoped, revocable, time-limited access without exposing raw credentials to agents.",
    sections: [
      {
        heading: "OAuth Basics for MCP",
        content:
          "OAuth 2.0 is the industry-standard authorization framework that allows a user to grant an application limited access to their account on another service, without sharing their password. In the MCP context, OAuth enables AI agents to access services like Google Workspace, GitHub, Slack, and Microsoft 365 on behalf of a user, with explicit consent and scoped permissions. The MCP specification recommends OAuth 2.1, which mandates PKCE (Proof Key for Code Exchange) for all clients, removes the implicit grant flow, and requires exact redirect URI matching. These improvements close several known attack vectors in the original OAuth 2.0 spec, including authorization code interception and redirect URI manipulation. For MCP deployments, OAuth serves double duty: it authenticates the user's consent to grant access, and it provides the time-limited tokens that the MCP gateway uses to make tool calls on the user's behalf.",
      },
      {
        heading: "The OAuth Implementation Flow for MCP",
        content:
          "The MCP OAuth flow has several steps. First, the user initiates a connection through the MCP gateway's interface, selecting the service they want to connect (e.g., Google Drive). The gateway redirects the user to the service provider's OAuth consent screen, requesting specific scopes (e.g., drive.readonly). The user reviews and approves the scopes. The service provider redirects back to the gateway with an authorization code. The gateway exchanges this code for an access token and a refresh token using its client credentials. Both tokens are encrypted and stored in the gateway's secure credential store. The gateway then maps these tokens to the user's account and their agent permission profiles. When an agent makes a tool call, the gateway retrieves the appropriate access token, validates it is not expired (refreshing if necessary), and includes it in the request to the MCP server. The agent never sees the raw token -- it only uses its session identifier.",
      },
      {
        heading: "Token Management Strategies",
        content:
          "Access tokens should be treated as short-lived and expendable. Most providers issue tokens with a 1-hour expiry. The gateway should proactively refresh tokens before they expire (e.g., at the 50-minute mark) to avoid mid-session failures. Refresh tokens are long-lived and must be protected aggressively: encrypted at rest with AES-256, stored in a dedicated secrets store (not in the same database as application data), and rotated on every use when the provider supports it. For multi-service environments, each service connection should have isolated token pairs -- a compromise of one service's credentials should not affect others. Implement token revocation webhooks so that when a user revokes access from the service provider's side, the gateway is immediately notified and cleans up the stale tokens. Monitor token refresh failures: three consecutive failures likely indicate the user has revoked access, and the agent should be notified gracefully rather than retrying indefinitely.",
      },
      {
        heading: "Security Considerations for MCP OAuth",
        content:
          "The state parameter in the OAuth flow must be cryptographically random and validated on return to prevent CSRF attacks. Always use PKCE, even for confidential clients -- it adds defense in depth against authorization code interception. Store client secrets in environment variables or a secrets manager, never in code or configuration files committed to version control. Implement strict redirect URI validation: the callback URL must match exactly, with no wildcards or partial matches. For high-security environments, consider using DPoP (Demonstration of Proof of Possession) tokens, which bind access tokens to a specific client key pair, preventing token theft and replay. Audit your OAuth scope requests regularly -- over-scoped connections are the most common MCP security gap. If an agent only needs to read calendar events, the OAuth connection should request only the calendar.readonly scope, not the full calendar scope.",
      },
    ],
    faq: [
      {
        question: "Why does MCP use OAuth 2.1 instead of OAuth 2.0?",
        answer:
          "OAuth 2.1 consolidates security best practices that were optional in OAuth 2.0: mandatory PKCE for all clients, removal of the implicit grant flow, and exact redirect URI matching. These changes close several known attack vectors that are especially dangerous in the MCP context where tokens grant access to sensitive external services.",
      },
      {
        question: "How do I handle OAuth token refresh in an MCP gateway?",
        answer:
          "The gateway should proactively refresh access tokens before expiry (e.g., when 80% of the token lifetime has elapsed). Refresh tokens should be rotated on each use, encrypted at rest, and stored separately from application data. Failed refreshes should be retried with exponential backoff, and three consecutive failures should trigger token revocation and user notification.",
      },
      {
        question: "Can I use API keys instead of OAuth for MCP connections?",
        answer:
          "For services that support only API keys, yes. However, API keys lack the scoping, expiry, and revocation capabilities of OAuth tokens. If you use API keys, store them in the gateway's encrypted credential store, never in agent code, and implement manual rotation policies.",
      },
    ],
    relatedTerms: ["mcp-authentication", "mcp-security", "mcp-gateway", "mcp-proxy"],
    ctaText:
      "ScopeGate handles the entire MCP OAuth lifecycle: consent flows, encrypted token storage, automatic refresh, scope management, and instant revocation. Connect services in clicks, not code.",
  },
  {
    slug: "ai-agent-audit-trail",
    term: "AI Agent Audit Trail",
    metaTitle: "AI Agent Audit Trails: Logging & Compliance Guide",
    metaDescription:
      "How to build audit trails for AI agents: what to log, compliance requirements (SOC 2, EU AI Act), and best practices for agent activity monitoring.",
    headline: "AI Agent Audit Trails: Logging, Compliance & Best Practices",
    tldr:
      "An AI agent audit trail is a complete, immutable record of every action an AI agent takes -- every tool call, data access, decision, and outcome. It is essential for security forensics, regulatory compliance (SOC 2, HIPAA, EU AI Act), and understanding what your agents are actually doing.",
    sections: [
      {
        heading: "Why Audit AI Agents?",
        content:
          "AI agents operate with significant autonomy, making decisions and taking actions that may not be visible to their operators in real-time. Without an audit trail, you have no way to answer fundamental questions: What data did the agent access? What actions did it take? Why did it take those actions? Did it access anything it should not have? When something goes wrong -- a data breach, an incorrect action, a compliance violation -- the audit trail is the only way to reconstruct what happened. But audit trails are not just for incident response. They are equally valuable for ongoing governance: understanding agent behavior patterns, identifying permission gaps (agents that consistently hit authorization boundaries), optimizing performance (which tool calls are slow or failing), and demonstrating compliance to auditors. The 88% of organizations that have experienced AI security incidents all wish they had better logging in place before the incident occurred.",
      },
      {
        heading: "What to Log in an AI Agent Audit Trail",
        content:
          "A comprehensive audit trail captures five categories of data. Identity: which agent, which user, which session, which organization. Action: which tool was called, with what parameters, against which service. Outcome: success or failure, response payload (or a hash of it for sensitive data), latency, and any error codes. Context: the agent's current task or goal, the preceding actions in the session, and the permission profile that was active. Policy: which permission rules were evaluated, which were matched, and whether the request was allowed or denied. Each log entry should include a cryptographic timestamp and be written to an append-only store. For sensitive environments, log entries should be signed to prevent tampering. Avoid logging raw credentials or PII in plaintext -- use tokenization or field-level encryption for sensitive values while keeping the structural metadata searchable.",
      },
      {
        heading: "Compliance Requirements for Agent Audit Trails",
        content:
          "SOC 2 requires organizations to maintain audit logs that demonstrate access controls are implemented and effective, with logs retained for a minimum period (typically 1 year) and protected from tampering. HIPAA mandates audit controls that record and examine activity in systems that contain or use electronic protected health information, including automated systems acting on behalf of users. The EU AI Act requires providers and deployers of high-risk AI systems to maintain logs of the system's operation, including input data, actions taken, and decisions made, with sufficient detail to enable post-hoc review and auditing. PCI DSS requires tracking all access to network resources and cardholder data, which applies when agents interact with payment or financial systems. For all these frameworks, the key requirements are the same: completeness (every relevant action is logged), immutability (logs cannot be altered after writing), retention (logs are kept for the required period), and accessibility (logs can be queried and exported for auditors).",
      },
      {
        heading: "Implementing AI Agent Audit Trails",
        content:
          "The most effective implementation captures audit data at the MCP gateway level, where every tool call already passes through. This avoids the need to instrument individual agents or MCP servers. The gateway logs each request and response with full metadata, writes to an append-only data store (a time-series database or an immutable log service), and provides a query interface for searching and filtering logs. Implement structured logging with consistent schemas -- every entry should be machine-parseable with fields like agent_id, user_id, tool_name, action, parameters_hash, result_status, timestamp, and latency_ms. Set up real-time alerting for anomalous patterns: unusual tool call volumes, access to sensitive tools outside business hours, or repeated authorization failures. Export capabilities should support standard formats (JSON, CSV) for auditor review and integration with SIEM platforms like Splunk, Datadog, or Elastic. Retention policies should be configurable per compliance requirement, with automatic archival to cold storage for long-term retention.",
      },
    ],
    faq: [
      {
        question: "How long should I retain AI agent audit logs?",
        answer:
          "Retention depends on your compliance requirements. SOC 2 typically requires 1 year, HIPAA requires 6 years, and the EU AI Act requires retention for the operational lifetime of the system plus a reasonable period after decommissioning. A common practice is to retain hot logs for 90 days and archive to cold storage for the full retention period.",
      },
      {
        question: "Should I log the full content of tool call responses?",
        answer:
          "For most use cases, log the response status, latency, and a content hash rather than the full payload. Full response logging can create storage and privacy concerns. For high-security environments, log full responses but encrypt sensitive fields and apply strict access controls to the log data itself.",
      },
      {
        question: "Can audit trails help with debugging agent behavior?",
        answer:
          "Yes. Audit trails show the exact sequence of tool calls an agent made, the parameters it used, and the responses it received. This makes it possible to reconstruct the agent's reasoning chain and identify where it went wrong, which is invaluable for debugging complex multi-step agent tasks.",
      },
    ],
    relatedTerms: [
      "agentic-ai-security",
      "ai-agent-permissions",
      "mcp-security",
      "mcp-gateway",
    ],
    ctaText:
      "ScopeGate logs every tool call with full context: agent identity, user, tool, parameters, result, and latency. Search, filter, and export your audit trail for compliance and debugging. Every plan includes built-in audit logging.",
  },
];
