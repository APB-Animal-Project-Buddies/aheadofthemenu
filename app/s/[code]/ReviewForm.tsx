"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LIKED_OPTIONS, SUBSTITUTION_OPTIONS, DIET_OPTIONS, isCommentRequired } from "@/lib/reviews";

type FormValues = {
  rating: number; expectations: number; liked: string[]; disliked: string[];
  substitutionNA: boolean; substitutionScore: number;
  comments: string; name: string; email: string;
  diet: string; dietOther: string;
};

export function ReviewForm({ shortCode }: { shortCode: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const { control, register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormValues>({
    defaultValues: { rating: 5, expectations: 5, liked: [], disliked: [], substitutionNA: false, substitutionScore: 0, comments: "", name: "", email: "", diet: "", dietOther: "" },
  });
  const rating = watch("rating");
  const commentRequired = isCommentRequired(rating);
  // Mutual exclusion: a dimension picked as "liked" can't also be "disliked", and vice versa.
  const liked = watch("liked");
  const disliked = watch("disliked");
  // Plain-English restaurant verdict derived from the overall rating (spec anchors:
  // <5 wouldn't want it · >5 would order · 8+ definitely).
  const orderVerdict = rating <= 4 ? "would not order" : rating <= 7 ? "would consider ordering" : "would definitely order";

  async function onSubmit(values: FormValues) {
    setStatus("submitting");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_code: shortCode,
          review_data: {
            rating: values.rating, expectations: values.expectations,
            liked: values.liked, disliked: values.disliked,
            substitution: values.substitutionNA
              ? "na"
              : (SUBSTITUTION_OPTIONS.find((s) => s.score === values.substitutionScore)?.key ?? "na"),
            comments: values.comments,
            reviewer: { name: values.name, email: values.email, diet: values.diet, dietOther: values.dietOther },
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch { setStatus("error"); }
  }

  if (status === "done")
    return (
      <div className="rounded-[16px] border p-8 text-center">
        <h2 className="text-xl font-semibold text-apb">Thank you!</h2>
        <p className="mt-2 text-neutral-600">Your review was submitted.</p>
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Ratings group: overall + expectations together (same 1–10 control) */}
      <div className="flex flex-col gap-6 rounded-[16px] border border-neutral-200 bg-white/60 p-5">
        <Controller control={control} name="rating" render={({ field }) => (
          <div>
            <Label>How would you rate this dish? (1–10)</Label>
            <p className="mt-1 text-xs italic text-neutral-500">Please be honest — your feedback will be used to curate our data.</p>
            <div className="mt-3">
              <div className="mb-1 text-sm font-medium">Rating: {field.value}</div>
              <Slider min={1} max={10} step={1} value={[field.value]}
                onValueChange={(v) => { field.onChange(v[0]); void trigger("comments"); }} />
              <div className="mt-1 flex justify-between text-xs text-neutral-500">
                <span>1 · unpalatable</span><span>5 · would order</span><span>10 · restaurant-worthy</span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Rate from 1 (unpalatable — not worth eating), to 5 (you&apos;d order it at a restaurant), to 10 (you&apos;d go to a restaurant just to eat this).
              </p>
            </div>
          </div>
        )} />
        <Controller control={control} name="expectations" render={({ field }) => (
          <div>
            <Label>Did it meet your expectations? (1–10)</Label>
            <div className="mt-3">
              <div className="mb-1 text-sm font-medium">Expectations: {field.value}</div>
              <Slider min={1} max={10} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
              <div className="mt-1 flex justify-between text-xs text-neutral-500">
                <span>1 · vastly below</span><span>5 · met</span><span>10 · vastly exceeded</span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                Rate from 1 (fell vastly below), to 5 (met my expectations), to 10 (vastly exceeded).
              </p>
            </div>
          </div>
        )} />
      </div>

      <div>
        <Label>What did you dislike? (optional)</Label>
        <Controller control={control} name="disliked" render={({ field }) => (
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {LIKED_OPTIONS.filter((opt) => !liked.includes(opt)).map((opt) => (
              <label key={opt} className="flex items-center gap-2 capitalize">
                <Checkbox checked={field.value.includes(opt)}
                  onCheckedChange={(c) => field.onChange(c ? [...field.value, opt] : field.value.filter((x) => x !== opt))} />
                {opt}
              </label>
            ))}
            {LIKED_OPTIONS.every((opt) => liked.includes(opt))
              ? <span className="text-xs text-neutral-400">All marked under “what did you like”.</span> : null}
          </div>
        )} />
      </div>

      <div>
        <Label>What did you like? (optional)</Label>
        <Controller control={control} name="liked" render={({ field }) => (
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {LIKED_OPTIONS.filter((opt) => !disliked.includes(opt)).map((opt) => (
              <label key={opt} className="flex items-center gap-2 capitalize">
                <Checkbox checked={field.value.includes(opt)}
                  onCheckedChange={(c) => field.onChange(c ? [...field.value, opt] : field.value.filter((x) => x !== opt))} />
                {opt}
              </label>
            ))}
            {LIKED_OPTIONS.every((opt) => disliked.includes(opt))
              ? <span className="text-xs text-neutral-400">All marked under “what did you dislike”.</span> : null}
          </div>
        )} />
      </div>

      <div>
        <Label>If this dish is traditionally made with non-plant-based ingredients, how did the substitution(s) compare?</Label>
        <p className="mt-1 text-xs text-neutral-500">e.g. vegan cheese, plant-based meats, egg replacers.</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-sm">Not applicable / I don&apos;t know</span>
          <Controller control={control} name="substitutionNA" render={({ field }) => (
            <button
              type="button"
              role="switch"
              aria-checked={field.value}
              aria-label="Not applicable"
              onClick={() => field.onChange(!field.value)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${field.value ? "bg-apb" : "bg-neutral-300"}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${field.value ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          )} />
        </div>
        {!watch("substitutionNA") ? (
          <Controller control={control} name="substitutionScore" render={({ field }) => (
            <div className="mt-3">
              <div className="mb-1 text-sm font-medium">
                {SUBSTITUTION_OPTIONS.find((s) => s.score === field.value)?.label}
              </div>
              <Slider min={-2} max={2} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
              <div className="mt-1 flex justify-between text-xs text-neutral-500">
                <span>Much worse</span><span>Equal</span><span>Much better</span>
              </div>
              <p className="mt-1 text-xs text-neutral-400">Equal = I didn&apos;t notice a difference between the substitute and the original.</p>
              {Math.abs(field.value) === 2 ? (
                <p className="mt-1 text-xs text-apb">
                  Mind adding a comment on what made the substitution {field.value === 2 ? "much better" : "much worse"}?
                </p>
              ) : null}
            </div>
          )} />
        ) : null}
      </div>

      <div>
        <Label>Comments {commentRequired ? <span className="text-red-600">(required)</span> : "(optional)"}</Label>
        <p className="mt-1 rounded-lg bg-apb-cream px-3 py-2 text-xs text-neutral-600">
          {(liked.length > 0 || disliked.length > 0) && (
            <>
              {liked.length > 0 && <>You mentioned you liked <span className="font-bold">{liked.join(", ")}</span></>}
              {liked.length > 0 && disliked.length > 0 && " and "}
              {disliked.length > 0 && <>{liked.length === 0 ? "You mentioned you " : ""}disliked <span className="font-bold">{disliked.join(", ")}</span></>}
              {". "}
            </>
          )}
          Based on your rating, you <span className="font-medium">{orderVerdict}</span> this from a restaurant.
          Please add any clarification on your feedback below!
        </p>
        <Textarea className="mt-2"
          {...register("comments", {
            validate: (v) => !isCommentRequired(watch("rating")) || (v && v.trim() !== "") ? true : "Please tell us why for this rating",
          })} />
        {errors.comments ? <p className="mt-1 text-sm text-red-600">{errors.comments.message}</p> : null}
      </div>

      <div>
        <Label>What diet do you follow? (optional)</Label>
        <select
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-apb"
          {...register("diet")}
        >
          <option value="">Prefer not to say</option>
          {DIET_OPTIONS.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
          <option value="other">Other</option>
        </select>
        {watch("diet") === "other" ? (
          <Input className="mt-2" placeholder="Tell us your diet" {...register("dietOther")} />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Name / initials (optional)</Label>
          <Input className="mt-2" {...register("name")} />
        </div>
        <div>
          <Label>Email (optional)</Label>
          <Input className="mt-2" type="email"
            {...register("email", { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
      </div>

      {status === "error" ? (
        <p className="text-sm text-red-600">Something went wrong submitting your review. Please try again.</p>
      ) : null}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
