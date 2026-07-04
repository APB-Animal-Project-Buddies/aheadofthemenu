"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import ConfettiBoom from "react-confetti-boom";
import { ReviewForm } from "@/app/s/[code]/ReviewForm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/form/ChipGroup";
import { ALLERGENS } from "@/lib/dishes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

interface DishReview {
    id: number;
    dish_name: string;
    dish_data: any;
    created_at: string;
}

const CHEF_EXPERIENCE_LEVELS = [
    { value: "beginner", label: "Beginner (first time cooking)" },
    { value: "homecook", label: "Home Cook (regular kitchen use)" },
    { value: "professional", label: "Professional Chef (commercial kitchen)" },
];

function Centered({ title, body }: { title: string; body: string }) {
    return (
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
            <h1 className="text-2xl font-bold text-apb">{title}</h1>
            <p className="mt-3 text-neutral-600">{body}</p>
        </main>
    );
}

export default function CreateReviewLinkPage() {
    return (
        <Suspense fallback={<Centered title="Loading…" body="Fetching the dish." />}>
            <CreateReviewLinkContent />
        </Suspense>
    );
}

function CreateReviewLinkContent() {
    const searchParams = useSearchParams();
    const dishId = searchParams.get("dishId");

    const [dish, setDish] = useState<DishReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dishId) {
            setError("No dish selected");
            setLoading(false);
            return;
        }

        async function fetchDish() {
            try {
                const res = await fetch(`/api/dishes/${dishId}`);
                if (!res.ok) throw new Error("Dish not found");
                const data = await res.json();
                setDish(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dish");
            } finally {
                setLoading(false);
            }
        }

        fetchDish();
    }, [dishId]);

    if (loading) return <Centered title="Loading…" body="Fetching the dish." />;
    if (error) return <Centered title="Something went wrong" body={error} />;
    if (!dish) return <Centered title="Dish not found" body="We couldn't find that dish." />;

    return (
        <main className="mx-auto max-w-xl px-5 py-10">
            <h1 className="text-2xl font-bold text-apb">Create a review link</h1>
            <p className="mt-3 rounded-[16px] border border-apb-light/30 bg-apb-light/10 px-5 py-4 text-sm leading-relaxed text-apb">
                Reviews for dishes help us curate options for other home cooks, chefs, and restaurants — so we can have a better, faster, and happier transition to a sustainable, plant-based future.
            </p>
            <CreateReviewLinkForm dish={dish} />
        </main>
    );
}

function CreateReviewLinkForm({ dish }: { dish: DishReview }) {
    const dishTitle = dish.dish_data?.title || dish.dish_name || "this dish";

    const dishAllergens = (dish.dish_data?.allergens ?? []) as string[];

    // The dish's existing per-ingredient alternatives, flattened into pickable swap
    // "groups" (a swap can be several ingredients, e.g. seitan = gluten + broth).
    const altGroups = ((dish.dish_data?.ingredients ?? []) as any[])
        .map((ing: any, ii: number) => ({
            from: ing?.name ?? "ingredient",
            alts: ((ing?.alternatives ?? []) as any[]).map((alt: any, ai: number) => {
                const text = ((alt?.items ?? []) as any[])
                    .map((x: any) => [x?.quantity, String(x?.unit ?? "").replace(/_/g, " "), x?.name].filter(Boolean).join(" "))
                    .filter(Boolean)
                    .join(" + ");
                return { key: `${ii}:${ai}`, label: alt?.label ?? "", note: alt?.note ?? "", items: alt?.items ?? [], text };
            }),
        }))
        .filter((g) => g.alts.length);
    // Flat view (with the parent ingredient) for submit lookups.
    const allAlts = altGroups.flatMap((g) => g.alts.map((a) => ({ ...a, from: g.from })));

    const [formData, setFormData] = useState({
        name: "",
        chefExperience: "homecook",
        eventContext: "",
        difficulty: 3,
        notes: "",
        substituted: false,
        publishPublic: false,
        allergens: [] as string[],
        chosenAlts: [] as string[],
        customSwaps: [] as string[],
    });
    const [customDraft, setCustomDraft] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const { userId } = useAuth();
    const [showConfirm, setShowConfirm] = useState(false);
    const [reviewUrl, setReviewUrl] = useState<string | null>(null);
    const [reviewCode, setReviewCode] = useState<string | null>(null);
    const [reviewInline, setReviewInline] = useState(true); // review your own dish inline; on by default
    const [copied, setCopied] = useState(false);

    const update = (patch: Partial<typeof formData>) => setFormData(prev => ({ ...prev, ...patch }));

    // Reprompt for allergens when the cook substituted — prefill from the dish's
    // allergens (only when not already set) so they just adjust what swaps changed.
    const toggleSubstituted = (on: boolean) =>
        setFormData(prev => ({ ...prev, substituted: on, allergens: on && !prev.allergens.length ? dishAllergens : prev.allergens }));
    const toggleAlt = (key: string, on: boolean) =>
        setFormData(prev => ({ ...prev, chosenAlts: on ? [...prev.chosenAlts, key] : prev.chosenAlts.filter(k => k !== key) }));
    const addCustom = () => {
        const v = customDraft.trim();
        if (!v) return;
        setFormData(prev => ({ ...prev, customSwaps: [...prev.customSwaps, v] }));
        setCustomDraft("");
    };
    const removeCustom = (i: number) =>
        setFormData(prev => ({ ...prev, customSwaps: prev.customSwaps.filter((_, idx) => idx !== i) }));

    // Generating a link also sets the dish "active" for 24h — confirm first.
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirm(true);
    };

    const confirmGenerate = async () => {
        setShowConfirm(false);
        setStatus("submitting");
        setError(null);
        try {
            const res = await fetch("/api/review-instances", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(userId ? { "X-User-Id": userId } : {}) },
                body: JSON.stringify({
                    dishId: dish.id,
                    name: formData.name.trim(),
                    chefType: formData.chefExperience,
                    eventContext: formData.eventContext.trim() || null,
                    difficulty: formData.difficulty,
                    notes: formData.notes.trim() || null,
                    substituted: formData.substituted,
                    public: formData.publishPublic,
                    allergens: formData.substituted ? formData.allergens : [],
                    substitutions: formData.substituted
                        ? [
                              ...allAlts
                                  .filter((a) => formData.chosenAlts.includes(a.key))
                                  .map((a) => ({ from: a.from, label: a.label || null, items: a.items, source: "alternative" })),
                              ...formData.customSwaps.map((s) => ({ note: s, source: "custom" })),
                          ]
                        : [],
                }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to create review link");
            }
            const data = await res.json();
            setReviewUrl(`${window.location.origin}${data.path}`);
            setReviewCode(typeof data.path === "string" ? data.path.split("/").filter(Boolean).pop() ?? null : null);
            setStatus("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setStatus("error");
        }
    };

    const copy = async () => {
        if (!reviewUrl) return;
        try {
            await navigator.clipboard.writeText(reviewUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable — the URL is still selectable on screen */
        }
    };

    if (status === "success" && reviewUrl) {
        return (
            <div className="mt-6 flex flex-col gap-6 rounded-[16px] border border-neutral-200 bg-white/60 p-6">
                {/* Boom! Fires once when the review-instance form completes. */}
                <ConfettiBoom mode="boom" particleCount={140} colors={["#1e4d2b", "#2d7a3e", "#ff6b35", "#ff8c61", "#5bb673"]} />
                <div>
                    <h2 className="text-xl font-semibold text-apb">Review link created!</h2>
                    <p className="mt-2 text-sm text-neutral-600">
                        Your instance of <span className="font-semibold">{dishTitle}</span> is logged. Share this
                        link or QR code so anyone who tasted it can leave a review.
                    </p>
                </div>

                <div className="flex justify-center rounded-[16px] border border-neutral-200 bg-white p-5">
                    <QRCodeSVG value={reviewUrl} size={200} marginSize={2} />
                </div>

                <div>
                    <Label>Review link</Label>
                    <div className="mt-2 flex items-stretch gap-2">
                        <code className="flex flex-1 items-center break-all rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                            {reviewUrl}
                        </code>
                        <Button type="button" onClick={copy} className="px-4 py-2 text-sm">
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <p className="text-center text-sm font-medium text-apb">
                        Please help us curate dishes for a more plant-based future
                    </p>
                    <label className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-800">
                        <input
                            type="checkbox"
                            checked={reviewInline}
                            onChange={(e) => setReviewInline(e.target.checked)}
                            className="h-4 w-4 rounded border-neutral-300 accent-apb"
                        />
                        Review this dish yourself 🎉
                    </label>
                    {reviewInline && reviewCode ? (
                        <div className="mt-1 rounded-[16px] border border-neutral-200 bg-white p-4 text-left">
                            <ReviewForm shortCode={reviewCode} />
                        </div>
                    ) : null}
                    <button
                        type="button"
                        className="text-sm text-neutral-500 underline hover:text-apb"
                        onClick={() => {
                            setReviewUrl(null);
                            setStatus("idle");
                            setFormData({ name: "", chefExperience: "homecook", eventContext: "", difficulty: 3, notes: "", substituted: false, publishPublic: false, allergens: [], chosenAlts: [], customSwaps: [] });
                            setCustomDraft("");
                        }}
                    >
                        Create another link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6 rounded-[16px] border border-neutral-200 bg-white/60 p-6">
            <p className="text-sm text-neutral-600">
                Log this instance of <span className="font-semibold">{dishTitle}</span> — your details and how it
                went. Then share the generated link &amp; QR code so people who tasted it can leave a review.
            </p>

            <div>
                <Label htmlFor="name">Your name <span className="text-red-600">*</span></Label>
                <Input
                    id="name"
                    className="mt-2"
                    placeholder="e.g. Sarah Chen"
                    value={formData.name}
                    onChange={(e) => update({ name: e.target.value })}
                    required
                />
            </div>

            <div>
                <Label htmlFor="chef">Your experience level <span className="text-red-600">*</span></Label>
                <select
                    id="chef"
                    className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-apb"
                    value={formData.chefExperience}
                    onChange={(e) => update({ chefExperience: e.target.value })}
                >
                    {CHEF_EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                </select>
            </div>

            <div>
                <Label htmlFor="event">Where did you make this? <span className="text-neutral-400">(optional)</span></Label>
                <Input
                    id="event"
                    className="mt-2"
                    placeholder="e.g. Family dinner, Restaurant kitchen, Pop-up event"
                    value={formData.eventContext}
                    onChange={(e) => update({ eventContext: e.target.value })}
                />
            </div>

            <div>
                <Label>How difficult was it to make? <span className="text-red-600">*</span></Label>
                <div className="mt-3">
                    <div className="mb-1 text-sm font-medium">Difficulty: {formData.difficulty}</div>
                    <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[formData.difficulty]}
                        onValueChange={(v) => update({ difficulty: v[0] })}
                    />
                    <div className="mt-1 flex justify-between text-xs text-neutral-500">
                        <span>1 · very easy</span><span>3 · medium</span><span>5 · very difficult</span>
                    </div>
                </div>
            </div>

            <div>
                <Label htmlFor="notes">Notes <span className="text-neutral-400">(optional)</span></Label>
                <Textarea
                    id="notes"
                    className="mt-2"
                    placeholder="How did this attempt go? Anything notable for yourself."
                    value={formData.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                />
            </div>

            <div>
                <button
                    type="button"
                    onClick={() => toggleSubstituted(!formData.substituted)}
                    aria-pressed={formData.substituted}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-[16px] border-2 border-apb bg-apb px-5 py-4 text-left text-white transition",
                        formData.substituted ? "ring-2 ring-apb/40" : "hover:bg-apb-light"
                    )}
                >
                    <span
                        className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold",
                            formData.substituted ? "border-white bg-white text-apb" : "border-white/80 text-transparent"
                        )}
                    >
                        ✓
                    </span>
                    <span>
                        <span className="block text-base font-bold">I swapped or substituted ingredients</span>
                        <span className="block text-xs text-white/80">Tap if you changed anything — swaps can change the allergens.</span>
                    </span>
                </button>

                {formData.substituted ? (
                    <div className="mt-3 flex flex-col gap-4 rounded-[16px] border border-apb/30 bg-apb-cream/60 p-4">
                        {allAlts.length ? (
                            <div>
                                <Label>Which suggested swaps did you make?</Label>
                                <div className="mt-2 flex flex-col gap-3">
                                    {altGroups.map((g) => (
                                        <div key={g.from}>
                                            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                                Swaps for {g.from}
                                            </div>
                                            <div className="mt-1 flex flex-col gap-2">
                                                {g.alts.map((a) => (
                                                    <label key={a.key} className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-white p-2.5 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1"
                                                            checked={formData.chosenAlts.includes(a.key)}
                                                            onChange={(e) => toggleAlt(a.key, e.target.checked)}
                                                        />
                                                        <span>
                                                            {a.label ? <span className="font-medium text-apb">{a.label}: </span> : null}
                                                            {a.text || "—"}
                                                            {a.note ? <span className="block text-xs italic text-neutral-500">{a.note}</span> : null}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div>
                            <Label>{allAlts.length ? "Add another swap (not listed)" : "What did you swap?"}</Label>
                            <div className="mt-2 flex gap-2">
                                <Input
                                    value={customDraft}
                                    onChange={(e) => setCustomDraft(e.target.value)}
                                    placeholder="e.g. used maple syrup instead of sugar"
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                                />
                                <Button type="button" onClick={addCustom} className="px-4 py-2 text-sm">Add</Button>
                            </div>
                            {formData.customSwaps.length ? (
                                <ul className="mt-2 flex flex-col gap-1">
                                    {formData.customSwaps.map((s, i) => (
                                        <li key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-sm">
                                            <span>{s}</span>
                                            <button type="button" onClick={() => removeCustom(i)} className="px-2 text-neutral-400 hover:text-red-600">×</button>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>

                        <div>
                            <Label>Allergens for your version</Label>
                            <p className="mt-1 text-xs text-neutral-600">
                                Swaps can change allergens — we prefilled the recipe&rsquo;s. Adjust to match what you actually made.
                            </p>
                            <div className="mt-2">
                                <ChipGroup value={formData.allergens} onChange={(v) => update({ allergens: v })} options={ALLERGENS} />
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div>
                <button
                    type="button"
                    onClick={() => update({ publishPublic: !formData.publishPublic })}
                    aria-pressed={formData.publishPublic}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-[16px] border-2 border-apb bg-white px-5 py-4 text-left text-apb transition",
                        formData.publishPublic ? "ring-2 ring-apb/40 bg-apb-cream" : "hover:bg-apb-cream/60"
                    )}
                >
                    <span
                        className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold",
                            formData.publishPublic ? "border-apb bg-apb text-white" : "border-apb/50 text-transparent"
                        )}
                    >
                        ✓
                    </span>
                    <span>
                        <span className="block text-base font-bold">Publish my version publicly</span>
                        <span className="block text-xs text-apb/70">
                            Your name, swaps, notes, and allergens appear permanently on this dish&rsquo;s page for everyone.
                        </span>
                    </span>
                </button>
            </div>

            {status === "error" ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : null}

            <Button type="submit" disabled={status === "submitting" || !formData.name.trim()}>
                {status === "submitting" ? "Creating…" : "Generate review link"}
            </Button>

            {showConfirm && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConfirm(false)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-apb">Set this as an active dish?</h3>
                        <p className="mt-2 text-sm text-neutral-600">
                            Generating the link marks <strong>{dish.dish_name}</strong> as an active dish for <strong>24 hours</strong>. During that window it appears on your active-dishes page, and anyone with the link or QR can review it.
                        </p>
                        {formData.publishPublic ? (
                            <p className="mt-2 text-sm text-neutral-600">
                                Your version will also be <strong>published publicly</strong> on the dish page — permanently, visible to everyone.
                            </p>
                        ) : null}
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setShowConfirm(false)} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50">
                                Cancel
                            </button>
                            <button type="button" onClick={confirmGenerate} className="rounded-full bg-apb px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                                Generate &amp; activate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
