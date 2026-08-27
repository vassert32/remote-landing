/**
 * English version. Structure mirrors ru.ts one-to-one.
 * Copy is written for the language, not translated word by word.
 */
export const en = {
  lang: 'en',
  locale: 'en-US',
  /** Switcher label: shows the language it switches TO. */
  switchTo: 'RUS',
  switchLabel: 'Переключить на русский',

  site: {
    name: 'Evgeny Gerkulesov',
    // TODO(client): full sole-trader details for the footer.
    legal: 'Sole trader E. Gerkulesov',
    given: 'Evgeny ',
    family: 'Gerkulesov',
    telegramHandle: '@gerkulesov35',
    title: 'Evgeny Gerkulesov. Mentorship to a remote offer in hard currency',
    description:
      'One-on-one mentorship for experienced engineers: CV and LinkedIn built for the remote market, ' +
      'interviews in English, offer negotiation. Nothing upfront, you pay after you start the job.',
  },

  cta: { label: 'Book a review call' },

  nav: [
    { label: 'Path', href: '#put' },
    { label: 'Program', href: '#programma' },
    { label: 'Terms', href: '#usloviya' },
    { label: 'FAQ', href: '#voprosy' },
  ],

  ui: {
    skipLink: 'Skip to main content',
    navLabel: 'Page sections',
    soon: 'Soon',
    soonAria: (name: string) => `${name}: link coming soon`,
    back: 'Back to home',
    howItWorks: 'How it works',
  },

  socials: [
    { name: 'Telegram', icon: 'ph:telegram-logo', key: 'telegram' },
    { name: 'GitHub', icon: 'ph:github-logo', key: 'github' },
    { name: 'Email', icon: 'ph:envelope-simple', key: 'email' },
    { name: 'Instagram', icon: 'ph:instagram-logo', key: 'instagram' },
  ],

  hero: {
    question: 'What is your experience worth?',
    answer: ['Same experience.', 'Different currency.'],
    /** Lead is built from parts: mark is a highlighter, accent is colour. */
    leadParts: [
      { t: 'Personal ' },
      { t: 'one-on-one mentorship', mark: true },
      { t: ' for experienced engineers: from rebuilding your CV to a signed ' },
      { t: 'offer', mark: true },
      { t: ' in dollars, euros or pounds.' },
    ] as ReadonlyArray<{ t: string; mark?: boolean }>,
  },

  /**
   * The first-screen document: a blank offer made out TO THE READER.
   * It is an invitation, not a record of something that happened: the
   * employer side is approved, the reader's signature is still missing.
   */
  offer: {
    docTitle: 'JOB OFFER',
    rows: [
      { key: 'To', value: 'YOU' },
      { key: 'Format', value: 'Remote, no relocation' },
      { key: 'Rate', value: 'from USD 5,000 per month' },
      { key: 'Currency', value: 'USD, EUR or GBP' },
      { key: 'Search time', value: '3-4 months' },
    ],
    signLabel: 'Signature',
    signCta: 'Sign it',
    stamp: 'Approved',
  },

  mentor: {
    title: "Who you'll work with",
    photoAlt: 'Evgeny Gerkulesov giving a talk in front of a service architecture diagram',
    plate: [
      { key: 'Name', value: 'Evgeny Gerkulesov' },
      { key: 'Role', value: 'Senior Backend Engineer' },
      { key: 'Format', value: 'One on one' },
    ],
    paragraphs: [
      "I'm Evgeny, a backend engineer. I started at Yandex School, worked my way onto " +
        'the staff, then signed a remote contract with a company abroad without leaving home.',
      'You work with me, not with a team of coordinators: your CV, applications, ' +
        'interview debriefs and offer negotiation all go through me personally. ' +
        'No group chats, no recorded lessons.',
      'Why you can trust this: I am not selling access to materials. My income is tied ' +
        'to your offer. Until you start the job, I earn exactly nothing.',
    ],
  },

  ladder: {
    title: 'My path. Your goal.',
    body:
      'Yandex School, the internship, the staff job: I went through all of it myself, ' +
      'with no connections and no relocation. So I remember where the months get lost ' +
      'and what interviews actually ask about.',
    panelTag: 'income by stage',
    chartLabel: 'Income growth across career stages',
    points: [
      {
        value: 0,
        prefix: '',
        suffix: ' ₽',
        stage: 'Start',
        weight: 0.02,
        icon: 'ph:flag',
        story: 'Lectures, side projects and commits nobody saw. Zero income, but finally a goal.',
      },
      {
        value: 40000,
        prefix: '',
        suffix: ' ₽',
        stage: 'Yandex School',
        weight: 0.06,
        icon: 'ph:graduation-cap',
        story: 'Six months of algorithms after work. That is where the internship offer came from.',
      },
      {
        value: 80000,
        prefix: '',
        suffix: ' ₽',
        stage: 'Internship',
        weight: 0.12,
        icon: 'ph:flask',
        story: 'Three months at full production pace next to seniors, then a staff contract.',
      },
      {
        value: 240000,
        prefix: '',
        suffix: ' ₽',
        stage: 'Yandex staff',
        weight: 0.35,
        icon: 'ph:buildings',
        story: 'Production services, incidents, growing into features I owned end to end.',
      },
      {
        value: 8500,
        prefix: '$',
        suffix: '',
        stage: 'Remote offer',
        weight: 1,
        icon: 'ph:globe-hemisphere-west',
        story: 'Interviews in English, a negotiation over the rate, and a contract with a UK company.',
      },
    ],
  },

  terms: {
    title: 'Zero upfront. I bill on results',
    body:
      'All preparation and guidance up to the offer is free. My invoice arrives once, ' +
      'and it is half of your first paycheck after you start the job. No offer, no invoice.',
    panelTag: 'invoice',
    rows: [
      { key: 'First review call', value: '₽0' },
      { key: 'Preparation and guidance up to the offer', value: '₽0' },
    ],
    final: { key: 'After your first paycheck', value: '50%', note: 'once, from your first paycheck, nothing after that' },
  },

  fit: {
    title: 'This is not a get-into-tech course',
    yesTitle: 'Good fit',
    noTitle: 'Not a fit',
    yes: [
      'You have worked in tech: engineering, QA, DevOps, analytics, design',
      'Your English is enough to explain your thinking. Fluency is not required',
      'You can put in ten hours a week or more',
      'You want the whole route, not a one-off CV tip',
    ],
    no: [
      'You are entering tech from scratch with no experience yet',
      'You are looking for a course with video lessons and a group chat',
      'You are not ready to speak English, mistakes and all',
      'You expect someone else to find the jobs and send the applications',
    ],
  },

  program: {
    title: 'Guidance across the whole route',
    body:
      'Six consecutive stages: from rebuilding your CV to your first weeks ' +
      'in the new job.',
    routeFrom: 'start',
    routeTo: 'offer',
    routeSpan: '3-4 months',
    steps: [
      {
        num: '1',
        title: 'Packaging your experience',
        text: 'We rebuild your CV and LinkedIn so a recruiter sees on the first screen what you solved and on which stack.',
      },
      {
        num: '2',
        title: 'Search and pipeline',
        text: 'Where to look, who to message directly, how to track applications and stop burning weeks on ones that go nowhere.',
      },
      {
        num: '3',
        title: 'Interviews in English',
        text: 'Self-presentation, the standard questions, telling your story. We drill it on calls until it stops being scary.',
      },
      {
        num: '4',
        title: 'Offer and negotiation',
        text: 'We go through the rate, the contract type and the conditions. I show where there is still room to push and where there is not.',
      },
      {
        num: '5',
        title: 'Money and paperwork',
        text: 'How to receive payments from abroad, what to do about registration, banks and taxes, so none of it becomes a panic later.',
      },
      {
        num: '6',
        title: 'The first weeks',
        text: 'How to get through probation: what to clarify, how to communicate in an English-speaking team, where newcomers usually stumble.',
      },
    ],
  },

  faq: {
    title: 'Questions people ask before the call',
    items: [
      {
        q: 'Can I join without tech experience?',
        a: 'No. I only work with people who already have commercial experience. Entering the profession from scratch needs a completely different format.',
      },
      {
        q: 'Can I combine this with a full-time job?',
        a: 'Yes, most people do. You need ten hours a week or more. We build the schedule around your actual workload.',
      },
      {
        q: 'How long does it take?',
        a: 'Three months and up. The exact timeline depends on your level, your English, and how many hours you put in.',
      },
      {
        q: 'Why do you get paid only on results?',
        a: 'Because then my income depends on your offer, not on how many people signed up. No offer, no invoice.',
      },
      {
        q: 'What if I fail every interview?',
        a: 'We debrief every attempt: what they asked, where you fell short, what to rewrite for the next one.',
      },
    ],
  },

  closer: {
    kicker: 'The first call is free',
    bigNum: '$0',
    bigNote: 'the cost of starting',
    title: 'The next offer could be yours',
    note:
      'We get on a call and look at your experience, your English and your goal. ' +
      'After that I tell you honestly whether it makes sense to work together.',
    foot: {
      sections: 'Sections',
      contact: 'Contact',
      docs: 'Documents',
      legalTitle: 'Legal',
      email: 'Email',
      github: 'GitHub',
    },
  },

  docs: {
    oferta: {
      title: 'Terms of service',
      about:
        'How the mentorship works: the format, the pay-after-results arrangement, ' +
        'and what each side commits to.',
    },
    dogovor: {
      title: 'Mentorship agreement',
      about:
        'The agreement we sign before starting: the stages, guidance up to the offer, ' +
        'and the payment of half your first paycheck.',
    },
    privacy: {
      title: 'Privacy policy',
      about:
        'What data I receive when you get in touch, how I store it and what I use it for. ' +
        'Nothing beyond what the call and the work require.',
    },
    statusTag: 'status',
    statusText:
      'This document is being finalised. I will send the current version on request ' +
      'in Telegram before we start, and we sign it before any paid step.',
    statusCta: 'Request in Telegram',
  },
} as const;
