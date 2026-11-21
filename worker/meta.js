// Per-route <head> metadata. One source of truth for the build (site/index.html) and the Worker.
// Share-link pages are deliberately generic: nothing here may depend on, or reveal, the message.
export const SITE = 'https://pixelmob.io';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const PAGES = {
  landing: {
    title: 'Pixel Mob — Turn any message into a tiny pixel crowd',
    description: 'Make a mob of tiny pixel people spell your message, emoji and drawings. Pick a theme, add scenes or a countdown, send a free surprise link and watch the crowd assemble.',
    image: '/og.png',
    imageAlt: 'Pixel Mob: a crowd of tiny pixel people spells PIXEL MOB above the words “Tiny people. Big feelings.”',
    robots: 'index,follow',
    jsonld: true,
  },
  new: {
    title: 'Make a Pixel Mob message — free surprise link',
    description: 'Type your words, add pixel drawings like ❤️ 🎂 ⭐, choose a birthday, Christmas or wedding theme, and get a link. Your friend watches a tiny crowd assemble into your message.',
    image: '/og.png',
    imageAlt: 'Pixel Mob: a crowd of tiny pixel people spells PIXEL MOB above the words “Tiny people. Big feelings.”',
    robots: 'index,follow',
  },
  message: {
    title: 'Someone sent you a Pixel Mob 👀',
    description: 'A tiny mob has assembled with a message just for you. Tap to see what they spell.',
    image: '/og-message.png',
    imageAlt: 'A crowd of tiny pixel people around a card: “Someone sent you a message.”',
    robots: 'noindex,nofollow,noarchive',
  },
  scrambled: {
    title: 'This Pixel Mob link got scrambled',
    description: 'The mob couldn’t read this link. Ask for a fresh one, or make your own Pixel Mob message.',
    image: '/og-message.png',
    imageAlt: 'A crowd of tiny pixel people around a card: “Someone sent you a message.”',
    robots: 'noindex,nofollow',
  },
  lost: {
    title: 'Page not found · Pixel Mob',
    description: 'This page wandered off with the mob. Head back to Pixel Mob and make a message.',
    image: '/og.png',
    imageAlt: 'Pixel Mob: a crowd of tiny pixel people spells PIXEL MOB above the words “Tiny people. Big feelings.”',
    robots: 'noindex,follow',
  },
};

export function renderMeta(kind, { path = '/', beacon = '' } = {}) {
  const p = PAGES[kind] || PAGES.lost;
  const url = SITE + path;
  // share links canonicalise to themselves so previews resolve, while noindex keeps them out of search
  const canonical = kind === 'lost' || kind === 'scrambled' ? SITE + '/' : url;
  const img = SITE + p.image;
  const lines = [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}">`,
    `<meta name="robots" content="${p.robots}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Pixel Mob">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:title" content="${esc(p.title)}">`,
    `<meta property="og:description" content="${esc(p.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:image:secure_url" content="${img}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(p.imageAlt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(p.title)}">`,
    `<meta name="twitter:description" content="${esc(p.description)}">`,
    `<meta name="twitter:image" content="${img}">`,
    `<meta name="twitter:image:alt" content="${esc(p.imageAlt)}">`,
  ];
  if (p.jsonld) {
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', '@id': SITE + '/#app', name: 'Pixel Mob', url: SITE + '/', description: PAGES.landing.description,
          applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript and HTML5 canvas',
          isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, image: SITE + '/og.png', inLanguage: 'en',
          featureList: ['Messages spelled by a crowd of pixel people', 'Pixel emoji drawings', 'Up to four scenes', 'Birthday, Christmas, Halloween, wedding and stadium themes', 'Custom colours and mob size', 'Countdown links', 'Reactions and replies', 'GIF and video download', 'Chiptune sound'] },
        { '@type': 'WebSite', '@id': SITE + '/#site', name: 'Pixel Mob', url: SITE + '/' },
        { '@type': 'HowTo', name: 'How to send a Pixel Mob message', step: [
          { '@type': 'HowToStep', name: 'Write your words', text: 'Type up to 32 characters a scene, add pixel drawings, or start from a template. Up to four scenes.' },
          { '@type': 'HowToStep', name: 'Send the surprise', text: 'Copy the link or use your phone’s share sheet. The preview keeps the message secret.' },
          { '@type': 'HowToStep', name: 'Watch them assemble', text: 'Your friend opens the link, taps to reveal, and the crowd spells your message.' } ] },
      ],
    };
    lines.push(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`);
  }
  if (beacon) lines.push(`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token: beacon, spa: false })}'></script>`);
  return lines.join('\n');
}
