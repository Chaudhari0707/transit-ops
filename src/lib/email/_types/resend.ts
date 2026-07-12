export type SendTransactionalEmailInput = {
  /** Optional override; defaults to EMAIL_FROM_NAME <EMAIL_FROM_ADDRESS>. */
  from?: string;
  html?: string;
  subject: string;
  text?: string;
  to: SendTransactionalEmailRecipient | string;
};

export type SendTransactionalEmailRecipient = {
  email: string;
  name?: string;
};

export type SendTransactionalEmailResult = {
  providerMessageId: string | null;
};

export type SendViaResendOptions = {
  apiKey?: string;
  env?: Record<string, string | undefined>;
};
