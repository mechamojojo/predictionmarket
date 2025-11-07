# Payment Processor Integration Guide

This guide explains how to configure payment processors for your smart account funding system.

## Overview

Your app now includes a comprehensive funding modal (`FundingModal`) that provides multiple ways for users to add funds to their smart accounts:

1. **Buy Crypto** - Direct purchase via Stripe (via Thirdweb BuyWidget)
2. **Transfer** - Direct crypto transfers to smart account address
3. **Bridge** - Cross-chain bridging options

## Current Setup: Thirdweb BuyWidget (Stripe)

The `BuyWidget` component from Thirdweb integrates with Stripe to enable fiat-to-crypto purchases. It's already configured in your `FundingModal` component.

### Configuration Requirements

1. **Thirdweb Dashboard Setup**:
   - Go to [Thirdweb Dashboard](https://thirdweb.com/dashboard)
   - Enable payment processing in your app settings
   - Configure Stripe integration (if required)

2. **Environment Variables**:
   Make sure you have these in your `.env.local`:
   ```bash
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
   ```

3. **Chain Configuration**:
   - Currently set to `baseSepolia` (testnet)
   - For production, change to `base` mainnet:
   ```typescript
   import { base } from "thirdweb/chains";
   // Then use: chain={base}
   ```

### Supported Payment Methods

The BuyWidget supports:
- Credit Cards
- Debit Cards
- Apple Pay
- Google Pay

## Alternative Payment Processors

If you want more control or different payment options, here are alternatives:

### Option 1: MoonPay Integration

MoonPay is a popular crypto payment processor with good Web3 integration.

**Installation**:
```bash
npm install @moonpay/moonpayjs
```

**Basic Integration Example**:
```typescript
import { MoonPay } from '@moonpay/moonpayjs';

const moonPay = new MoonPay({
  apiKey: process.env.NEXT_PUBLIC_MOONPAY_API_KEY!,
  environment: 'sandbox', // or 'production'
});

// In your component:
const handleMoonPayPurchase = async () => {
  const url = moonPay.getBuyWidgetUrl({
    walletAddress: account.address,
    currencyCode: 'eth',
    baseCurrencyAmount: 100, // USD amount
    baseCurrencyCode: 'usd',
    theme: 'light',
    colorCode: '#000000',
  });
  
  window.open(url, '_blank');
};
```

**Environment Variables**:
```bash
NEXT_PUBLIC_MOONPAY_API_KEY=your_moonpay_api_key
```

### Option 2: Ramp Network Integration

Ramp provides onramp solutions with good UX.

**Installation**:
```bash
npm install @ramp-network/ramp-instant-sdk
```

**Basic Integration Example**:
```typescript
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';

const handleRampPurchase = () => {
  const ramp = new RampInstantSDK({
    hostAppName: 'Megabolsa',
    hostLogoUrl: 'https://your-logo-url.com/logo.png',
    variant: 'auto',
    defaultAsset: 'ETH_BASE', // Base network
    userAddress: account.address,
  });
  
  ramp.show();
};
```

**Environment Variables**:
```bash
NEXT_PUBLIC_RAMP_API_KEY=your_ramp_api_key
```

### Option 3: Coinbase Pay Integration

Coinbase Pay is another option for crypto purchases.

**Installation**:
```bash
npm install @coinbase/cbpay-js
```

**Basic Integration Example**:
```typescript
import { CoinbasePay } from '@coinbase/cbpay-js';

const handleCoinbasePay = () => {
  const coinbasePay = new CoinbasePay({
    appId: process.env.NEXT_PUBLIC_COINBASE_APP_ID!,
    destinationWallets: [{
      address: account.address,
      assets: ['ETH', 'USDC'],
      supportedNetworks: ['base'],
    }],
  });
  
  coinbasePay.open();
};
```

### Option 4: Stripe Direct Integration

For more control over Stripe payments, you can integrate Stripe directly.

**Installation**:
```bash
npm install @stripe/stripe-js
```

**API Route Example** (`src/app/api/create-payment-intent/route.ts`):
```typescript
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const { amount, address } = await request.json();
  
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    metadata: {
      recipientAddress: address,
    },
  });
  
  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
```

Then use Stripe Elements in your frontend component.

## Smart Account Considerations

Since you're using account abstraction (smart accounts), consider:

1. **Gas Sponsorship**: Your app already sponsors gas (`sponsorGas: true`), so users don't need ETH for gas
2. **Token Transfers**: Users can receive ERC-20 tokens directly to their smart account
3. **Native Currency**: If users need native ETH, ensure they receive enough for transactions (or continue sponsoring gas)

## Production Checklist

Before going live:

- [ ] Switch from testnet to mainnet chains
- [ ] Configure production API keys for payment processors
- [ ] Test all payment flows thoroughly
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure webhook endpoints for payment confirmations
- [ ] Set up compliance/KYC if required by your jurisdiction
- [ ] Test with real payment methods (small amounts)
- [ ] Review fee structures and pricing

## Security Best Practices

1. **Never expose API keys** in client-side code
2. **Validate all transactions** server-side
3. **Implement rate limiting** on payment endpoints
4. **Use webhooks** to verify payment status
5. **Store transaction logs** for audit purposes
6. **Implement fraud detection** measures

## Testing

For testing payment integrations:

1. **Testnet**: Use testnet tokens and payment processor sandbox modes
2. **Test Cards**: Use Stripe test card numbers (4242 4242 4242 4242)
3. **Small Amounts**: Test with minimum amounts first
4. **Error Handling**: Test failure scenarios

## Support

For issues or questions:
- Thirdweb Docs: https://portal.thirdweb.com
- Stripe Docs: https://stripe.com/docs
- MoonPay Docs: https://developers.moonpay.com
- Ramp Docs: https://docs.ramp.network

