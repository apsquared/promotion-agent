# Awesome Open Source GTM

A curated list of open source projects that help with go-to-market, marketing and distribution.

Cost notes refer to local or self-hosted use. Free software can still require hosting, AI credits, email delivery or platform API access. Required services and optional paid integrations are noted separately; check provider terms and quotas before choosing a stack. Requirements reviewed on 2026-10-10; inclusion is not a claim of installation or live verification.

## AI Marketing Skills and Agents

- [Marketing Skills](https://github.com/coreyhaines31/marketingskills) - MIT-licensed skills for positioning, copywriting, SEO, conversion optimization, launches, email and growth experiments, used inside an existing AI coding agent.
  - **External costs:** No separate marketing-tool subscription required. Uses your agent's subscription or AI credits; connected research, advertising and publishing services may add costs.
- [Agency Agents](https://github.com/msitarzewski/agency-agents) - MIT-licensed collection of specialist agent instructions, including content creation, Reddit community building, social strategy, SEO and outreach.
  - **External costs:** No separate subscription required for the instructions. Uses your AI agent's subscription or credits; live research and publishing require the corresponding tools and platform access.
- [OpenCMO](https://github.com/Lling0000/OpenCMO) - Experimental AI marketing system for SEO checks, community discovery and content generation. Its [package metadata](https://github.com/Lling0000/OpenCMO/blob/main/pyproject.toml) declares Apache-2.0; it has a much smaller community than the established tools here.
  - **External costs:** No hosted OpenCMO subscription required for local use. Bring an OpenAI-compatible model API and pay its usage, or use local Ollama. Optional Tavily search, additional model providers, SMTP and social APIs can add costs; see the [integration configuration](https://github.com/Lling0000/OpenCMO/blob/main/.env.example).

## Email and Newsletters

- [Mailcheap](https://github.com/marclou/mailcheap) - Self-hosted newsletter app on Amazon SES. Write an issue, send it to your list, publish it on the web. About $0.10 per 1,000 emails.
  - **External costs:** Amazon SES delivery is metered; campaign sending and scheduling require Upstash QStash, which has a starter free tier and usage charges beyond it. Also needs MongoDB and a Node.js host; paid hosting/database plans and optional Redis/Blob storage can add costs. See the upstream [service requirements](https://github.com/marclou/mailcheap#what-you-need). Released as a one-time project with no support or planned updates.
- [Listmonk](https://github.com/knadh/listmonk) - AGPL-licensed newsletter and mailing-list manager for product announcements, subscriber segmentation and email campaigns.
  - **External costs:** No Listmonk subscription required. Needs hosting, PostgreSQL and an [SMTP delivery setup](https://listmonk.app/docs/configuration/#smtp); delivery-provider fees or quotas are separate. No AI required.
- [Mautic](https://github.com/mautic/mautic) - Open-source marketing automation for lead nurturing, email sequences, landing pages, forms, segmentation and lead scoring.
  - **External costs:** No Mautic software subscription required for self-hosting. Hosting and email delivery are separate; SMS or other channel providers can add charges. No AI required. See its [features](https://mautic.org/features/).

## Distribution and Launch

- [Launch Agent](https://github.com/apsquared/launch-agent) - Directory submission agent.
  - **External costs:** No Launch Agent subscription required. Uses your existing AI coding agent and browser; its workflow takes free directory submission routes. Paid listings and promotions are separate costs, not required to use the agent.
- [Postiz](https://github.com/gitroomhq/postiz-app) - AGPL-licensed social scheduler with cross-posting, content calendars, analytics, API/webhooks and AI assistance.
  - **External costs:** No Postiz Cloud subscription required for self-hosting. Needs infrastructure and your own social-platform developer apps/approvals; platform API access may incur charges. AI features use your own provider keys and credits. See the [cloud versus self-hosted comparison](https://github.com/gitroomhq/postiz-app#postiz-cloud-vs-open-source).

## Explainer Videos and Creative

- [HyperFrames](https://github.com/heygen-com/hyperframes) - Apache-2.0 framework that turns HTML, CSS, media and animations into MP4 videos. Includes agent workflows for product launch videos, faceless explainers, feature announcements and social clips.
  - **External costs:** No HeyGen subscription, API key or per-render fee required for basic local rendering. Requires Node.js 22+ and FFmpeg. AI-assisted authoring uses your existing agent; generated voice, images, music and other media may require paid provider credits. Optional cloud rendering uses external infrastructure/services. See the [local CLI requirements](https://github.com/heygen-com/hyperframes#manually-with-the-cli) and [optional configuration](https://github.com/heygen-com/hyperframes/blob/main/.env.example).

## Design

- [SuperDesign](https://github.com/superdesigndev/superdesign) - Open-source design agent extension for VS Code, Cursor, Windsurf and Claude Code that generates UI mockups, components and wireframes from prompts. Mostly AGPLv3, with some files under a separate commercial license; see the [license](https://github.com/superdesigndev/superdesign/blob/main/LICENSE). The upstream README says this original extension is no longer actively maintained and the product has moved to a hosted web app.
  - **External costs:** No SuperDesign subscription required for the open-source extension. Uses your own AI model provider keys and credits, or your existing Claude Code/Cursor subscription; the hosted web app is a separate product.
- [Design Taste](https://github.com/madebymustafa/design-taste) - MIT-licensed agent skills that steer AI-generated landing pages and interfaces away from generic defaults, with genre packs (editorial, brutalist, dark tech and more) plus typography, color, motion, accessibility and landing-page craft rules.
  - **External costs:** No separate subscription required for the skills. Uses your existing AI coding agent's subscription or credits.

## Workflow Automation and Monitoring

- [Activepieces](https://github.com/activepieces/activepieces) - Visual workflow automation for connecting marketing events, AI drafting, review steps and distribution tools. The Community Edition is MIT licensed; enterprise features use a commercial license.
  - **External costs:** No Activepieces subscription required for the self-hosted Community Edition. Hosting, connected services and AI usage are separate. Enterprise features and managed cloud plans may require payment; see [installation options](https://www.activepieces.com/docs/install/overview).
- [Huginn](https://github.com/huginn/huginn) - MIT-licensed event and monitoring automation for watching websites, RSS feeds and other sources, then creating alerts or digests. Useful building blocks for competitor monitoring and opportunity discovery.
  - **External costs:** No Huginn subscription or AI required. Needs hosting; third-party APIs and notification/delivery providers may require accounts or payment. Social monitoring depends on current API access, rather than providing unrestricted access itself.

## Analytics and Measurement

- [Umami](https://github.com/umami-software/umami) - MIT-licensed analytics for traffic, campaigns and conversions to measure which distribution efforts bring visitors and customers.
  - **External costs:** No Umami Cloud subscription or AI required for self-hosting. Hosting and database resources are separate costs.

## Related Source-Available Tools

- [n8n](https://github.com/n8n-io/n8n) - Workflow automation for connecting marketing services and AI steps. Uses the Sustainable Use License rather than an open-source license.
  - **External costs:** Can be self-hosted without an n8n subscription for permitted internal business use. Hosting, connected APIs and AI usage are separate; enterprise features and some embedded/resale uses require a commercial agreement. See the [license and permitted-use explanation](https://docs.n8n.io/sustainable-use-license/).
