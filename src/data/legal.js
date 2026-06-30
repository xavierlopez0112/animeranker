// ---- legal copy ----------------------------------------------------------
// Starter drafts for the three pages that actually matter for a data-collecting
// site: Privacy Policy, Terms of Service, Cookie Notice. Written to match what
// AnimeRanker really does today (anonymous `ar_vid` cookie, vote/event logging,
// Supabase as processor, AniList as the data source — no accounts, no PII).
//
// THESE ARE DRAFTS, NOT LEGAL ADVICE. Have a lawyer review before you rely on
// them, and replace the placeholders below (CONTACT, JURISDICTION) with real
// values. A draft banner is shown on every page to make this unmissable.

export const LAST_UPDATED = "June 24, 2026";
export const CONTACT = "contact@animeranker.net";
export const JURISDICTION = "your home jurisdiction"; // ← replace, e.g. "the State of California, USA"

// Each section: { h, body: [ "<paragraph>" | ["<bullet>", "<bullet>"] ] }
export const LEGAL = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    sections: [
      {
        h: "The short version",
        body: [
          "AnimeRanker is a free anime-ranking toy. We don't ask you to sign up, and we don't collect your name, email, or any account details. We keep a single anonymous identifier in your browser so your votes count once and so we can see how many people use the site — nothing more.",
        ],
      },
      {
        h: "Who we are",
        body: [
          "AnimeRanker (\"we\", \"us\") operates this website. For any privacy question, contact us at " + CONTACT + ".",
        ],
      },
      {
        h: "What we collect",
        body: [
          "We collect a small amount of data, none of which identifies you by name:",
          [
            "Anonymous visitor ID — a random value stored in a first-party cookie (\"ar_vid\") so the same browser isn't counted twice and can't spam the leaderboard.",
            "Activity data — the votes, tier-quiz picks, and Era War choices you make, which feed the shared global leaderboard.",
            "Technical/log data — standard server logs from our hosting provider, which include your IP address and browser type, kept briefly for security and to keep the service running.",
          ],
        ],
      },
      {
        h: "What we don't collect",
        body: [
          "We do not collect your name, email address, phone number, payment details, or precise location. We do not ask you to create an account. We do not run third-party advertising trackers.",
        ],
      },
      {
        h: "How we use it",
        body: [
          "Only to run the site:",
          [
            "To calculate and display the global ELO leaderboard and Era War tally.",
            "To stop a single browser from stuffing the ballot.",
            "To understand, in aggregate, how many people use the site and which features they use.",
          ],
        ],
      },
      {
        h: "Cookies",
        body: [
          "We use one functional first-party cookie. Full details, including how long it lasts and how to clear it, are in our Cookie Notice.",
        ],
      },
      {
        h: "Who we share it with",
        body: [
          "We don't sell your data. We use a small number of service providers to run the site:",
          [
            "Supabase — our database and backend host, which stores the anonymous votes and ratings on our behalf.",
            "AniList — the public source of the anime titles and cover art we display. We read data from AniList; we do not send your information to it.",
          ],
          "We may disclose data if required by law.",
        ],
      },
      {
        h: "Your rights",
        body: [
          "Depending on where you live (for example under the EU/UK GDPR or California's CCPA/CPRA), you may have the right to access, correct, or delete the data associated with you, and to object to certain processing. Because the only thing tying data to you is the anonymous ID in your own browser, you can erase most of it yourself by clearing the site's cookies. For anything else, email us at " + CONTACT + " and we'll help.",
        ],
      },
      {
        h: "Data retention",
        body: [
          "Aggregated vote and rating data may be kept indefinitely as part of the public leaderboard. Server logs are kept only for a short period. The visitor-ID cookie expires about one year after your last visit.",
        ],
      },
      {
        h: "Children",
        body: [
          "AnimeRanker isn't directed at children under 13 (or the equivalent minimum age where you live), and we don't knowingly collect data from them.",
        ],
      },
      {
        h: "Changes",
        body: [
          "We may update this policy as the site evolves. We'll change the \"last updated\" date at the top when we do.",
        ],
      },
    ],
  },

  terms: {
    slug: "terms",
    title: "Terms of Service",
    sections: [
      {
        h: "Acceptance",
        body: [
          "By using AnimeRanker you agree to these terms. If you don't agree, please don't use the site.",
        ],
      },
      {
        h: "What AnimeRanker is",
        body: [
          "AnimeRanker is a free, for-fun web toy where fans vote on head-to-head anime matchups, build personal tier lists, and play Era War. Your votes feed a shared global leaderboard. It's an opinion game, not an authoritative ranking, and we make no promises about the accuracy or fairness of any result.",
        ],
      },
      {
        h: "Acceptable use",
        body: [
          "Use the site like a normal human being. In particular, you agree not to:",
          [
            "Automate, script, or otherwise inflate or manipulate votes or the leaderboard.",
            "Attempt to break, overload, probe, or gain unauthorized access to the site or its backend.",
            "Scrape or bulk-copy the site's data or content except as permitted by law.",
            "Use the site for any unlawful purpose.",
          ],
          "We may rate-limit, block, or discard activity that looks abusive, at our discretion.",
        ],
      },
      {
        h: "Content and intellectual property",
        body: [
          "Anime titles, descriptions, and cover art are provided by AniList and remain the property of their respective rights holders; they're displayed here for identification and commentary only. The AnimeRanker name, logo, design, and code are ours. Nothing here grants you a license to reuse the cover art commercially.",
        ],
      },
      {
        h: "No warranty",
        body: [
          "The site is provided \"as is\" and \"as available\", without warranties of any kind, express or implied. We don't guarantee the site will be uninterrupted, error-free, or that any data will be preserved.",
        ],
      },
      {
        h: "Limitation of liability",
        body: [
          "To the fullest extent permitted by law, AnimeRanker and its operator won't be liable for any indirect, incidental, or consequential damages arising out of your use of the site. Since the site is free, our total liability to you is limited accordingly.",
        ],
      },
      {
        h: "Changes",
        body: [
          "We may change or discontinue the site, or update these terms, at any time. Continued use after a change means you accept the updated terms.",
        ],
      },
      {
        h: "Governing law",
        body: [
          "These terms are governed by the laws of " + JURISDICTION + ", without regard to conflict-of-laws rules.",
        ],
      },
      {
        h: "Contact",
        body: [
          "Questions about these terms? Email " + CONTACT + ".",
        ],
      },
    ],
  },

  cookies: {
    slug: "cookies",
    title: "Cookie Notice",
    sections: [
      {
        h: "What cookies are",
        body: [
          "Cookies are small text files a website stores in your browser. AnimeRanker uses just one, and it's a first-party cookie — set by us, not by an advertiser.",
        ],
      },
      {
        h: "The cookie we use",
        body: [
          [
            "Name: ar_vid",
            "Type: first-party, functional/analytics",
            "Purpose: gives your browser a random anonymous ID so your votes count once (anti–ballot-stuffing) and so we can count visitors in aggregate.",
            "Lifespan: about one year from your last visit.",
            "Personal data: none — it's a random value, not your name or email.",
          ],
        ],
      },
      {
        h: "What we don't use",
        body: [
          "We don't use third-party advertising cookies, cross-site tracking pixels, or social-media trackers.",
        ],
      },
      {
        h: "Managing cookies",
        body: [
          "You can delete or block cookies in your browser settings at any time. If you clear the ar_vid cookie, the site will simply issue a new anonymous ID on your next visit; nothing breaks. Browsing in private/incognito mode also prevents the cookie from persisting.",
        ],
      },
      {
        h: "Changes",
        body: [
          "If we change how we use cookies, we'll update this notice and its \"last updated\" date. For questions, email " + CONTACT + ".",
        ],
      },
    ],
  },
};
