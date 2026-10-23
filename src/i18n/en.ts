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
    // Short signature for legacy pages; full provider details are in legal and business.
    legal: 'E. Gerkulesov',
    given: 'Evgeny ',
    family: 'Gerkulesov',
    telegramHandle: '@gerkulesov35',
    title: 'Evgeny Gerkulesov. Mentorship to a remote offer in hard currency',
    description:
      'One-on-one mentorship for experienced engineers: CV and LinkedIn built for the remote market, ' +
      'interviews in English, offer negotiation. Three payment plans: upfront plus salary-based payments, or full payment upfront.',
  },

  cta: { label: 'Book a review call', short: 'Book a call' },

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

  /** 404 page: kept inside the document metaphor. */
  notFound: {
    code: '404',
    stamp: 'Not found',
    title: 'No such document',
    text: 'The address has a typo, or the page is gone. Everything there is lives on the home page.',
  },

  socials: [
    { name: 'Telegram', icon: 'ph:telegram-logo', key: 'telegram' },
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
      "I'm Evgeny, a backend engineer. I went through the entire grind of the " +
        'tech industry and reached the international market on my own: I started ' +
        'at 19, and by 21 I was already working remotely for a foreign company.',
      'With me, not a team of coordinators, we go through your CV, applications, ' +
        'interviews and offer negotiation. All of it personally — no group chats, ' +
        'no recorded lessons.',
      'The work follows your actual job search: we review real vacancies, ' +
        'prepare for specific interviews and discuss the terms of your offer.',
    ],
  },

  ladder: {
    title: 'My path. Your goal.',
    body:
      'I climbed every step on this chart myself, from the start to a contract ' +
      'in hard currency. I know this route from the inside: where the months get ' +
      'lost and what interviews actually ask about.',
    panelTag: 'income by stage',
    chartLabel: 'Income growth across career stages',
    timeStart: '2024',
    timeMid: '2025',
    timeEnd: '2026',
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
    title: 'Three ways to pay',
    body:
      'Choose your balance between an upfront payment and a share of your first two salaries. ' +
      'Or pay the full amount upfront, with no further payments.',
    planLabel: 'Plan',
    upfrontLabel: 'Upfront payment',
    postpayLabel: 'After you start the job',
    postpayNote: 'of each of your first two salaries',
    noPostpayNote: 'No further payments: the full price is paid upfront.',
    offerLabel: 'Monthly offer',
    exampleSummary: 'One monthly salary covers the full cost of any plan.',
    exampleNeutral: 'Compare the full plan cost with your first monthly salary.',
    postpayTotalLabel: 'Payments from both salaries',
    totalLabel: 'Full plan cost',
    remainingLabel: 'Left from your first salary',
    shortfallLabel: 'Not covered by your first salary',
    exampleNote: 'Example using a rounded exchange rate and two equal monthly salaries. The balance deducts the upfront payment and both salary-based payments, before taxes and fees.',
    agreementNote: 'We agree on the plan and payment schedule in the contract before starting.',
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
        q: 'How does payment work?',
        a: 'Two plans combine an upfront payment with a percentage of each of your first two salaries. A third plan is paid in full upfront, with no further payments. We agree on the terms in the contract before starting.',
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
    bigNote: 'first review call',
    title: 'The next offer could be yours',
    note:
      'We get on a call and look at your experience, your English and your goal. ' +
      'After that I tell you honestly whether it makes sense to work together.',
  },

  legal: {
    name: 'Individual entrepreneur Gerkulesov Evgeny Olegovich',
    address: 'Vologda, Russia',
    innLabel: 'INN (tax ID)',
    ogrnipLabel: 'OGRNIP',
    emailLabel: 'Email',
    telegramLabel: 'Telegram',
    taxLabel: 'Tax regimes',
    taxSystem: 'USN, PSN (Russia)',
    navLabel: 'Documents and contact',
    agreementLink: 'Service agreement',
    draft: 'Draft',
    agreementTitle: 'Service agreement',
    agreementAbout: 'Individual consulting and information services to help prepare for a job search in tech.',
    draftNote: 'Draft for review. The scope, timeline, price and payment schedule are agreed individually before the agreement and its appendices are signed. Viewing or downloading the file does not enter you into an agreement.',
    fileTitle: 'Agreement and appendices',
    fileMeta: 'PDF · 14 pages · in Russian',
    openPdf: 'Open PDF',
    downloadPdf: 'Download file',
    providerTitle: 'Service provider and contact',
    contactNote: 'For questions about the agreement or services, contact me by email or Telegram.',
  },

  docs: {
    oferta: {
      title: 'Draft service agreement',
      about:
        'Draft individual agreement for consulting and information services.',
    },
    dogovor: {
      title: 'Service agreement',
      about:
        'Draft agreement and appendices. Scope, timeline, price and payment are agreed before signing.',
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
