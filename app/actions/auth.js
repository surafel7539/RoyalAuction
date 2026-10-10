"use server";

import { redirect } from "next/navigation";
import { createUser, findUserByPhone } from "@/lib/models";
import { toUserDTO } from "@/lib/serialize";
import {
  createSession,
  clearSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { formError } from "@/lib/locale";

function clean(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  return clean(value).replace(/[^\d+]/g, "");
}

export async function registerAction(_, formData) {
  const phone = normalizePhone(formData.get("phone"));
  const password = String(formData.get("password") || "");
  const role = clean(formData.get("role")) || "BUYER";
  const next = clean(formData.get("next")) || "/dashboard";
  const selling = role === "SELLER" || role === "BOTH";
  const accountKind = selling ? clean(formData.get("accountKind")) : "";
  const contactName = clean(formData.get("contactName"));
  const city = clean(formData.get("city"));
  const legalName = clean(formData.get("legalName"));

  if (selling && !["INDIVIDUAL", "ORGANISATION"].includes(accountKind)) {
    return formError("errAccountKind");
  }
  if (accountKind === "ORGANISATION") {
    if (legalName.length < 2) return formError("errCompanyName");
    if (contactName.length < 2) return formError("errContactName");
  } else if (legalName.length < 2) {
    return formError("errLegalName");
  }
  if (phone.replace(/\D/g, "").length < 9) {
    return formError("errPhone");
  }
  if (password.length < 8) {
    return formError("errPassword");
  }
  if (!["BUYER", "SELLER", "BOTH"].includes(role)) {
    return formError("errAccountType");
  }

  const existing = await findUserByPhone(phone);
  if (existing) {
    return formError("errPhoneExists");
  }

  const user = await createUser({
    legalName,
    phone,
    passwordHash: await hashPassword(password),
    role,
    accountKind: accountKind || undefined,
    contactName: accountKind === "ORGANISATION" ? contactName : "",
    city: accountKind === "ORGANISATION" ? city : "",
  });

  await createSession(toUserDTO(user));
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function loginAction(_, formData) {
  const phone = normalizePhone(formData.get("phone"));
  const password = String(formData.get("password") || "");
  const next = clean(formData.get("next")) || "/dashboard";

  const user = await findUserByPhone(phone);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return formError("errLogin");
  }

  await createSession(toUserDTO(user));
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
