# @mailcraft/sdk

Official Node.js SDK for [MailCraft](https://github.com/mailcraft-cloud/mailcraft) — open source transactional email with AI-generated content.

## Install

```bash
npm install @mailcraft/sdk
```

## Usage

```typescript
import { MailCraft } from '@mailcraft/sdk'

const mail = new MailCraft({ apiKey: 'mc_your_api_key' })

await mail.send({
  type: 'welcome',
  to: 'john@example.com',
  data: { name: 'John', plan: 'Pro' },
  prompt: 'Mention dedicated support',     // optional
  actions: [{ label: 'Get Started', url: 'https://...' }]  // optional
})
```

## API

### `new MailCraft(config)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your MailCraft API key (`mc_...`) |
| `baseUrl` | `string` | No | API base URL (default: `https://api.mailcraft.cloud`) |

### `mail.send(options)`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `type` | `string` | Yes | Email type: `'welcome'`, `'invoice'`, `'password-reset'`, etc. |
| `to` | `string` | Yes | Recipient email |
| `data` | `object` | No | Dynamic data (name, plan, etc.) |
| `prompt` | `string` | No | Instructions to steer AI content |
| `actions` | `array` | No | CTA buttons: `[{ label, url, style? }]` |

Returns `Promise<{ id: string, status: 'sent' | 'failed' | 'fallback' }>`

### Error handling

```typescript
import { MailCraft, MailCraftError } from '@mailcraft/sdk'

try {
  await mail.send({ type: 'welcome', to: 'john@test.com' })
} catch (err) {
  if (err instanceof MailCraftError) {
    console.log(err.statusCode) // 401, 400, 502, etc.
    console.log(err.message)    // "Invalid API key"
  }
}
```

## Self-hosted

Point to your own MailCraft instance:

```typescript
const mail = new MailCraft({
  apiKey: 'mc_...',
  baseUrl: 'https://your-mailcraft-api.com'
})
```

## License

MIT
