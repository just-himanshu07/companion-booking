import React from 'react';
import type { Metadata } from 'next';
import RefundPolicyPage, { metadata as refundMetadata } from '../refund-policy/page';

export const metadata: Metadata = {
  ...refundMetadata,
  title: 'Paireva Cancellation Policy — Booking Cancellation Rules & Refunds',
};

export default RefundPolicyPage;
