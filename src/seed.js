// Starting data. Used by demo mode and to generate supabase/seed.sql
// (run `npm run seed-sql` after editing).

export const phases = [
  { id: 'coming-soon', name: 'Coming-soon page', tag: 'Phase 1', target_label: 'Oct 30', target_date: '2026-10-30', sort: 1 },
  { id: 'shopify', name: 'Shopify website', tag: 'Phase 1', target_label: 'Dec 1', target_date: '2026-12-01', sort: 2 },
  { id: 'popup', name: 'Pop-up', tag: 'Phase 2', target_label: 'Dec 5–6', target_date: '2026-12-05', sort: 3 },
];

export const milestones = [
  { label: 'Plan sent, assets in', date: '2026-10-23' },
  { label: 'Coming-soon page live', date: '2026-10-30' },
  { label: 'Pop-up designs approved', date: '2026-11-13' },
  { label: 'Print files sent', date: '2026-11-16' },
  { label: 'Shop live, POS tested', date: '2026-12-01' },
  { label: 'Pop-up', date: '2026-12-05', end_date: '2026-12-06' },
].map((m, i) => ({ end_date: null, done: false, sort: i + 1, ...m }));

const t = (phase_id, owner, title, due) => ({ phase_id, owner, title, due_date: `2026-${due}` });

export const tasks = [
  t('coming-soon', 'kenzie', 'Buy domain on GoDaddy', '10-16'),
  t('coming-soon', 'kenzie', 'Create Drive folder with bag photos and artwork', '10-19'),
  t('coming-soon', 'kenzie', 'Send GRECK. logo file and font name', '10-19'),
  t('coming-soon', 'kenzie', 'Create Shopify account and add Brooke as collaborator', '10-23'),
  t('coming-soon', 'kenzie', 'Share how she wants bags organized (series, drops, style)', '10-23'),
  t('coming-soon', 'brooke', 'Send website inspirations', '10-16'),
  t('coming-soon', 'brooke', 'Connect domain to Shopify', '10-26'),
  t('coming-soon', 'brooke', 'Design password page with email signup', '10-28'),
  t('coming-soon', 'brooke', 'Set up welcome email', '10-29'),
  t('coming-soon', 'kenzie', 'Approve coming-soon page', '10-29'),
  t('coming-soon', 'brooke', 'Launch coming-soon page', '10-30'),

  t('shopify', 'kenzie', 'React to inspiration sites', '10-27'),
  t('shopify', 'kenzie', 'Send product details: prices, sizes, materials', '11-02'),
  t('shopify', 'brooke', 'Choose theme and map pages', '11-03'),
  t('shopify', 'brooke', 'Move Depop listings and write descriptions', '11-13'),
  t('shopify', 'brooke', 'Build homepage, About, collections', '11-20'),
  t('shopify', 'kenzie', 'Send shipping rates and return policy', '11-13'),
  t('shopify', 'brooke', 'Payments, taxes, shipping settings', '11-20'),
  t('shopify', 'both', 'Set up and test Shopify POS', '11-30'),
  t('shopify', 'kenzie', 'Final approval', '11-30'),
  t('shopify', 'brooke', 'Launch shop and send launch email', '12-01'),

  t('popup', 'kenzie', 'Send location, hours, booth size, venue rules', '11-02'),
  t('popup', 'kenzie', 'Send printed pieces / takeaways wish list and print budget', '11-06'),
  t('popup', 'brooke', 'Send signage and display mood board', '11-06'),
  t('popup', 'brooke', 'Design business cards, banner, QR sign, price menu, hang tags, thank-you cards, social graphics', '11-13'),
  t('popup', 'kenzie', 'Approve pop-up designs', '11-13'),
  t('popup', 'brooke', 'Send print files', '11-16'),
  t('popup', 'brooke', 'Confirm printed pieces in hand and test QR codes', '12-01'),
].map((task, i) => ({ status: 'not_started', notes: '', sort: i + 1, ...task }));

export const links = [
  { label: 'Domain (GoDaddy)', url: 'https://dcc.godaddy.com/' },
  { label: 'Shopify admin', url: 'https://admin.shopify.com/' },
  { label: 'Google Drive assets', url: '' },
  { label: 'Depop', url: 'https://www.depop.com/' },
  { label: 'Instagram @greckdotcom', url: 'https://www.instagram.com/greckdotcom/' },
].map((l, i) => ({ sort: i + 1, ...l }));

export const log = [
  { author: 'brooke', kind: 'note', body: 'Dashboard is up. Check things off as you go.', created_at: '2026-10-08T12:00:00Z' },
];
