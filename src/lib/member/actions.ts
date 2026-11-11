"use server";

import { revalidatePath } from "next/cache";
import { echo, formData2obj, invalid, NOT_CONFIGURED, type FormState } from "@/lib/forms";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/auth";
import { eventIdSchema, profileSchema } from "@/lib/validation/member";

const SIGNED_OUT: FormState = { ok: false, message: "Your session has ended. Please sign in again." };

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };

  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const v = parsed.data;

  const supabase = await createClient();
  // Only the columns the database lets members change (see the grant on public.profiles). Role and email cannot be sent from here.
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: v.fullName,
      phone: v.phone ?? null,
      registration_number: v.registrationNumber ?? null,
      programme: v.programme ?? null,
      year_of_study: v.yearOfStudy ?? null,
    })
    .eq("id", user.id)
    .select("id");
  if (error || !data?.length) {
    console.error("profile update failed:", error?.code, error?.message);
    return { ok: false, message: "Your profile could not be saved. Please try again.", values: echo(formData) };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile saved.", values: echo(formData) };
}

export async function registerForEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = eventIdSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return { ok: false, message: "That event could not be found." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const { eventId } = parsed.data;
  const supabase = await createClient();

  // A cancelled row still occupies the (event, person) unique slot, and members may delete their own cancelled rows. Clear it so they can sign up again.
  await supabase.from("event_registrations").delete().eq("event_id", eventId).eq("profile_id", user.id).eq("status", "cancelled");

  // The database decides the status (registered, or waitlisted when full) and enforces the deadline, visibility and event state.
  const { data, error } = await supabase
    .from("event_registrations")
    .insert({ event_id: eventId, profile_id: user.id })
    .select("status")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, message: "You are already registered for this event." };
    if (error.code === "42501") return { ok: false, message: "Registration is not open for this event. It may be closed, over, or for approved members only." };
    console.error("event registration failed:", error.code, error.message);
    return { ok: false, message: "We could not register you. Please try again." };
  }
  revalidatePath("/dashboard", "layout");
  return data.status === "waitlisted"
    ? { ok: true, message: "The event is full, so you are on the waiting list. We will move you up if a place opens." }
    : { ok: true, message: "You are registered." };
}

export async function cancelRegistrationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = eventIdSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return { ok: false, message: "That event could not be found." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", parsed.data.eventId)
    .eq("profile_id", user.id)
    .in("status", ["registered", "waitlisted"])
    .select("id");
  if (error || !data?.length) {
    if (error) console.error("cancel registration failed:", error.code, error.message);
    return { ok: false, message: "Your registration could not be cancelled. It may already have been." };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Your registration has been cancelled." };
}
