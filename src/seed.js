// Starting data. Used by demo mode and to generate supabase/seed.sql
// (run `npm run seed-sql` after editing).

export const event = {
  starts_at: '2026-12-05T11:00:00-06:00', // 11am Central
  line: 'Sat Dec 5 · 11am–4pm · Hotel Saint Cecilia, Austin, TX',
};

// Shown as "Last updated" in the header.
export const updated = '2026-11-05';

// The tag above each phase name doubles as its current status.
export const phases = [
  { id: 'coming-soon', name: 'Landing page', tag: 'Done — waiting on approval', target_label: 'Oct 30', target_date: '2026-10-30', sort: 1 },
  { id: 'shopify', name: 'Shopify website', tag: 'In progress', target_label: 'Dec 1', target_date: '2026-12-01', sort: 2 },
  { id: 'popup', name: 'Pop-up', tag: 'Up next', target_label: 'Sat Dec 5', target_date: '2026-12-05', sort: 3 },
];

export const milestones = [
  { label: 'Plan sent, assets in', date: '2026-10-23' },
  { label: 'Coming-soon page live', date: '2026-10-30' },
  { label: 'Pop-up designs approved', date: '2026-11-13' },
  { label: 'Print files sent', date: '2026-11-16' },
  { label: 'Thanksgiving buffer (nothing new starts)', date: '2026-11-23', end_date: '2026-11-27' },
  { label: 'Shop live, POS tested, prints in Austin', date: '2026-12-01' },
  { label: 'Pop-up · Hotel Saint Cecilia, Austin', date: '2026-12-05' },
].map((m, i) => ({ end_date: null, done: false, sort: i + 1, ...m }));

// t(phase, section, owner, title, due 'MM-DD', extra)
const t = (phase_id, section, owner, title, due, extra = {}) =>
  ({ phase_id, section, owner, title, due_date: `2026-${due}`, ...extra });
const waiting = (notes) => ({ status: 'waiting_on', notes });
const noDue = { due_date: null };

export const tasks = [
  // ── Landing page
  t('coming-soon', '', 'brooke', 'Wordmark SVGs, fonts, hero photos, and page copy', '10-23', { status: 'done' }),
  t('coming-soon', '', 'brooke', 'Design and build the landing page; test on mobile and desktop', '10-28', { status: 'done' }),
  t('coming-soon', '', 'brooke', 'Revisions: black header and footer, new palette dots, Instagram button', '11-05', { status: 'done' }),
  t('coming-soon', '', 'kenzie', 'Approve the landing page to go live', '11-09',
    { notes: 'Updated version sent Nov 5. Preview: https://brookerogersdesign.github.io/greck-landing/' }),
  t('coming-soon', '', 'both', 'Go live; Kenzie posts the link to Instagram and Depop', '', { ...noDue, notes: 'After Kenzie approves.' }),

  // ── Shopify website (two tabs: available bags + sold archive by collection)
  t('shopify', '', 'kenzie', 'Buy the domain, share the Drive, send the logo and font', '10-19', { status: 'done' }),
  t('shopify', '', 'kenzie', 'Decide the shop structure: shop tab + sold archive by collection', '10-23', { status: 'done' }),
  t('shopify', '', 'kenzie', 'Create the Shopify account and add Brooke as collaborator', '10-23'),
  t('shopify', '', 'kenzie', 'Share the domain names and give Brooke GoDaddy delegate access', '10-23'),
  t('shopify', '', 'kenzie', 'Fill in the master copy doc', '', noDue),
  t('shopify', '', 'kenzie', 'Pick favorite color combos', '', noDue),
  t('shopify', '', 'kenzie', 'Confirm names for the shop tab and archive tab', '10-23',
    { notes: 'Options: GET GRECKED / GOT GRECKED, GRECK / GRECKED, or BAG / BAGGED.' }),
  t('shopify', '', 'kenzie', 'Product details: prices, sizes, materials, and which collection each bag is in', '11-13'),
  t('shopify', '', 'kenzie', 'Share the marketing shoot photos', '11-06', { notes: 'Shot list is in the Oct 15 email.' }),
  t('shopify', '', 'kenzie', 'About page notes, shipping rates, and return policy', '11-13'),
  t('shopify', '', 'kenzie', 'Add bag photos and artwork to the Drive folder (ongoing)', '',
    { ...noDue, status: 'in_progress', notes: 'Ongoing, no deadline: she adds new bags and artwork as they come.' }),

  t('shopify', '', 'brooke', 'Master copy doc', '10-26', waiting('Started. Kenzie adds, cuts, and rewrites so it sounds like her. Link is in Links.')),
  t('shopify', '', 'brooke', 'Color combos', '10-26', waiting('Sent Oct 26; updated colors sent Nov 5.')),
  t('shopify', '', 'brooke', 'Explore funky background options for Kenzie to pick from', '11-20', { status: 'in_progress' }),
  t('shopify', '', 'brooke', 'Pick a theme and map the pages (Home, Shop, Sold archive, About, Contact, policies)', '11-03'),
  t('shopify', '', 'brooke', 'Move Depop listings over: photos, titles, prices, descriptions, collection tags', '11-13'),
  t('shopify', '', 'brooke', 'Build the pages, footer, and policies', '11-20'),
  t('shopify', '', 'brooke', 'Landing page as the password page: connect the domain, welcome email, test a signup', '11-20'),
  t('shopify', '', 'both', 'Payments, shipping, and POS on her phone; run a test order', '11-30'),
  t('shopify', '', 'kenzie', 'Approve the shop', '11-30'),
  t('shopify', '', 'brooke', 'Launch: turn off the password page and send the launch email', '12-01'),

  // ── Pop-up (Sat Dec 5, Hotel Saint Cecilia, Austin)
  t('popup', '', 'kenzie', 'Send location, date, and hours', '11-02', { status: 'done', notes: 'Hotel Saint Cecilia, Austin, TX. Sat Dec 5, 11am–4pm. One day only.' }),
  t('popup', '', 'brooke', 'Business card designs sent', '10-26', { status: 'done' }),
  t('popup', '', 'brooke', 'Pop-up emails (email marketing)', '11-20'),
  t('popup', '', 'brooke', 'Instagram posts announcing the pop-up', '11-13'),
  t('popup', '', 'brooke', 'Business cards: order once approved', '11-16',
    waiting('Updated cards sent Nov 5. Waiting on Kenzie to approve.')),
  t('popup', '', 'kenzie', 'Approve the business cards', '', noDue),
  t('popup', '', 'brooke', 'Thank-you card inserts', '11-16'),
  t('popup', '', 'kenzie', 'Approve the pop-up emails, posts, and inserts', '11-13'),
  t('popup', '', 'kenzie', 'Confirm the printed pieces arrived in Austin', '12-01'),
].map((task, i) => ({ status: 'not_started', notes: '', sort: i + 1, ...task }));

export const links = [
  { label: 'Landing page (live preview)', url: 'https://brookerogersdesign.github.io/greck-landing/' },
  { label: 'Master copy doc', url: '' },
  { label: 'Domain (GoDaddy) · TBD, waiting on Kenzie', url: '' },
  { label: 'Shopify admin', url: 'https://admin.shopify.com/' },
  { label: 'Google Drive assets', url: '' },
  { label: 'Depop @greckbags', url: 'https://www.depop.com/greckbags/' },
  { label: 'Instagram @greckdotcom', url: 'https://www.instagram.com/greckdotcom/' },
].map((l, i) => ({ sort: i + 1, ...l }));

export const log = [
  { author: 'brooke', kind: 'note', body: 'Dashboard is up. Check things off as you go.', created_at: '2026-10-08T12:00:00Z' },
  { author: 'brooke', kind: 'decision', body: 'Shop structure: two tabs. The shop is available bags. The archive is sold bags on one scrollable page, grouped by collection (e.g., GRECK FLANNEL with its bags below, then the next collection).', created_at: '2026-10-15T12:00:00Z' },
  { author: 'brooke', kind: 'open', body: 'Tab names, not final yet. Options: GET GRECKED / GOT GRECKED, GRECK / GRECKED, or BAG / BAGGED. Kenzie to confirm by Oct 23.', created_at: '2026-10-15T12:00:30Z' },
  { author: 'brooke', kind: 'decision', body: 'The About page will include Kenzie’s reasoning behind her colors and patterns.', created_at: '2026-10-15T12:00:45Z' },
  { author: 'brooke', kind: 'decision', body: 'Logo and type: the Canva wordmark becomes a vector SVG so the site doesn’t depend on the font. Fira Code (Google Fonts) for site text; check FF Providence Sans web licensing first.', created_at: '2026-10-15T12:01:00Z' },
  { author: 'brooke', kind: 'decision', body: 'Pop-up is one day only: Sat Dec 5, Hotel Saint Cecilia, Austin, 11am–4pm. Printed pieces ship to Kenzie in Austin.', created_at: '2026-10-15T12:02:00Z' },
  { author: 'brooke', kind: 'note', body: 'Marketing shoot is late October. Shot list is in the Oct 15 email.', created_at: '2026-10-15T12:03:00Z' },
  { author: 'brooke', kind: 'note', body: 'Thanksgiving week (Nov 23–27) is the buffer. Nothing new starts then.', created_at: '2026-10-15T12:04:00Z' },
  { author: 'brooke', kind: 'note', body: 'Check-in call + follow-up email sent.', created_at: '2026-10-26T18:00:00Z' },
  { author: 'brooke', kind: 'decision', body: 'Landing page is live and in revisions: https://brookerogersdesign.github.io/greck-landing/. Headers and footers switched from green to black because the green didn’t stand out.', created_at: '2026-10-26T18:01:00Z' },
  { author: 'brooke', kind: 'note', body: 'Sent Oct 26: color combos and business card designs. Started the master copy doc, the single source of truth for all website copy. Waiting on Kenzie for all three.', created_at: '2026-10-26T18:02:00Z' },
  { author: 'brooke', kind: 'note', body: 'Shopify site keeps moving in parallel with the pop-up materials.', created_at: '2026-10-26T18:03:00Z' },
  { author: 'brooke', kind: 'note', body: 'Sent Nov 5: updated colors, the updated landing page (new palette dots, Instagram button in the header), and updated business cards. Waiting on Kenzie’s picks.', created_at: '2026-11-05T18:00:00Z' },
  { author: 'brooke', kind: 'decision', body: 'Landing page design is done and waiting on Kenzie’s approval to go live. Setup items (Shopify account, domain, welcome email, signup test) moved to the Shopify phase.', created_at: '2026-11-05T18:01:00Z' },
  { author: 'brooke', kind: 'decision', body: 'Dashboard simplified. Pop-up plan is now: pop-up emails, Instagram posts, business cards (order once approved), and thank-you card inserts.', created_at: '2026-11-05T19:00:00Z' },
  { author: 'brooke', kind: 'open', body: 'Pop-up marketing: Kenzie to choose what to start first. Posters, guerrilla-style marketing, email marketing, or bag stuffers / post-purchase takeaways (4x6 cards, printed at FedEx).', created_at: '2026-10-26T18:04:00Z' },
];
