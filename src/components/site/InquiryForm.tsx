"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { submitInquiry } from "@/server/actions/inquiries";
import { EMPTY_INQUIRY_STATE } from "@/lib/form-state";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { TextArea, TextField } from "@/components/ui/Field";

export function InquiryForm({
  productId,
  productName,
  sourcePath,
  defaultSubject,
  storeEmail,
  storePhone,
}: {
  productId?: string;
  productName?: string;
  sourcePath: string;
  defaultSubject?: string;
  storeEmail: string;
  storePhone: string;
}) {
  const [state, formAction, isPending] = useActionState(submitInquiry, EMPTY_INQUIRY_STATE);

  /**
   * How long the visitor has had the form open, in milliseconds.
   *
   * A plain hidden field cannot be stamped at submit time with a server action,
   * so a lightweight timer keeps the value current. It starts at 0 on mount,
   * which is exactly what the server treats as “submitted instantly”.
   */
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (state.status === "success") {
    return (
      <div className="border border-success-600/30 bg-success-100 p-6 sm:p-8" role="status">
        <p className="flex items-center gap-2 font-display text-xl text-ink-950">
          <CheckCircle2 aria-hidden className="size-5 text-success-600" strokeWidth={1.75} />
          Message sent
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">{state.message}</p>
        <p className="mt-4 text-sm text-ink-600">
          Prefer to speak to someone? Call{" "}
          <a href={`tel:${storePhone.replace(/[^+\d]/g, "")}`} className="underline underline-offset-4">
            {storePhone}
          </a>
          {storeEmail ? (
            <>
              {" "}
              or email{" "}
              <a href={`mailto:${storeEmail}`} className="underline underline-offset-4">
                {storeEmail}
              </a>
            </>
          ) : null}
          .
        </p>
        <p className="mt-6">
          <Link href="/collection" className="btn btn-secondary">
            Back to the collection
          </Link>
        </p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-5">
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      <input type="hidden" name="sourcePath" value={sourcePath} />
      <input type="hidden" name="elapsedMs" value={elapsedMs} />

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company (leave this empty)</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Your name"
          name="name"
          required
          autoComplete="name"
          error={errors.name}
          placeholder="Anjali Menon"
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          error={errors.email}
          placeholder="you@example.com"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          error={errors.phone}
          placeholder="+91 98470 12345"
        />
        <TextField
          label="Subject"
          name="subject"
          error={errors.subject}
          defaultValue={defaultSubject ?? (productName ? `Inquiry about ${productName}` : "")}
          placeholder="Lead time, finishes, a visit…"
        />
      </div>

      <TextArea
        label={productName ? `Your question about the ${productName}` : "Message"}
        name="message"
        required
        rows={6}
        error={errors.message}
        placeholder={
          productName
            ? "I would like to see this piece in the showroom — do you have it available on a Saturday?"
            : "Tell us what you are looking for, and we will come back with options."
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Spinner label="Sending your message" />
              Sending…
            </>
          ) : (
            "Send inquiry"
          )}
        </button>
        <p className="text-xs text-ink-500">
          We use your details only to answer this inquiry. No newsletter, no sharing.
        </p>
      </div>
    </form>
  );
}
