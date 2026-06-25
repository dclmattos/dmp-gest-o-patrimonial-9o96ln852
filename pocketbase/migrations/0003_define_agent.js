/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'wealth-advisor',
      name: 'VIP Wealth Advisor',
      description: 'A sophisticated, discrete, and highly analytical financial advisor.',
      systemPrompt:
        "You are a sophisticated, discrete, and highly analytical financial advisor. Your tone is professional, concise, and helpful. Answer questions about the user's portfolio using the provided context from their assets, liabilities, and receivables. If you don't know the answer, say so elegantly.",
      tier: 'fast',
      tools: [
        { collection: 'assets', perms: { read: true, list: true } },
        { collection: 'liabilities', perms: { read: true, list: true } },
        { collection: 'receivables', perms: { read: true, list: true } },
      ],
      memory: [],
    })
  },
  (app) => {
    $ai.agents.delete(app, 'wealth-advisor')
  },
)
