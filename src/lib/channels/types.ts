// A sales channel the worker polls for customer questions (Mercado Livre, Shopee, a helpdesk...).
export type InboundQuestion = {
  id: string;
  text: string;
  item: string | null; // listing title or id the question was asked on
  customer: string;
  receivedAt: string;
};

export type Channel = {
  name: string; // stable id, used in idempotency keys
  label: string;
  // Extra instructions the model gets for this channel.
  promptRules: string;
  fetchPending(): Promise<InboundQuestion[]>;
  reply(question: InboundQuestion, text: string): Promise<void>;
  /** Why a reply can't be published on this channel, or null when it can. */
  checkReply(text: string): string | null;
};
