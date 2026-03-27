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
