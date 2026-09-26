"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, formDataToObject, inquirySchema, inquiryStatusSchema } from "@/lib/validation";
import type { InquiryFormState } from "@/lib/form-state";

async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return store.get("x-real-ip") ?? "unknown";
}

/**
 * Public contact / product inquiry submission.
 *
 * Spam-conscious handling: an off-screen honeypot field, a minimum time on the
 * form, and a per-IP rate limit. Nothing is trusted from the client — every
 * field is re-validated on the server before it reaches the database.
 */
export async function submitInquiry(
  _previous: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const raw = formDataToObject(formData);
  const parsed = inquirySchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;

  // Honeypot: pretend everything is fine so bots do not learn anything.
  if (data.company) {
    return { status: "success", message: "Thank you — your message has been sent." };
  }

  const elapsed = Number.parseInt(data.elapsedMs ?? "", 10);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 1200) {
    return {
      status: "error",
      message: "That was a little too quick — please take a moment and send again.",
    };
  }

  const ip = await clientIp();
  const limit = rateLimit(`inquiry:${ip}`, 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `We have received several messages from this connection. Please try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minute(s), or call the showroom.`,
    };
  }

  try {
    // Only link a product that is actually published.
    let productId: string | null = null;
    if (data.productId) {
      const product = await prisma.product.findFirst({
        where: { id: data.productId, status: "PUBLISHED" },
        select: { id: true },
      });
      productId = product?.id ?? null;
    }

    await prisma.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        subject: data.subject ?? null,
        message: data.message,
        productId,
        kind: productId ? "PRODUCT" : "CONTACT",
        sourcePath: data.sourcePath ?? null,
      },
    });
  } catch (error) {
    console.error("[inquiry] could not save:", error instanceof Error ? error.message : error);
    return {
      status: "error",
      message: "Something went wrong on our side. Please try again, or email the showroom directly.",
    };
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");

  return {
    status: "success",
    message: "Thank you — your message is with us. We reply to every inquiry within two working days.",
  };
}

export async function setInquiryStatus(formData: FormData): Promise<void> {
  await requireAdmin("/admin/inquiries");
  const id = String(formData.get("id") ?? "");
  const parsed = inquiryStatusSchema.safeParse({ status: formData.get("status") });
  if (!id || !parsed.success) return;

  await prisma.inquiry.update({ where: { id }, data: { status: parsed.data.status } });
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}

export async function deleteInquiry(formData: FormData): Promise<void> {
  await requireAdmin("/admin/inquiries");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.inquiry.delete({ where: { id } });
  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
}
