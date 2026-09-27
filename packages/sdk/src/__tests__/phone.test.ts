import { describe, expect, test } from "bun:test";
import { CloudTrain } from "../client";
import { PHONE_COUNTRIES, defaultPhoneCountry, flagEmoji, phoneCountriesByName } from "../phone";

describe("phone countries", () => {
    test("every country has its dialling code", () => {
        const dial = Object.fromEntries(PHONE_COUNTRIES.map((c) => [c.code, c.dial]));
        expect(dial.JM).toBe("1");
        expect(dial.GB).toBe("44");
        expect(dial.TT).toBe("1");
        expect(PHONE_COUNTRIES.length).toBeGreaterThan(240);
    });

    test("flags are emoji, names come from the platform, sorted by name", () => {
        expect(flagEmoji("jm")).toBe("🇯🇲");
        const list = phoneCountriesByName("en");
        expect(list.find((c) => c.code === "JM")?.name).toBe("Jamaica");
        expect(list[0]!.name.localeCompare(list[1]!.name)).toBeLessThanOrEqual(0);
    });

    test("the picker starts at the visitor's country, else the browser's region, else nothing", () => {
        expect(defaultPhoneCountry("gb", "en-US")).toBe("GB");
        expect(defaultPhoneCountry(null, "en-JM")).toBe("JM");
        expect(defaultPhoneCountry("XX", "en")).toBeUndefined();
    });
});

describe("submitLead", () => {
    const client = (res: Response) => new CloudTrain({
        apiKey: "ctw_test",
        baseUrl: "https://example.test",
        fetch: (async () => res) as unknown as typeof fetch,
    });

    test("a saved lead", async () => {
        const result = await client(Response.json({ id: 7, created: true }, { status: 201 })).submitLead({ name: "A", phone: "+18765550100" });
        expect(result).toEqual({ ok: true, id: 7, created: true });
    });

    test("a refusal carries what is wrong with each field", async () => {
        const res = Response.json({ error: { message: "Phone: It needs its country code.", type: "invalid_request_error", fields: { phone: "It needs its country code." } } }, { status: 422 });
        expect(await client(res).submitLead({ name: "A", phone: "876" })).toEqual({
            ok: false, status: 422, message: "Phone: It needs its country code.", fields: { phone: "It needs its country code." }, code: undefined,
        });
    });
});
