// Starting data. Used by demo mode and to generate supabase/seed.sql
// (run `npm run seed-sql` after editing).

export const event = {
  starts_at: '2026-12-05T11:00:00-06:00', // 11am Central
  line: 'Sat Dec 5 · 11am–4pm · Hotel Saint Cecilia, Austin, TX',
};

export const phases = [
  { id: 'comms', name: 'Client comms', tag: 'Now', target_label: 'Oct 23', target_date: '2026-10-23', sort: 1 },
  { id: 'coming-soon', name: 'Coming-soon page', tag: 'Part 1', target_label: 'Oct 30', target_date: '2026-10-30', sort: 2 },
  { id: 'shopify', name: 'Shopify website', tag: 'Part 1', target_label: 'Dec 1', target_date: '2026-12-01', sort: 3 },
  { id: 'popup', name: 'Pop-up', tag: 'Part 2', target_label: 'Sat Dec 5', target_date: '2026-12-05', sort: 4 },
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
const received = (notes) => ({ status: 'done', notes });
const partly = (notes) => ({ status: 'in_progress', notes });

export const tasks = [
  // ── Now: client comms
  t('comms', '', 'brooke', 'Send the checklist email to Kenzie (website first, then pop-up)', '10-16'),
  t('comms', '', 'brooke', 'Pull 4–6 Shopify site inspirations for her to react to (layouts, product display, vibe)', '10-16'),
  t('comms', '', 'brooke', 'Send Oct 15 update email: shop structure, fonts, shot list, pop-up questions', '10-16'),
  t('comms', '', 'brooke', 'Send the game plan and timeline (casual, not a formal proposal)', '10-23'),

  // ── Part 1: Coming-soon page (Shopify password page with email signup)
  t('coming-soon', 'From Kenzie', 'kenzie', 'Buy domain on GoDaddy', '10-16', received('Purchased. Names not shared yet.')),
  t('coming-soon', 'From Kenzie', 'kenzie', 'Share which domain names she bought', '10-16'),
  t('coming-soon', 'From Kenzie', 'kenzie', 'Add Brooke to Google Drive', '10-16', received('Done. Assets still uploading.')),
  t('coming-soon', 'From Kenzie', 'kenzie', 'Create Drive folder with bag photos and artwork', '10-19', partly('Folder shared; still uploading.')),
  t('coming-soon', 'From Kenzie', 'kenzie', 'Send GRECK. logo file and font name', '10-19',
    received('Wordmark is FF Providence Sans in Canva with a thick stroke; she loves the two-circle lowercase "g". Insert-card body text is Fira Code bold.')),
  t('coming-soon', 'From Kenzie', 'kenzie', 'Upload the insert-card printout to Drive', '10-19'),
  t('coming-soon', 'From Kenzie', 'kenzie', 'Give Brooke GoDaddy delegate access', '10-23'),
  t('coming-soon', 'From Kenzie', 'kenzie', 'Share how she wants bags organized (series, drops, style)', '10-23', received('Two tabs: the shop (available bags) and the archive (sold bags grouped by collection).')),
  t('coming-soon', 'From Kenzie', 'kenzie', 'Create the Shopify account in her name and add Brooke as collaborator', '10-23'),

  t('coming-soon', 'Setup', 'both', 'Pick a Shopify plan (Basic is enough to start)', '10-23'),
  t('coming-soon', 'Setup', 'brooke', 'Connect the GoDaddy domain to Shopify (DNS records)', '10-26'),
  t('coming-soon', 'Setup', 'both', 'Set up a branded email if wanted (e.g., hello@ her domain)', '10-28'),

  t('coming-soon', 'Design + content', 'brooke', 'Convert Canva wordmark to vector SVG (font received)', '10-23',
    { notes: 'FF Providence Sans, thick stroke; keep the two-circle lowercase "g".' }),
  t('coming-soon', 'Design + content', 'brooke', 'Check web licensing for FF Providence Sans; use Fira Code (Google Fonts) for site text', '10-23'),
  t('coming-soon', 'Design + content', 'brooke', 'Choose 1–3 hero images from her photo folder', '10-22'),
  t('coming-soon', 'Design + content', 'brooke', 'Write the page: GRECK. [GUH-WRECK] definition, one-line teaser, "Join the list" CTA', '10-24'),
  t('coming-soon', 'Design + content', 'brooke', 'Design the password page in her monospace + period style (Fira Code)', '10-28'),
  t('coming-soon', 'Design + content', 'brooke', 'Add Instagram and Depop links', '10-28'),
  t('coming-soon', 'Design + content', 'brooke', 'Set up the welcome email for new signups', '10-29'),

  t('coming-soon', 'Launch', 'brooke', 'Test on mobile and desktop', '10-29'),
  t('coming-soon', 'Launch', 'brooke', 'Test a signup end to end', '10-29'),
  t('coming-soon', 'Launch', 'kenzie', 'Approve the coming-soon page', '10-29'),
  t('coming-soon', 'Launch', 'both', 'Go live; Kenzie posts the link to Instagram and Depop', '10-30'),

  // ── Part 1: Shopify website (two tabs: available bags + sold archive by collection)
  t('shopify', 'From Kenzie', 'kenzie', 'React to the inspiration sites', '10-27'),
  t('shopify', 'From Kenzie', 'kenzie', 'Confirm final names for the shop tab and archive tab', '10-23',
    { notes: 'Options: GET GRECKED / GOT GRECKED, GRECK / GRECKED, or BAG / BAGGED.' }),
  t('shopify', 'From Kenzie', 'kenzie', 'Label which collection each bag belongs to in the Drive', '10-27'),
  t('shopify', 'From Kenzie', 'kenzie', 'Product details: prices, sizes, materials', '11-02'),
  t('shopify', 'From Kenzie', 'kenzie', 'Marketing shoot', '10-31', { notes: 'Late October. Shot list below and in the Oct 15 email.' }),
  t('shopify', 'From Kenzie', 'kenzie', 'Share the marketing shoot photos with Brooke', '11-06'),
  t('shopify', 'From Kenzie', 'kenzie', 'About page notes: the reasoning behind her colors and patterns', '11-09'),
  t('shopify', 'From Kenzie', 'kenzie', 'Shipping rates and return policy', '11-13'),

  t('shopify', 'Planning', 'brooke', 'Review her reactions to the inspiration sites', '10-28'),
  t('shopify', 'Planning', 'brooke', 'Choose a theme', '11-03'),
  t('shopify', 'Planning', 'brooke', 'Map pages: Home, Shop, Sold archive, About the Artist, Contact / Custom Orders, policies', '11-03'),

  t('shopify', 'Products', 'brooke', 'Move Depop listings over: photos, titles, prices', '11-10'),
  t('shopify', 'Products', 'brooke', 'Write product descriptions in her voice', '11-13'),
  t('shopify', 'Products', 'brooke', 'Set one-of-a-kind pieces to quantity 1', '11-13'),
  t('shopify', 'Products', 'brooke', 'Tag every bag with its collection; sold bags stay visible in the archive', '11-13'),
  t('shopify', 'Products', 'both', 'Fill photo gaps (detail, scale, and inside shots)', '11-13'),

  t('shopify', 'Build', 'brooke', 'Homepage: editorial hero, featured drop, artist intro', '11-20'),
  t('shopify', 'Build', 'brooke', 'About page from her bio (ABOUT., BUGS., DOTS., COLOR.)', '11-20'),
  t('shopify', 'Build', 'brooke', 'Shipping, returns, and privacy policies', '11-20'),
  t('shopify', 'Build', 'brooke', 'Payments, taxes, and shipping settings', '11-20'),
  t('shopify', 'Build', 'brooke', 'Footer: email signup, social links', '11-20'),
  t('shopify', 'Build', 'brooke', 'Add a "Join the list for the next drop" button to sold bags in the archive', '11-20'),

  t('shopify', 'Shot list', 'kenzie', '1–2 wide horizontal shots with empty space for text (homepage hero)', '10-31'),
  t('shopify', 'Shot list', 'kenzie', 'Vertical versions of the hero shots (mobile and stories)', '10-31'),
  t('shopify', 'Shot list', 'kenzie', 'Each bag on the same plain background, front and back (product pages)', '10-31'),
  t('shopify', 'Shot list', 'kenzie', 'Close-ups of paint and texture', '10-31'),
  t('shopify', 'Shot list', 'kenzie', 'Kenzie painting or working (About page)', '10-31'),
  t('shopify', 'Shot list', 'kenzie', 'Signature stacked-bag shot, and bags being worn', '10-31'),

  t('shopify', 'Launch', 'both', 'Set up Shopify POS on her phone and test a card reader', '11-30'),
  t('shopify', 'Launch', 'both', 'Run a test order online and in person', '11-30'),
  t('shopify', 'Launch', 'kenzie', 'Approve the shop', '11-30'),
  t('shopify', 'Launch', 'brooke', 'Turn off the password page and send the launch email to her list', '12-01'),
  t('shopify', 'Launch', 'kenzie', 'Decide whether Depop stays open; post the move to Depop followers', '12-01'),

  // ── Part 2: Pop-up (Sat Dec 5, Hotel Saint Cecilia, Austin)
  t('popup', 'From Kenzie', 'kenzie', 'Send location, date, and hours', '11-02', received('Hotel Saint Cecilia, Austin, TX. Sat Dec 5, 11am–4pm. One day only.')),
  t('popup', 'From Kenzie', 'kenzie', 'Send venue rules from Hotel Saint Cecilia: table size, signage/banners, outlets', '11-02'),
  t('popup', 'From Kenzie', 'kenzie', 'Wish list of printed pieces and takeaways', '11-06'),
  t('popup', 'From Kenzie', 'kenzie', 'Budget for printing', '11-06'),

  t('popup', 'Ideas', 'brooke', 'Signage and display mood board, incl. the stacked-bag table display from her Instagram', '11-06'),

  t('popup', 'Design', 'brooke', 'Business cards', '11-13'),
  t('popup', 'Design', 'brooke', 'Banner or backdrop (her painted pattern + GRECK. wordmark)', '11-13'),
  t('popup', 'Design', 'brooke', 'QR code sign ("Shop online / Join the list")', '11-13'),
  t('popup', 'Design', 'brooke', 'Price menu or tent cards', '11-13'),
  t('popup', 'Design', 'brooke', 'Hang tags ("Original art by GRECK.")', '11-13'),
  t('popup', 'Design', 'brooke', 'Thank-you or insert cards', '11-13'),
  t('popup', 'Design', 'brooke', 'Stickers, tissue paper, totes (if she wants them)', '11-13'),
  t('popup', 'Design', 'brooke', 'Social graphics announcing the pop-up', '11-13'),
  t('popup', 'Design', 'kenzie', 'Approve the pop-up designs', '11-13'),

  t('popup', 'Production', 'brooke', 'Get print quotes and choose the printer', '11-10'),
  t('popup', 'Production', 'brooke', 'Plan print shipping to Austin (everything must arrive by Dec 1)', '11-13'),
  t('popup', 'Production', 'brooke', 'Send print files by Nov 16 (shipping to Kenzie in Austin)', '11-16'),
  t('popup', 'Production', 'kenzie', 'Confirm printed pieces have arrived in Austin by Dec 1', '12-01'),
  t('popup', 'Production', 'brooke', 'Test every QR code', '12-01'),
].map((task, i) => ({ status: 'not_started', notes: '', sort: i + 1, ...task }));

export const links = [
  { label: 'Domain (GoDaddy) · TBD, waiting on Kenzie', url: '' },
  { label: 'Shopify admin', url: 'https://admin.shopify.com/' },
  { label: 'Google Drive assets', url: '' },
  { label: 'Depop', url: 'https://www.depop.com/' },
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
];
