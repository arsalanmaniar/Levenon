"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/** Placeholder bank details (client brief, 2026-08-24) — no payment gateway exists yet. */
const BANK_NAME = "Meezan Bank";
const ACCOUNT_NUMBER = "LEVENON-001";
const IBAN = "PK00MEZN0000000000000000";

function DetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context) —
      // the value is still shown as plain text, so nothing is lost.
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-hairline py-3 last:border-b-0">
      <div className="min-w-0">
        <dt className="label text-charcoal">{label}</dt>
        <dd className="mt-1 truncate font-mono text-sm text-ink">{value}</dd>
      </div>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className="label inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-hairline px-3 text-charcoal transition-colors duration-200 ease-state hover:border-purple-500 hover:text-purple-500"
        >
          {copied ? (
            <>
              <Check aria-hidden="true" strokeWidth={1.5} className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy aria-hidden="true" strokeWidth={1.5} className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      )}
    </div>
  );
}

/** Bank-transfer details shown inside `PaymentModal` from the cart drawer. */
export function BankTransferDetails() {
  return (
    <div>
      <p className="text-sm leading-relaxed text-charcoal">
        Transfer the order total to the account below, then send the receipt
        on WhatsApp to confirm — the same thread every order is settled in.
      </p>
      <dl className="mt-6 border-t border-hairline">
        <DetailRow label="Bank" value={BANK_NAME} />
        <DetailRow label="Account" value={ACCOUNT_NUMBER} copyable />
        <DetailRow label="IBAN" value={IBAN} copyable />
      </dl>
    </div>
  );
}
