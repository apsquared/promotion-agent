#!/usr/bin/env node

const DEFAULT_QUERIES = [
  ["Validate startup ideas", "validate startup idea"],
  ["How to validate", "how do I validate startup idea"],
  ["Validate SaaS ideas", "validate my SaaS idea"],
  ["Should I build", "should I build SaaS startup app"],
  ["Idea feedback", "feedback on my idea SaaS startup app"],
  ["Waitlist traction", "waitlist SaaS startup app signups traction"],
  ["Landing page validation", "landing page validate startup idea SaaS"],
  ["MVP no users", "built an MVP no users no signups no traction"],
  ["Find first users", "how to get first users SaaS startup app"],
  ["Find first users simple", "how to get first users SaaS"],
  ["Pre-launch demand", "pre launch waitlist demand validate SaaS startup app"],
  ["Ads for validation", "run ads validate startup idea SaaS"],
  ["Build in public idea test", "building in public validate waitlist idea MVP"],
  ["Indie hacker validation", "indie hacker validate waitlist MVP"],
  ["Pivot or kill", "pivot kill the idea move on startup SaaS MVP"],
  ["Would you use", "would you use SaaS app I built thinking of building"],
  ["Landing page feedback", "landing page feedback SaaS"],
  ["No traction SaaS", "SaaS no traction"],
  ["Waitlist signups", "waitlist signups SaaS"],
];

const SKIP_PATTERNS = [
  /prompt:/i,
  /act as a/i,
  /complete guide/i,
  /course/i,
  /ebook/i,
  /newsletter/i,
  /follow me/i,
  /DM me/i,
  /template/i,
  /checklist/i,
  /10 steps/i,
  /thread/i,
];

const STRONG_PATTERNS = [
  /how (do|can) i/i,
  /need feedback/i,
  /would (you|anyone) use/i,
  /no users/i,
  /no signups/i,
  /0 signups/i,
  /no traction/i,
  /first (users|customers)/i,
  /should i build/i,
  /unsure/i,
  /validate/i,
  /waitlist/i,
  /landing page/i,
  /MVP/i,
];

function usage() {
  console.log(`Usage:
  search_x_posts.mjs [--hours 24] [--format json|markdown] [--query "term"]...

Options:
  --hours N          Only include posts newer than N hours. Default: 24.
  --format FORMAT   json or markdown. Default: json.
  --query QUERY     Add a custom query. If any --query is supplied, defaults are not used.
  --help            Show this help.
`);
}

function parseArgs(argv) {
  const opts = { hours: 24, format: "json", queries: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg === "--hours") {
      opts.hours = Number(argv[++i]);
    } else if (arg === "--format") {
      opts.format = argv[++i];
    } else if (arg === "--query") {
      const q = argv[++i];
      opts.queries.push([`Custom: ${q}`, q]);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!Number.isFinite(opts.hours) || opts.hours <= 0) {
    throw new Error("--hours must be a positive number");
  }
  if (!["json", "markdown"].includes(opts.format)) {
    throw new Error("--format must be json or markdown");
  }
  if (opts.queries.length === 0) {
    opts.queries = DEFAULT_QUERIES;
  }
  return opts;
}

function decodeHtml(input = "") {
  return input
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTweetlookDate(title) {
  if (!title || !title.includes("UTC")) return null;
  const normalized = title.replace("·", "").replace(/\s+/g, " ").trim();
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function scorePost(content) {
  const text = content || "";
  if (SKIP_PATTERNS.some((pattern) => pattern.test(text))) return "skip";
  if (STRONG_PATTERNS.some((pattern) => pattern.test(text))) return "strong";
  return "medium";
}

async function fetchTweets(label, query) {
  const url = `https://tweetlook.com/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "text/html",
    },
  });
  if (!response.ok) {
    throw new Error(`tweetlook returned ${response.status} for ${query}`);
  }

  const html = await response.text();
  const tweets = [];
  for (const part of html.split('<a class="tweet-link"').slice(1)) {
    const href = (part.match(/href="([^"]*\/status\/\d+)[^"]*"/) || [])[1];
    const username = (part.match(/<a class="username"[^>]*title="(@[^"]+)"/) || [])[1];
    const nameHtml = (part.match(/<a class="fullname"[\s\S]*?>([\s\S]*?)<\/a>/) || [])[1] || "";
    const dateMatch = part.match(/<span class="tweet-date"><a [^>]*title="([^"]+)"[^>]*>([^<]+)<\/a><\/span>/);
    const contentHtml = (part.match(/<div class="tweet-content[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "";
    const content = decodeHtml(contentHtml);

    if (!href || !username || !dateMatch || !content) continue;

    const urlMatch = href.match(/\/([^/]+)\/status\/(\d+)/);
    const timestamp = parseTweetlookDate(dateMatch[1]);
    if (!urlMatch || !timestamp) continue;

    tweets.push({
      label,
      query,
      name: decodeHtml(nameHtml),
      username,
      rel: dateMatch[2],
      exact: dateMatch[1],
      iso: timestamp.toISOString(),
      url: `https://x.com/${urlMatch[1]}/status/${urlMatch[2]}`,
      mirror: `https://tweetlook.com${href}`,
      content,
      quality: scorePost(content),
    });
  }
  return tweets;
}

function toMarkdown(result) {
  const lines = [];
  lines.push(`Checked at ${result.now}. Cutoff: ${result.cutoff}.`);
  lines.push("");
  lines.push(`Found ${result.count} posts inside the last ${result.hours} hours.`);
  lines.push("");
  const keep = result.tweets.filter((tweet) => tweet.quality !== "skip");
  const skip = result.tweets.filter((tweet) => tweet.quality === "skip");

  if (keep.length) {
    lines.push("**Best candidates**");
    for (const tweet of keep) {
      lines.push(`- ${tweet.quality.toUpperCase()} [${tweet.username}](${tweet.url}) - ${tweet.rel} (${tweet.exact})`);
      lines.push(`  Query: ${tweet.label}`);
      lines.push(`  ${tweet.content}`);
    }
    lines.push("");
  }

  if (skip.length) {
    lines.push("**Likely skips**");
    for (const tweet of skip) {
      lines.push(`- [${tweet.username}](${tweet.url}) - ${tweet.rel}: ${tweet.content}`);
    }
  }

  return lines.join("\n");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    return;
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - opts.hours * 3600 * 1000);
  const seen = new Map();
  const errors = [];

  for (const [label, query] of opts.queries) {
    try {
      const tweets = await fetchTweets(label, query);
      for (const tweet of tweets) {
        const timestamp = new Date(tweet.iso);
        if (timestamp < cutoff || timestamp > new Date(now.getTime() + 5 * 60 * 1000)) continue;
        const existing = seen.get(tweet.url);
        if (existing) {
          existing.labels.push(label);
          existing.queries.push(query);
        } else {
          seen.set(tweet.url, { ...tweet, labels: [label], queries: [query] });
        }
      }
    } catch (error) {
      errors.push({ label, query, error: error.message });
    }
  }

  const qualityRank = { strong: 0, medium: 1, skip: 2 };
  const tweets = [...seen.values()].sort((a, b) => {
    const qualityDiff = qualityRank[a.quality] - qualityRank[b.quality];
    if (qualityDiff !== 0) return qualityDiff;
    return new Date(b.iso) - new Date(a.iso);
  });

  const result = {
    now: now.toISOString(),
    cutoff: cutoff.toISOString(),
    hours: opts.hours,
    count: tweets.length,
    queries: opts.queries.map(([label, query]) => ({ label, query })),
    errors,
    tweets,
  };

  if (opts.format === "markdown") {
    console.log(toMarkdown(result));
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
