export interface MailCraftConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface SendOptions {
  type: string;
  to: string;
  data?: Record<string, unknown>;
  prompt?: string;
  actions?: Array<{
    label: string;
    url: string;
    style?: 'primary' | 'secondary';
  }>;
}

export interface SendResult {
  id: string;
  status: 'sent' | 'failed' | 'fallback';
}

export class MailCraftError extends Error {
  public statusCode: number;
  public body: unknown;

  constructor(message: string, statusCode: number, body?: unknown) {
    super(message);
    this.name = 'MailCraftError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

/**
 * Fluent email builder — chainable API for constructing and sending emails.
 *
 * Usage:
 *   await mail.create('welcome')
 *     .to('john@example.com')
 *     .data({ name: 'John', plan: 'Pro' })
 *     .prompt('Mention dedicated support')
 *     .action('Get Started', 'https://app.example.com')
 *     .send()
 */
export class MailBuilder {
  private readonly client: MailCraft;
  private options: SendOptions;

  constructor(client: MailCraft, type: string) {
    this.client = client;
    this.options = { type, to: '' };
  }

  to(email: string): this {
    this.options.to = email;
    return this;
  }

  data(data: Record<string, unknown>): this {
    this.options.data = data;
    return this;
  }

  prompt(prompt: string): this {
    this.options.prompt = prompt;
    return this;
  }

  action(label: string, url: string, style?: 'primary' | 'secondary'): this {
    if (!this.options.actions) this.options.actions = [];
    this.options.actions.push({ label, url, style });
    return this;
  }

  actions(actions: Array<{ label: string; url: string; style?: 'primary' | 'secondary' }>): this {
    this.options.actions = actions;
    return this;
  }

  async send(): Promise<SendResult> {
    return this.client.send(this.options);
  }
}

export class MailCraft {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: MailCraftConfig) {
    if (!config.apiKey) {
      throw new Error('MailCraft: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://api.mailcraft.cloud';
  }

  /**
   * Create a fluent email builder.
   *
   *   await mail.create('welcome')
   *     .to('john@example.com')
   *     .data({ name: 'John' })
   *     .send()
   */
  create(type: string): MailBuilder {
    return new MailBuilder(this, type);
  }

  /**
   * Send an email directly with options object.
   *
   *   await mail.send({ type: 'welcome', to: 'john@example.com' })
   */
  async send(options: SendOptions): Promise<SendResult> {
    if (!options.type) throw new Error('MailCraft: type is required');
    if (!options.to) throw new Error('MailCraft: to is required');

    const response = await fetch(`${this.baseUrl}/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        type: options.type,
        to: options.to,
        data: options.data,
        prompt: options.prompt,
        actions: options.actions,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = (body as any)?.message ?? `Request failed with status ${response.status}`;
      throw new MailCraftError(message, response.status, body);
    }

    return response.json() as Promise<SendResult>;
  }
}

export default MailCraft;
