import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MailCraft, MailCraftError } from '../index';

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
