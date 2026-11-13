"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { echo, formData2obj, invalid, NOT_CONFIGURED, type FormState } from "@/lib/forms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { connectPostSchema, connectReplySchema } from "@/lib/validation/alumni";
import { fieldErrors } from "@/lib/validation/auth";

const SIGNED_OUT: FormState = { ok: false, message: "Your session has ended. Please sign in again." };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Follow or unfollow an alumnus. The database allows this only for approved members. */
export async function toggleFollowAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const alumnusId = String(formData.get("alumnusId") ?? "");
  const follow = formData.get("intent") === "follow";
  if (!uuid.test(alumnusId)) return { ok: false, message: "Something went wrong." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const supabase = await createClient();
  const { error } = follow
    ? await supabase.from("alumni_follows").insert({ follower_id: user.id, alumnus_id: alumnusId })
    : await supabase.from("alumni_follows").delete().eq("follower_id", user.id).eq("alumnus_id", alumnusId);
  if (error && error.code !== "23505") {
    if (error.code === "42501") return { ok: false, message: "Only approved members can follow alumni." };
    console.error("follow failed:", error.code, error.message);
    return { ok: false, message: "That did not work. Please try again." };
  }
  revalidatePath("/dashboard/alumni");
  return { ok: true, message: "" };
}

export async function createPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = connectPostSchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const { error } = await (await createClient()).from("connect_posts").insert({ author_id: user.id, ...parsed.data });
  if (error) {
    console.error("connect post failed:", error.code, error.message);
    return { ok: false, message: error.code === "42501" ? "Only verified alumni can post here." : "Your post could not be saved. Please try again.", values: echo(formData) };
  }
  revalidatePath("/alumni/connect");
  return { ok: true, message: "Posted." };
}

export async function createReplyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = connectReplySchema.safeParse(formData2obj(formData));
  if (!parsed.success) return invalid(fieldErrors(parsed.error), formData);
  if (!isSupabaseConfigured()) return { ...NOT_CONFIGURED, values: echo(formData) };
  const user = await getCurrentUser();
  if (!user) return SIGNED_OUT;
  const { error } = await (await createClient()).from("connect_replies").insert({ post_id: parsed.data.postId, author_id: user.id, body: parsed.data.body });
  if (error) {
    console.error("connect reply failed:", error.code, error.message);
    return { ok: false, message: "Your reply could not be saved. Please try again.", values: echo(formData) };
  }
  revalidatePath(`/alumni/connect/${parsed.data.postId}`);
  return { ok: true, message: "Reply posted." };
}

export async function deletePostAction(formData: FormData) {
  const id = String(formData.get("postId") ?? "");
  if (!uuid.test(id) || !(await getCurrentUser())) return;
  const { error } = await (await createClient()).from("connect_posts").delete().eq("id", id); // RLS: own posts or staff
  if (error) console.error("connect delete failed:", error.code, error.message);
  revalidatePath("/alumni/connect");
  redirect("/alumni/connect");
}
