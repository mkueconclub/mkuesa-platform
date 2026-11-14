import { Clock3, Lock, Smartphone } from "lucide-react";
import { ApplyMembershipForm } from "@/components/auth/auth-forms";
import { currentAcademicYear, membershipFees } from "@/config/association";
import type { MembershipRow } from "@/types/database";

/**
 * Shown in place of the member dashboard until the chairperson or treasurer has confirmed the member.
 * The blurred picture behind the message is a made-up placeholder: no real member data is sent to the browser.
 */
export function MembershipGate({ memberships }: { memberships: MembershipRow[] }) {
  const current = memberships.find((m) => m.academic_year === currentAcademicYear) ?? null;
  const hasHistory = memberships.some((m) => m.status === "approved" || m.status === "expired");
  const status = current?.status ?? null;

  const heading =
    status === "rejected" ? "Your application was not approved"
    : status === "suspended" ? "Your membership is suspended"
    : status === "expired" || (status === null && hasHistory) ? "Renew your membership"
    : status === "pending" ? "Waiting for confirmation"
    : "Join MKUESA to unlock your dashboard";

  const body =
    status === "pending"
      ? "Your account is created and waiting for confirmation from the chairperson or treasurer. Your dashboard opens as soon as they confirm your payment."
    : status === "rejected"
      ? `${current?.rejection_reason ? `Reason given: ${current.rejection_reason}. ` : ""}If you think this is a mistake, please get in touch through the contact page.`
    : status === "suspended"
      ? "Please contact the association to find out how to restore your access."
    : status === "expired" || (status === null && hasHistory)
      ? "Your membership has ended. Pay the renewal fee below and ask the treasurer or chairperson to confirm it."
      : "Pay the membership fee below, then send your application. The chairperson or treasurer will confirm it and open your dashboard.";

  const feeNow = hasHistory ? membershipFees.renewal : membershipFees.newMember;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-brand-100 bg-white">
        {/* Decorative placeholder only. Hidden from screen readers and from keyboard focus. */}
        <div aria-hidden inert className="pointer-events-none select-none space-y-5 p-5 blur-md sm:p-8">
          <div className="h-44 rounded-3xl bg-brand-950" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-brand-100" />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-brand-50" />)}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="h-56 rounded-2xl bg-brand-100" />
            <div className="h-56 rounded-2xl bg-brand-50" />
          </div>
        </div>

        <div className="absolute inset-0 flex items-start justify-center overflow-y-auto bg-white/55 p-4 sm:items-center sm:p-8">
          <div role="status" className="w-full max-w-lg rounded-3xl border border-brand-100 bg-white p-6 text-center shadow-xl shadow-brand-950/10 sm:p-8">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              {status === "pending" ? <Clock3 className="size-6" /> : <Lock className="size-6" />}
            </span>
            <h1 className="mt-4 text-2xl text-brand-950 sm:text-3xl">{heading}</h1>
            <p className="mt-3 text-sm leading-7 text-muted sm:text-base">{body}</p>
            {status === null && (
              <div className="mt-5 text-left">
                <ApplyMembershipForm academicYear={currentAcademicYear} />
              </div>
            )}
          </div>
        </div>
      </div>

      <section aria-labelledby="fee-note" className="rounded-2xl border border-accent-200 bg-accent-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-accent-700"><Smartphone className="size-5" /></span>
          <div className="min-w-0 text-sm leading-7 text-brand-950">
            <h2 id="fee-note" className="text-lg font-semibold">Membership fees</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>New members: <strong>KSh {membershipFees.newMember}</strong>.</li>
              <li>Existing members renew for <strong>KSh {membershipFees.renewal}</strong> every {membershipFees.renewalPeriod}.</li>
            </ul>
            <p className="mt-3">
              Your fee: <strong>KSh {feeNow}</strong>. Pay to <strong>Pochi la Biashara {membershipFees.pochiLaBiashara}</strong>. The treasurer or chairperson will confirm your payment and grant you access.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
