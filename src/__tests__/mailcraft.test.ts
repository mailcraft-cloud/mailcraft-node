import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailCraft, MailCraftError, MailBuilder } from '../index';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('MailCraft', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should throw if apiKey is not provided', () => {
    expect(() => new MailCraft({ apiKey: '' })).toThrow('apiKey is required');
  });

  it('should send an email successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'log_123', status: 'sent' }),
    });

    const mail = new MailCraft({ apiKey: 'mc_test123' });
    const result = await mail.send({
      type: 'welcome',
      to: 'john@example.com',
      data: { name: 'John' },
    });

    expect(result.id).toBe('log_123');
    expect(result.status).toBe('sent');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.mailcraft.cloud/v1/send',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mc_test123',
        },
      }),
    );
  });

  it('should send with prompt and actions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'log_456', status: 'sent' }),
    });

    const mail = new MailCraft({ apiKey: 'mc_test123' });
    await mail.send({
      type: 'welcome',
      to: 'john@example.com',
      data: { name: 'John' },
      prompt: 'Be formal',
      actions: [{ label: 'Click here', url: 'https://example.com' }],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.prompt).toBe('Be formal');
    expect(body.actions).toHaveLength(1);
  });

  it('should use custom baseUrl', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'log_789', status: 'sent' }),
    });

    const mail = new MailCraft({ apiKey: 'mc_test', baseUrl: 'http://localhost:3000' });
    await mail.send({ type: 'test', to: 'test@test.com' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/v1/send',
      expect.anything(),
    );
  });

  it('should throw MailCraftError on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid API key' }),
    });

    const mail = new MailCraft({ apiKey: 'mc_bad' });
    await expect(mail.send({ type: 'test', to: 'test@test.com' }))
      .rejects.toThrow(MailCraftError);
  });

  it('should throw if type is missing', async () => {
    const mail = new MailCraft({ apiKey: 'mc_test' });
    await expect(mail.send({ type: '', to: 'test@test.com' }))
      .rejects.toThrow('type is required');
  });
});

describe('MailBuilder (fluent API)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should create a builder with mail.create()', () => {
    const mail = new MailCraft({ apiKey: 'mc_test' });
    const builder = mail.create('welcome');
    expect(builder).toBeInstanceOf(MailBuilder);
  });

  it('should build and send with chained methods', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'log_fluent', status: 'sent' }),
    });

    const mail = new MailCraft({ apiKey: 'mc_test' });
    const result = await mail.create('welcome')
      .to('sarah@example.com')
      .data({ name: 'Sarah', plan: 'Pro' })
      .prompt('Mention dedicated support')
      .action('Get Started', 'https://app.example.com')
      .action('View Docs', 'https://docs.example.com', 'secondary')
      .send();

    expect(result.id).toBe('log_fluent');
    expect(result.status).toBe('sent');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.type).toBe('welcome');
    expect(body.to).toBe('sarah@example.com');
    expect(body.data).toEqual({ name: 'Sarah', plan: 'Pro' });
    expect(body.prompt).toBe('Mention dedicated support');
    expect(body.actions).toHaveLength(2);
    expect(body.actions[0].label).toBe('Get Started');
    expect(body.actions[1].style).toBe('secondary');
  });

  it('should work with minimal chain', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'log_min', status: 'sent' }),
    });

    const mail = new MailCraft({ apiKey: 'mc_test' });
    await mail.create('otp-code')
      .to('john@test.com')
      .data({ code: '482910' })
      .send();

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.type).toBe('otp-code');
    expect(body.prompt).toBeUndefined();
    expect(body.actions).toBeUndefined();
  });

  it('should support .actions() for bulk setting', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'log_bulk', status: 'sent' }),
    });

    const mail = new MailCraft({ apiKey: 'mc_test' });
    await mail.create('invoice')
      .to('billing@test.com')
      .actions([
        { label: 'Pay Now', url: 'https://pay.example.com' },
        { label: 'View Invoice', url: 'https://invoice.example.com', style: 'secondary' },
      ])
      .send();

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.actions).toHaveLength(2);
  });
});
