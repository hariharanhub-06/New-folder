"use server";

import { updateAdmin, verifyAdmin, createInitialAdmin } from "./db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function updateAdminCredentials(prevState: any, formData: FormData) {
    try {
        const currentUsername = formData.get("currentUsername") as string;
        const newUsername = formData.get("newUsername") as string;
        const newPassword = formData.get("newPassword") as string;

        const cookieStore = cookies();
        const adminId = cookieStore.get('admin_id')?.value;

        if (!adminId) {
            return { success: false, error: "Unauthorized: Please log out and log in again." };
        }

        if (!newUsername || !newPassword) {
            return { success: false, error: "Username and Password required" };
        }

        await updateAdmin(adminId, newUsername, newPassword);
        return { success: true, message: "Credentials updated successfully!" };

    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update credentials" };
    }
}

import { redirect } from "next/navigation";

export async function logoutAdmin() {
    cookies().delete("admin_session");
    cookies().delete("admin_id");
    redirect("/admin/login");
}

