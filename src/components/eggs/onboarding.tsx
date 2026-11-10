import { useMemo, useState } from "react";
import { readChennai } from "@/lib/eggs/clock";
import { bi, EXCEPTION_LABEL, tx } from "@/lib/eggs/labels";
import { rankVendors, searchStreets } from "@/lib/eggs/routing";
import { useEggs } from "@/lib/eggs/store";
import type { Address } from "@/lib/eggs/types";
import { Button, Chip, Field, Panel } from "./ui";

const OTP = "482913";

export function Onboarding() {
  const lang = useEggs((s) => s.lang);
  const profile = useEggs((s) => s.profile);
  const address = useEggs((s) => s.address);
  const localities = useEggs((s) => s.localities);
  const streets = useEggs((s) => s.streets);
  const vendors = useEggs((s) => s.vendors);
  const assignments = useEggs((s) => s.assignments);
  const vendorProducts = useEggs((s) => s.vendorProducts);
  const capacities = useEggs((s) => s.capacities);
  const slots = useEggs((s) => s.slots);
  const verifyPhone = useEggs((s) => s.verifyPhone);
  const confirmAddress = useEggs((s) => s.confirmAddress);
  const requestStreet = useEggs((s) => s.requestStreet);
  const t = (text: { en: string; ta: string }) => tx(lang, text);

  const [step, setStep] = useState(profile.phoneVerified ? 2 : 1);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [sent, setSent] = useState(profile.phoneVerified);
  const [code, setCode] = useState("");
  const [localityId, setLocalityId] = useState(address?.localityId ?? "besant");
  const [query, setQuery] = useState("");
  const [streetId, setStreetId] = useState(address?.streetId ?? "");
  const [door, setDoor] = useState(address?.door ?? "");
  const [apartment, setApartment] = useState(address?.apartment ?? "");
  const [landmark, setLandmark] = useState(address?.landmark ?? "");

  const matches = useMemo(
    () => searchStreets(streets, localities, query, localityId).slice(0, 8),
    [streets, localities, query, localityId],
  );
  const street = streets.find((s) => s.id === streetId);
  const decision = street
    ? rankVendors({
        streetId: street.id,
        streets,
        vendors,
        assignments,
        vendorProducts,
        capacities,
        slots,
        clock: readChennai(),
      })
    : null;

  const phoneOk = /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-8">
      <div>
        <p className="text-sm text-muted">
          {t(bi("Chennai", "சென்னை"))} · 0{step} / 03
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          {step === 1
            ? t(bi("Eggs from the street that actually has them.", "முட்டை கிடைக்கும் தெருவிலிருந்தே."))
            : step === 2
              ? t(bi("Which street is the door on?", "வாசல் எந்தத் தெருவில்?"))
              : t(bi("Confirm the door.", "வாசலை உறுதி செய்யுங்கள்."))}
        </h1>
        <p className="mt-3 text-muted">
          {t(
            bi(
              "Service follows a street directory in English and Tamil. A pin code alone never assigns a shop.",
              "சேவை ஆங்கிலம் மற்றும் தமிழ் தெருப் பட்டியலைப் பின்பற்றும். அஞ்சல் குறியீடு மட்டும் கடையை ஒதுக்காது.",
            ),
          )}
        </p>
      </div>

      {step === 1 ? (
        <Panel className="flex flex-col gap-3">
          <label className="text-sm text-muted" htmlFor="name">
            {t(bi("Name", "பெயர்"))}
          </label>
          <Field id="name" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="text-sm text-muted" htmlFor="phone">
            {t(bi("Mobile number", "கைபேசி எண்"))}
          </label>
          <Field
            id="phone"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9840011220"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
          />
          {sent ? (
            <>
              <label className="text-sm text-muted" htmlFor="otp">
                {t(bi("One-time code", "ஒரு முறை குறியீடு"))}
              </label>
              <Field
                id="otp"
                data-testid="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              />
              <p className="text-sm text-muted">
                {t(bi(`Demo only: use ${OTP}. This preview does not send SMS.`, `டெமோ மட்டும்: ${OTP} பயன்படுத்தவும். இந்த முன்னோட்டத்தில் SMS அனுப்பப்படாது.`))}
              </p>
            </>
          ) : null}
          <Button
            className="mt-2"
            disabled={!phoneOk || (sent && code !== OTP)}
            onClick={() => {
              if (!sent) {
                setSent(true);
                return;
              }
              verifyPhone(phone, name);
              setStep(2);
            }}
          >
            {sent ? t(bi("Continue", "தொடரவும்")) : t(bi("Send code", "குறியீடு அனுப்பு"))}
          </Button>
        </Panel>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {localities.map((loc) => (
              <Chip
                key={loc.id}
                active={loc.id === localityId}
                onClick={() => {
                  setLocalityId(loc.id);
                  setStreetId("");
                }}
              >
                {t(loc.name)}
              </Chip>
            ))}
          </div>
          <Field
            data-testid="street-search"
            value={query}
            placeholder={t(bi("4th cross, LB Road, லூஸ், ECR", "4th cross, LB Road, லூஸ், ECR"))}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            {matches.map((row) => {
              const verdict = rankVendors({
                streetId: row.id,
                streets,
                vendors,
                assignments,
                vendorProducts,
                capacities,
                slots,
                clock: readChennai(),
              });
              const primary = vendors.find((v) => v.id === verdict.recommendedId);
              return (
                <button
                  key={row.id}
                  className="press rounded-card border border-line bg-shell p-4 text-left"
                  onClick={() => {
                    setStreetId(row.id);
                    setStep(3);
                  }}
                >
                  <span className="block font-medium">{t(row.name)}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {row.status !== "active"
                      ? t(EXCEPTION_LABEL[row.status === "suspended" ? "STREET_SUSPENDED" : "STREET_INACTIVE"])
                      : verdict.ok
                        ? t(bi(`Served · ${primary?.name.en ?? ""}`, `சேவை · ${primary?.name.ta ?? ""}`))
                        : t(EXCEPTION_LABEL[verdict.exception ?? "NO_VENDOR"])}
                  </span>
                </button>
              );
            })}
            {matches.length === 0 ? (
              <Panel>
                <p className="text-sm">{t(EXCEPTION_LABEL.STREET_UNKNOWN)}</p>
                <Button className="mt-3" variant="line" onClick={() => requestStreet(query || localityId, localityId)}>
                  {t(bi("Request this street", "இந்தத் தெருவைக் கோருங்கள்"))}
                </Button>
              </Panel>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === 3 && street ? (
        <div className="flex flex-col gap-4">
          <Panel>
            <p className="text-sm text-muted">{t(localities.find((l) => l.id === street.localityId)?.name ?? bi("", ""))}</p>
            <h2 className="font-display text-3xl">{t(street.name)}</h2>
            <p className="mt-2 text-sm text-muted">{t(bi("Pin code is recorded. Routing uses the street.", "அஞ்சல் குறியீடு பதிவாகும். வழித்தடம் தெருவைப் பயன்படுத்தும்."))}</p>
          </Panel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field placeholder={t(bi("Door number", "கதவு எண்"))} value={door} onChange={(e) => setDoor(e.target.value)} data-testid="door" />
            <Field placeholder={t(bi("Apartment", "அபார்ட்மெண்ட்"))} value={apartment} onChange={(e) => setApartment(e.target.value)} />
          </div>
          <Field placeholder={t(bi("Landmark", "அடையாளம்"))} value={landmark} onChange={(e) => setLandmark(e.target.value)} />
          <ServiceCard />
          <div className="flex gap-2">
            <Button variant="line" onClick={() => setStep(2)}>
              {t(bi("Back", "பின்"))}
            </Button>
            <Button
              data-testid="confirm-door"
              disabled={!door.trim()}
              onClick={() => {
                const next: Address = {
                  city: "chennai",
                  localityId: street.localityId,
                  streetId: street.id,
                  door: door.trim(),
                  apartment: apartment.trim(),
                  landmark: landmark.trim(),
                  pin: street.pin,
                  confirmed: true,
                };
                confirmAddress(next);
              }}
            >
              {t(bi("This is my door", "இது என் வாசல்"))}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  function ServiceCard() {
    if (!decision) return null;
    if (!decision.ok) {
      return (
        <Panel>
          <p className="font-medium">{t(bi("Not in service", "சேவையில் இல்லை"))}</p>
          <p className="mt-1 text-sm text-muted">{t(EXCEPTION_LABEL[decision.exception ?? "NO_VENDOR"])}</p>
        </Panel>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {decision.ranked.map((row) => {
          const vendor = vendors.find((v) => v.id === row.vendorId);
          if (!vendor) return null;
          return (
            <Panel key={row.vendorId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{row.role === "primary" ? t(bi("Primary shop", "முதன்மைக் கடை")) : t(bi("Backup shop", "மாற்றுக் கடை"))}</p>
                  <h3 className="text-lg font-medium">{t(vendor.name)}</h3>
                </div>
                <p className="text-sm tabular-nums text-muted">{vendor.rating.toFixed(1)}</p>
              </div>
              <p className="mt-2 text-sm text-muted">
                {vendor.hours.open}–{vendor.hours.close}
                {" · "}
                {row.eligible ? t(bi(`${row.etaMin} min once accepted`, `ஏற்ற பின் ${row.etaMin} நிமிடம்`)) : t(EXCEPTION_LABEL[row.reason ?? "VENDOR_UNAVAILABLE"])}
              </p>
            </Panel>
          );
        })}
      </div>
    );
  }
}
