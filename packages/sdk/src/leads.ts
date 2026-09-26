import type { LeadField } from "./types";

/**
 * Whether values collected with the agent's lead fields give a way to reach
 * the person. The server saves a lead only with an email or a phone, so a
 * form that let someone through without either would look like it captured
 * a lead and not have.
 *
 * Only asked of fields that can hold one: an agent whose fields have neither
 * gets no lead either way, and is not made to block its visitors.
 */
export function lacksContact(fields: readonly LeadField[], values: Record<string, string | undefined>): boolean {
    const contact = fields.filter((f) => f.type === "email" || f.type === "phone");
    if (contact.length === 0) return false;
    return !contact.some((f) => (values[f.name] ?? "").trim().length > 0);
}

export const LACKS_CONTACT_MESSAGE = "Please give an email or a phone number so we can get back to you.";
