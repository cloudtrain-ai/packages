import { describe, expect, test } from "bun:test";
import { lacksContact } from "../leads";
import type { LeadField } from "../types";

const fields: LeadField[] = [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: false },
    { name: "phone", label: "Phone", type: "phone", required: false },
];

describe("lacksContact", () => {
    test("an email or a phone is enough", () => {
        expect(lacksContact(fields, { name: "Keisha", email: "k@example.com" })).toBe(false);
        expect(lacksContact(fields, { name: "Keisha", phone: "+1 876 555 0100" })).toBe(false);
    });

    test("neither, or only whitespace, is not", () => {
        expect(lacksContact(fields, { name: "Keisha" })).toBe(true);
        expect(lacksContact(fields, { name: "Keisha", email: "  ", phone: "" })).toBe(true);
    });

    test("fields that cannot hold a contact do not block the visitor", () => {
        expect(lacksContact([fields[0]!], { name: "Keisha" })).toBe(false);
    });
});
