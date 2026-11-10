import { useMemo, useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { readChennai } from "@/lib/eggs/clock";
import { bi, EXCEPTION_LABEL, tx } from "@/lib/eggs/labels";
import { rankVendors } from "@/lib/eggs/routing";
import { useEggs } from "@/lib/eggs/store";
import type { Address, Locality, Street } from "@/lib/eggs/types";
import { Button, Field, Panel } from "./ui";
import { MapPicker } from "./map-picker";

const OTP = "482913";

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function closest<T extends { lat: number; lng: number }>(
  rows: T[],
  point: { lat: number; lng: number },
): T | undefined {
  return rows.reduce<T | undefined>((best, row) => {
    if (!best) return row;
    return distanceKm(point, row) < distanceKm(point, best) ? row : best;
  }, undefined);
}

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
  const t = (text: { en: string; ta: string }) => tx(lang, text);

  const fallback = localities.find((row) => row.id === address?.localityId) ?? localities.find((row) => row.id === "besant") ?? localities[0];
  const [step, setStep] = useState(profile.phoneVerified ? 2 : 1);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [sent, setSent] = useState(profile.phoneVerified);
  const [code, setCode] = useState("");
  const [location, setLocation] = useState(() => ({
    lat: address?.latitude ?? fallback?.lat ?? 13.0003,
    lng: address?.longitude ?? fallback?.lng ?? 80.2668,
  }));
  const [door, setDoor] = useState(address?.door ?? "");
  const [apartment, setApartment] = useState(address?.apartment ?? "");
  const [addressLine, setAddressLine] = useState(address?.addressLine ?? "");
  const [landmark, setLandmark] = useState(address?.landmark ?? "");
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const nearestLocality = useMemo(
    () => closest<Locality>(localities, location),
    [localities, location.lat, location.lng],
  );
  const assignedStreetIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.streetId)),
    [assignments],
  );
  const routeStreets = useMemo(
    () => streets.filter((street) => street.status === "active" && assignedStreetIds.has(street.id)),
    [streets, assignedStreetIds],
  );
  const nearestStreet = useMemo(
    () => closest<Street>(routeStreets, location),
    [routeStreets, location.lat, location.lng],
  );
  const decision = useMemo(
    () =>
      nearestStreet
        ? rankVendors({
            streetId: nearestStreet.id,
            streets,
            vendors,
            assignments,
            vendorProducts,
            capacities,
            slots,
            clock: readChennai(),
            point: location,
          })
        : null,
    [nearestStreet, streets, vendors, assignments, vendorProducts, capacities, slots, location],
  );

  const phoneOk = /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationMessage(t(bi("Location is not available in this browser. Move the map pin manually.", "இந்த உலாவியில் இடம் கிடைக்கவில்லை. வரைபடத்தில் பின்-ஐ நகர்த்தவும்.")));
      return;
    }
    setLocating(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
        setLocationMessage(t(bi("Your current location is pinned. Move the map to fine-tune it.", "உங்கள் தற்போதைய இடம் குறிக்கப்பட்டது. துல்லியமாக்க வரைபடத்தை நகர்த்தலாம்.")));
      },
      (error) => {
        setLocating(false);
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? t(bi("Location permission was denied. You can still move the map and place the pin yourself.", "இட அனுமதி மறுக்கப்பட்டது. வரைபடத்தை நகர்த்தி நீங்களே இடத்தைத் தேர்வு செய்யலாம்."))
            : t(bi("Could not get your location. Move the map pin manually.", "உங்கள் இடத்தைப் பெற முடியவில்லை. வரைபடத்தில் பின்-ஐ நகர்த்தவும்.")),
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  function saveAddress() {
    if (!nearestStreet || !nearestLocality) return;
    const next: Address = {
      city: "chennai",
      localityId: nearestLocality.id,
      streetId: nearestStreet.id,
      door: door.trim(),
      apartment: apartment.trim(),
      landmark: landmark.trim(),
      addressLine: addressLine.trim(),
      latitude: Number(location.lat.toFixed(7)),
      longitude: Number(location.lng.toFixed(7)),
      pin: nearestLocality.pin,
      confirmed: true,
    };
    confirmAddress(next);
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 pb-8">
      <div>
        <p className="text-xs font-semibold text-muted">
          {t(bi("Customer setup", "வாடிக்கையாளர் பதிவு"))} · 0{step} / 03
        </p>
        <h1 className="mt-2 font-display text-[2.35rem] leading-[1.06] tracking-tight md:text-5xl">
          {step === 1
            ? t(bi("Fresh eggs, delivered to your door.", "புதிய முட்டைகள் உங்கள் வாசலுக்கு."))
            : step === 2
              ? t(bi("Pin your delivery location.", "உங்கள் விநியோக இடத்தைப் பின் செய்யுங்கள்."))
              : t(bi("Add your address details.", "உங்கள் முகவரி விவரங்களைச் சேர்க்கவும்."))}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {step === 1
            ? t(bi("Create your customer account to get started.", "தொடங்க உங்கள் வாடிக்கையாளர் கணக்கை உருவாக்குங்கள்."))
            : step === 2
              ? t(bi("Like Rapido, move the map until the pin is exactly at your entrance. You can use your current location or place it manually.", "Rapido போல, உங்கள் வாசல் இருக்கும் இடத்தில் பின் சரியாக வரும் வரை வரைபடத்தை நகர்த்துங்கள். தற்போதைய இடத்தைப் பயன்படுத்தலாம் அல்லது நீங்களே தேர்வு செய்யலாம்."))
              : t(bi("Tell us the house, apartment and landmark so the delivery partner can find your door without calling.", "டெலிவரி கடை உங்கள் வாசலை எளிதாகக் கண்டுபிடிக்க வீடு, அபார்ட்மெண்ட் மற்றும் அடையாள விவரங்களை உள்ளிடுங்கள்."))}
        </p>
      </div>

      {step === 1 ? (
        <Panel className="flex flex-col gap-3 p-5">
          <label className="text-sm font-semibold text-ink" htmlFor="name">{t(bi("Your name", "உங்கள் பெயர்"))}</label>
          <Field id="name" autoComplete="name" placeholder={t(bi("Full name", "முழுப் பெயர்"))} value={name} onChange={(e) => setName(e.target.value)} />
          <label className="mt-1 text-sm font-semibold text-ink" htmlFor="phone">{t(bi("Mobile number", "கைபேசி எண்"))}</label>
          <div className="flex items-center gap-2 rounded-control border border-line bg-shell px-3">
            <span className="text-sm font-bold text-muted">+91</span>
            <input
              id="phone"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98400 11220"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-ink outline-none"
            />
          </div>
          {sent ? (
            <>
              <label className="mt-1 text-sm font-semibold text-ink" htmlFor="otp">{t(bi("One-time code", "ஒரு முறை குறியீடு"))}</label>
              <Field id="otp" data-testid="otp-input" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
              <p className="text-xs leading-5 text-muted">{t(bi(`Demo only: use ${OTP}. This preview does not send SMS.`, `டெமோ மட்டும்: ${OTP} பயன்படுத்தவும். இந்த முன்னோட்டத்தில் SMS அனுப்பப்படாது.`))}</p>
            </>
          ) : null}
          <Button className="mt-2 w-full" disabled={!phoneOk || (sent && code !== OTP)} onClick={() => {
            if (!sent) { setSent(true); return; }
            verifyPhone(phone, name);
            setStep(2);
          }}>
            {sent ? t(bi("Continue", "தொடரவும்")) : t(bi("Verify mobile number", "கைபேசி எண்ணை உறுதி செய்யுங்கள்"))}
          </Button>
        </Panel>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <MapPicker value={location} onChange={(next) => { setLocation(next); setLocationMessage(""); }} onUseLocation={useMyLocation} locating={locating} />
          {locationMessage ? <p role="status" className="rounded-xl bg-[#edf7ff] px-3 py-2 text-xs leading-5 text-[#07518c]">{locationMessage}</p> : null}
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf7ff] text-mark"><MapPin className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-bold">{t(bi("Selected map location", "தேர்ந்தெடுத்த வரைபட இடம்"))}</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {nearestLocality ? t(nearestLocality.name) : t(bi("Chennai service area", "சென்னை சேவை பகுதி"))}
                {" · "}
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="line" className="flex-1" onClick={() => setStep(1)}>{t(bi("Back", "பின்"))}</Button>
            <Button className="flex-1" disabled={!nearestStreet} onClick={() => setStep(3)}>{t(bi("Confirm this pin", "இந்த இடத்தை உறுதி செய்"))}</Button>
          </div>
          <p className="text-center text-[10px] leading-4 text-muted">{t(bi("Map data © OpenStreetMap contributors. The pin is movable; GPS permission is optional.", "வரைபடத் தரவு © OpenStreetMap contributors. பின் நகர்த்தலாம்; GPS அனுமதி விருப்பமானது."))}</p>
        </div>
      ) : null}

      {step === 3 && nearestStreet && nearestLocality ? (
        <div className="flex flex-col gap-4">
          <Panel className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf7ff] text-mark"><MapPin className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-mark">{t(bi("Pin confirmed", "இடம் உறுதி செய்யப்பட்டது"))}</p>
              <p className="mt-1 truncate text-sm font-bold">{t(nearestLocality.name)}</p>
              <p className="mt-1 text-[10px] text-muted">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
            </div>
            <button type="button" className="press text-xs font-bold text-mark" onClick={() => setStep(2)}>{t(bi("Change", "மாற்று"))}</button>
          </Panel>

          <Panel className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-semibold text-ink" htmlFor="address-line">{t(bi("Street, area or building", "தெரு, பகுதி அல்லது கட்டிடம்"))}</label>
              <Field id="address-line" className="mt-1" autoComplete="street-address" placeholder={t(bi("Street name, area, building", "தெருப் பெயர், பகுதி, கட்டிடம்"))} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-ink" htmlFor="door">{t(bi("House / door no.", "வீடு / கதவு எண்"))} *</label>
                <Field id="door" className="mt-1" autoComplete="address-line2" placeholder="e.g. 12A" value={door} onChange={(e) => setDoor(e.target.value)} data-testid="door" />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink" htmlFor="apartment">{t(bi("Flat / floor", "பிளாட் / தளம்"))}</label>
                <Field id="apartment" className="mt-1" placeholder="e.g. Flat 3B" value={apartment} onChange={(e) => setApartment(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink" htmlFor="landmark">{t(bi("Nearby landmark", "அருகிலுள்ள அடையாளம்"))}</label>
              <Field id="landmark" className="mt-1" placeholder={t(bi("School, shop, gate or landmark", "பள்ளி, கடை, நுழைவாயில் அல்லது அடையாளம்"))} value={landmark} onChange={(e) => setLandmark(e.target.value)} />
            </div>
          </Panel>

          <Panel className={decision?.ok ? "border-[#c7eadb] bg-[#f4fcf8]" : "border-[#f1d6b4] bg-[#fffaf3]"}>
            <div className="flex items-start gap-2">
              <ShieldCheck className={`mt-0.5 h-5 w-5 shrink-0 ${decision?.ok ? "text-emerald-700" : "text-amber-700"}`} />
              <div className="min-w-0">
                <p className="text-sm font-bold">{decision?.ok ? t(bi("Delivery partner found", "டெலிவரி கடை கிடைத்தது")) : t(bi("Delivery availability check", "டெலிவரி கிடைப்புச் சரிபார்ப்பு"))}</p>
                {decision?.ok ? (
                  <div className="mt-2 space-y-2">
                    {decision.ranked.filter((row) => row.eligible).slice(0, 2).map((row) => {
                      const vendor = vendors.find((item) => item.id === row.vendorId);
                      return vendor ? (
                        <div key={row.vendorId} className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold">{t(vendor.name)}</span>
                          <span className="text-right text-muted">{row.distanceKm.toFixed(1)} km / {vendor.deliveryRadiusKm} km</span>
                        </div>
                      ) : null;
                    })}
                    <p className="text-[10px] leading-4 text-muted">{t(bi("Final availability is checked again when you place an order.", "ஆர்டர் செய்யும் போது கிடைப்பது மீண்டும் சரிபார்க்கப்படும்."))}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {decision?.exception ? t(EXCEPTION_LABEL[decision.exception]) : t(bi("We could not find a nearby active delivery partner yet.", "அருகில் செயல்பாட்டில் உள்ள டெலிவரி கடையை இன்னும் கண்டுபிடிக்க முடியவில்லை."))}
                  </p>
                )}
              </div>
            </div>
          </Panel>

          <div className="flex gap-2">
            <Button variant="line" className="flex-1" onClick={() => setStep(2)}>{t(bi("Back to map", "வரைபடத்திற்குத் திரும்பு"))}</Button>
            <Button className="flex-1" data-testid="confirm-door" disabled={!door.trim()} onClick={saveAddress}>{t(bi("Save delivery address", "விநியோக முகவரியைச் சேமி"))}</Button>
          </div>
          <p className="text-center text-[10px] leading-4 text-muted">{t(bi("Your address is saved for this preview. Final partner assignment is rechecked at checkout.", "இந்த முன்னோட்டத்தில் உங்கள் முகவரி சேமிக்கப்படும். இறுதி டெலிவரி கடை checkout-இல் மீண்டும் உறுதி செய்யப்படும்."))}</p>
        </div>
      ) : null}
    </div>
  );
}
