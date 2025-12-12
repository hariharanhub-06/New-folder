"use server";

import { updateAdmin, verifyAdmin, createInitialAdmin } from "./db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateAdminCredentials(formData: FormData) {
    const currentUsername = formData.get("currentUsername") as string; // We use this to verify identity again if needed, or just trust session
    const newUsername = formData.get("newUsername") as string;
    const newPassword = formData.get("newPassword") as string;

    // In a real app, we should check cookie/session here to ensure they are logged in.
    // middleware.ts handles route protection, but verifying here is good practice.
    const cookieStore = cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
        throw new Error("Unauthorized");
    }

    if (!newUsername || !newPassword) {
        throw new Error("Username and Password required");
    }

    await updateAdmin(adminId, newUsername, newPassword);

    // Refresh cookie if username changed? Or just let them re-login if we implemented proper auth.
    // For now, simple update.

    // For now, simple update.
}

import { redirect } from "next/navigation";

export async function logoutAdmin() {
    cookies().delete("admin_session");
    cookies().delete("admin_id");
    redirect("/admin/login");
}

