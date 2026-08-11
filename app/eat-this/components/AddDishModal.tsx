"use client";

/**
 * Two-step add-a-dish modal (improved version).
 *  Where? — Single search field for finding a restaurant, or creating a new one
 *           Once selection is made, expand to show full form (name*, address*,
 *           neighborhood, website) with data pre-filled from autocomplete.
 *  What?  — dish name*, one-line description, tag chips (existing vocabulary
 *           + free text). A live duplicate check against the loaded catalog
 *           steers people to vote instead of re-adding.
 * Submits POST /api/eat-this/dishes with the caller's Bearer token;
 * an idempotent `existed: true` response counts as success and jumps to the
 * existing card. A 401 (expired session) shows a sign-in prompt.
 */
import { useEffect, useMemo, useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import type { CatalogRestaurant } from "./RestaurantCard";
import type { CatalogDish } from "./DishCard";

type NewRestaurantFields = { name: string; address: string; neighborhood: string; website: string };
const EMPTY_NEW: NewRestaurantFields = { name: "", address: "", neighborhood: "", website: "" };

// LocationIQ result type (from backend)
type LocationIQResult = {
  place_id: string;
  osm_id: string;
  osm_type: "node" | "way" | "relation";
  lat: string;
  lon: string;
  display_name: string;
  display_place: string;
  display_address: string;
  address: {
    name?: string;
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
    state?: string;
  };
};

export function AddDishModal({ open, onClose, restaurants, dishes, initialRestaurantId, onAdded, onJumpToDish }: {
  open: boolean;
  onClose: () => void;
  restaurants: CatalogRestaurant[];
  dishes: CatalogDish[];
  initialRestaurantId?: string | null;
  /** Called with the new dish id on success — the page refetches + scrolls + highlights. */
  onAdded: (dishId: string) => void;
  /** Jump to an already-listed dish instead of re-adding it. */
  onJumpToDish: (dishId: string) => void;
}) {
  const { session } = useAuth();

  const [step, setStep] = useState<"where" | "what">("where");
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState<NewRestaurantFields>(EMPTY_NEW);

  // Unified search state
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState<LocationIQResult[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);

  // Track if user has made a selection (to show expanded form)
  const [restaurantSelected, setRestaurantSelected] = useState(false);

  // Duplicate detection state
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [showingDuplicates, setShowingDuplicates] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateCheckAttempts, setDuplicateCheckAttempts] = useState(0);

  // Debounce timer
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  // AbortController for cancelling stale autocomplete requests
  const autocompleteAbortController = useRef<AbortController | null>(null);
  // Track if any dropdown button currently has focus
  const dropdownButtonFocusedRef = useRef(false);

  const [dishName, setDishName] = useState("");
  const [description, setDescription] = useState("");
  const [availability, setAvailability] = useState<"permanent" | "seasonal">("permanent");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [customizations, setCustomizations] = useState<string[]>([]);
  const [customizationInput, setCustomizationInput] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Fresh form every time the modal opens (optionally pre-selected to a venue).
  useEffect(() => {
    if (!open) return;
    setStep("where");
    setRestaurantQuery("");
    setRestaurantId(initialRestaurantId ?? null);
    setCreatingNew(false);
    setNewRestaurant(EMPTY_NEW);
    setDishName("");
    setDescription("");
    setAvailability("permanent");
    setTags([]);
    setTagInput("");
    setCustomizations([]);
    setCustomizationInput("");
    setSubmitting(false);
    setError(null);
    setSessionExpired(false);
    setSearchQuery("");
    setAutocompleteResults([]);
    setShowAutocomplete(false);
    setAutocompleteLoading(false);
    setAutocompleteError(null);
    setRestaurantSelected(false);
    setDuplicateMatches([]);
    setShowingDuplicates(false);
    setCheckingDuplicates(false);
    setDuplicateCheckAttempts(0);
  }, [open, initialRestaurantId]);

  // Cleanup debounce timer and abort pending requests on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
      if (autocompleteAbortController.current) {
        autocompleteAbortController.current.abort();
      }
    };
  }, []);

  /**
   * Fetch autocomplete suggestions from our backend API
   * Uses AbortController to cancel stale requests if a newer one comes in
   */
  const fetchAutocomplete = async (query: string) => {
    if (!query || query.length < 3) {
      setAutocompleteResults([]);
      return;
    }

    try {
      setAutocompleteLoading(true);
      setAutocompleteError(null);
      setShowAutocomplete(true);  // Show dropdown immediately while loading

      // Cancel any previous in-flight request
      if (autocompleteAbortController.current) {
        autocompleteAbortController.current.abort();
      }

      // Create a new AbortController for this request
      const controller = new AbortController();
      autocompleteAbortController.current = controller;

      const response = await fetch(
        `/api/autocomplete/location?q=${encodeURIComponent(query)}&limit=5`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch suggestions");
      }

      const data = await response.json();
      // Only update state if this request wasn't aborted
      setAutocompleteResults(data.results || []);
    } catch (err) {
      // Don't show error if request was aborted (user moved on to new query)
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to fetch suggestions";
      setAutocompleteError(message);
      setAutocompleteResults([]);
    } finally {
      setAutocompleteLoading(false);
    }
  };

  /**
   * Handle unified search input with debounce (1 second)
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setAutocompleteError(null);

    // Clear existing timer
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);

    // If user clears the search, hide results
    if (value.length === 0) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    // Trigger autocomplete after 1 second of inactivity
    searchDebounceTimer.current = setTimeout(() => {
      if (value.length >= 3) {
        fetchAutocomplete(value);
      } else {
        setAutocompleteResults([]);
        setShowAutocomplete(false);
      }
    }, 1000);
  };

  /**
   * Handle selection from autocomplete results
   * Fills in the restaurant name and address fields and shows expanded form
   */
  const handleAutocompleteSelect = (result: LocationIQResult) => {
    const name = result.display_place || result.address.name || "";
    const address = result.display_address || "";

    setNewRestaurant((prev) => ({
      ...prev,
      name,
      address,
    }));

    setSearchQuery("");
    setAutocompleteResults([]);
    setShowAutocomplete(false);
    setCreatingNew(true);
    setRestaurantSelected(true);
  };

  /**
   * Handle pressing Enter in search field
   * If user hasn't selected from autocomplete, they're manually entering data
   */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // If there are results and none selected, select the first one
      if (autocompleteResults.length > 0) {
        handleAutocompleteSelect(autocompleteResults[0]);
      } else {
        // User is entering manually
        setNewRestaurant((prev) => ({
          ...prev,
          name: searchQuery,
        }));
        setSearchQuery("");
        setCreatingNew(true);
        setRestaurantSelected(true);
      }
    }
  };

  /**
   * Clear the selection and go back to search
   */
  const handleClearSelection = () => {
    setRestaurantSelected(false);
    setCreatingNew(false);
    setNewRestaurant(EMPTY_NEW);
    setSearchQuery("");
  };

  /**
   * Dismiss the autocomplete dropdown
   */
  const dismissAutocomplete = () => {
    setShowAutocomplete(false);
    setAutocompleteResults([]);
  };

  /**
   * Check for duplicate restaurants in the database
   * Uses fuzzy matching on name and address
   */
  const checkForDuplicates = async () => {
    if (!newRestaurant.name.trim() || !newRestaurant.address.trim()) {
      return;
    }

    setCheckingDuplicates(true);
    try {
      const response = await fetch("/api/eat-this/restaurants/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRestaurant.name.trim(),
          address: newRestaurant.address.trim(),
          city: "seattle", // You might want to make this dynamic
        }),
      });

      if (!response.ok) {
        console.error("Duplicate check failed");
        setDuplicateMatches([]);
        return;
      }

      const data = await response.json();
      setDuplicateMatches(data.similarRestaurants || []);

      if (data.hasDuplicates) {
        setShowingDuplicates(true);
        setDuplicateCheckAttempts(0); // Reset attempts when showing duplicates
      } else {
        // No duplicates, proceed to dish form
        setStep("what");
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
      // On error, allow user to proceed anyway
      setStep("what");
    } finally {
      setCheckingDuplicates(false);
    }
  };

  /**
   * Handle user confirming they want to use an existing restaurant from duplicates
   */
  const handleUseDuplicateRestaurant = (duplicateRestaurantId: string) => {
    setRestaurantId(duplicateRestaurantId);
    setShowingDuplicates(false);
    setDuplicateMatches([]);
    setCreatingNew(false);
    setNewRestaurant(EMPTY_NEW);
    setStep("what");
  };

  /**
   * Handle user confirming they want to create a new restaurant anyway
   * (This happens when they click Continue again without editing)
   */
  const handleProceedWithNewRestaurant = () => {
    setShowingDuplicates(false);
    setDuplicateMatches([]);
    setDuplicateCheckAttempts(prev => prev + 1);
    setStep("what");
  };

  const filteredRestaurants = useMemo(() => {
    const q = restaurantQuery.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.locations.some((l) => (l.neighborhood ?? "").toLowerCase().includes(q))
    );
  }, [restaurants, restaurantQuery]);

  /** Existing tag vocabulary across the loaded catalog. */
  const tagVocabulary = useMemo(() => {
    const seen = new Set<string>();
    for (const d of dishes) for (const t of d.tags) seen.add(t);
    for (const t of tags) seen.add(t);
    return Array.from(seen).sort();
  }, [dishes, tags]);

  const selectedRestaurant = restaurants.find((r) => r.id === restaurantId) ?? null;

  /** Live duplicate check against the loaded catalog for the chosen restaurant. */
  const duplicate = useMemo(() => {
    if (creatingNew || !restaurantId) return null;
    const name = dishName.trim().toLowerCase();
    if (!name) return null;
    return dishes.find((d) => d.restaurantId === restaurantId && d.name.trim().toLowerCase() === name) ?? null;
  }, [creatingNew, restaurantId, dishName, dishes]);

  const whereReady = creatingNew
    ? newRestaurant.name.trim() !== "" && newRestaurant.address.trim() !== ""
    : restaurantId !== null;
  const canSubmit = dishName.trim() !== "" && !duplicate && !submitting;

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const addFreeTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  /** Existing customization vocabulary across the loaded catalog (tofu, seitan…). */
  const customizationVocabulary = useMemo(() => {
    const seen = new Set<string>();
    for (const d of dishes) for (const c of d.customizations ?? []) seen.add(c);
    for (const c of customizations) seen.add(c);
    return Array.from(seen).sort();
  }, [dishes, customizations]);

  const toggleCustomization = (c: string) =>
    setCustomizations((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const addFreeCustomization = () => {
    const c = customizationInput.trim().toLowerCase();
    if (c && !customizations.includes(c)) setCustomizations((prev) => [...prev, c]);
    setCustomizationInput("");
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSessionExpired(false);
    try {
      const res = await fetch("/api/eat-this/dishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken ?? ""}`,
        },
        body: JSON.stringify({
          restaurantId: creatingNew ? null : restaurantId,
          newRestaurant: creatingNew
            ? {
              name: newRestaurant.name.trim(),
              address: newRestaurant.address.trim(),
              neighborhood: newRestaurant.neighborhood.trim() || null,
              website: newRestaurant.website.trim() || null,
            }
            : null,
          name: dishName.trim(),
          description: description.trim() || null,
          availability,
          tags,
          customizations,
        }),
      });
      if (res.status === 401) {
        setSessionExpired(true);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? "Couldn't add the dish right now");
        return;
      }
      // existed: true is still success — jump to the already-listed card.
      if (body.existed && body.dishId) {
        onJumpToDish(body.dishId);
        onClose();
        return;
      }
      if (body.dishId) onAdded(body.dishId);
      onClose();
    } catch {
      setError("Couldn't add the dish right now");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={step === "where" ? "Add a dish — where?" : "Add a dish — what?"}>
      {step === "where" ? (
        <div className="flex flex-col gap-3">
          {/* Stage 1: Search or select from existing restaurants */}
          {!restaurantSelected && (
            <>
              {/* Existing restaurants search */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-2">
                  SEARCH EXISTING RESTAURANTS
                </label>
                <Input
                  autoFocus
                  placeholder="Search restaurants…"
                  value={restaurantQuery}
                  onChange={(e) => setRestaurantQuery(e.target.value)}
                />
                {filteredRestaurants.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg mt-2">
                    {filteredRestaurants.map((r) => (
                      <label
                        key={r.id}
                        className={`flex cursor-pointer items-center gap-2.5 border-b border-neutral-100 px-3 py-2 last:border-b-0 ${restaurantId === r.id ? "bg-apb/5" : "hover:bg-neutral-50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="rl-restaurant"
                          checked={restaurantId === r.id}
                          onChange={() => {
                            setRestaurantId(r.id);
                            setRestaurantQuery("");
                            // For existing restaurants, skip the form and go straight to dishes
                            setStep("what");
                          }}
                          className="accent-apb"
                        />
                        <div>
                          <span className="text-sm font-medium text-neutral-800">{r.name}</span>
                          {r.locations[0]?.neighborhood && (
                            <span className="text-xs text-neutral-400 ml-2">· {r.locations[0].neighborhood}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {restaurantQuery.trim() && filteredRestaurants.length === 0 && (
                  <div className="mt-2 text-xs text-neutral-500">
                    No matching restaurants — add a new one below.
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-neutral-500">OR</span>
                </div>
              </div>

              {/* Unified search for new restaurants */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-2">
                  ADD A NEW RESTAURANT
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search location (e.g., 'Pizza Brooklyn') or press Enter to continue"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      // Escape dismisses dropdown without closing modal
                      if (e.key === "Escape") {
                        e.preventDefault();
                        dismissAutocomplete();
                        return;
                      }
                      // Tab to next element - let focus management handle it
                      handleSearchKeyDown(e);
                    }}
                    onBlur={() => {
                      // Input lost focus
                      // If a dropdown button will get focus, dropdownButtonFocusedRef will be set to true
                      // Otherwise, the button's onBlur will close the dropdown
                      setTimeout(() => {
                        if (!dropdownButtonFocusedRef.current) {
                          dismissAutocomplete();
                        }
                      }, 0);
                    }}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showAutocomplete}
                    aria-controls="autocomplete-listbox"
                    aria-autocomplete="list"
                  />

                  {/* Autocomplete dropdown */}
                  {showAutocomplete && (
                    <div
                      id="autocomplete-listbox"
                      role="listbox"
                      className="absolute top-full left-0 right-0 mt-1 border border-neutral-200 rounded-lg bg-white shadow-md z-20"
                      onMouseDown={(e) => {
                        // Prevent blur from firing when clicking dropdown
                        e.preventDefault();
                      }}
                    >
                      {autocompleteLoading && (
                        <div className="px-3 py-3 text-center text-xs text-neutral-500">
                          Searching…
                        </div>
                      )}

                      {autocompleteError && (
                        <div className="px-3 py-3 text-xs text-red-600">
                          {autocompleteError}
                        </div>
                      )}

                      {!autocompleteLoading &&
                        !autocompleteError &&
                        autocompleteResults.length > 0 && (
                          autocompleteResults.map((result) => (
                            <button
                              key={result.place_id}
                              type="button"
                              onClick={() => handleAutocompleteSelect(result)}
                              onFocus={() => {
                                // A button got focus, keep dropdown open
                                dropdownButtonFocusedRef.current = true;
                              }}
                              onBlur={() => {
                                // Button lost focus, but another button might get it
                                // Reset the flag - it will be set to true if next focus is a button
                                dropdownButtonFocusedRef.current = false;
                                // Close on next tick if no button gets focus
                                setTimeout(() => {
                                  if (!dropdownButtonFocusedRef.current) {
                                    dismissAutocomplete();
                                  }
                                }, 0);
                              }}
                              role="option"
                              aria-selected={false}
                              className="w-full text-left px-3 py-2 text-sm border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 focus:outline-none focus:bg-neutral-100 transition"
                            >
                              <div className="font-medium text-neutral-800">{result.display_place}</div>
                              <div className="text-xs text-neutral-500">{result.display_address}</div>
                            </button>
                          ))
                        )}

                      {!autocompleteLoading &&
                        !autocompleteError &&
                        autocompleteResults.length === 0 &&
                        searchQuery.length >= 3 && (
                          <div className="px-3 py-3 text-xs text-neutral-500">
                            No results found. Press Enter to continue with "{searchQuery}".
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Stage 2: Expanded form after selection */}
          {restaurantSelected && (
            <>
              <button
                type="button"
                onClick={handleClearSelection}
                className="self-start text-sm font-semibold text-apb hover:underline"
              >
                ← Change restaurant
              </button>

              <div className="space-y-2 p-3 rounded-lg bg-neutral-50">
                <div className="text-sm">
                  <span className="text-neutral-600">Selected: </span>
                  <span className="font-medium text-neutral-800">{newRestaurant.name || searchQuery}</span>
                </div>

                <Input
                  placeholder="Restaurant name *"
                  value={newRestaurant.name}
                  onChange={(e) => {
                    setNewRestaurant((prev) => ({ ...prev, name: e.target.value }));
                    setShowingDuplicates(false); // Hide duplicates when editing
                  }}
                />
                <Input
                  placeholder="Street address *"
                  value={newRestaurant.address}
                  onChange={(e) => {
                    setNewRestaurant((prev) => ({ ...prev, address: e.target.value }));
                    setShowingDuplicates(false); // Hide duplicates when editing
                  }}
                />
                <Input
                  placeholder="Neighborhood"
                  value={newRestaurant.neighborhood}
                  onChange={(e) => setNewRestaurant((prev) => ({ ...prev, neighborhood: e.target.value }))}
                />
                <Input
                  placeholder="Website"
                  value={newRestaurant.website}
                  onChange={(e) => setNewRestaurant((prev) => ({ ...prev, website: e.target.value }))}
                />
              </div>

              {/* Duplicate matches warning */}
              {showingDuplicates && duplicateMatches.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 mb-2">
                    Did you mean one of these restaurants?
                  </div>
                  <div className="space-y-2">
                    {duplicateMatches.map((match) => (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => handleUseDuplicateRestaurant(match.id)}
                        className="w-full text-left p-2 rounded-lg bg-white hover:bg-blue-100 border border-blue-100 transition"
                      >
                        <div className="font-medium text-neutral-800">{match.name}</div>
                        <div className="text-xs text-neutral-600 mt-1 space-y-0.5">
                          {match.locations.slice(0, 3).map((loc) => (
                            <div key={loc.id}>{loc.address}</div>
                          ))}
                          {match.locations.length > 3 && (
                            <div className="text-neutral-500">+{match.locations.length - 3} more location{match.locations.length - 3 !== 1 ? 's' : ''}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedWithNewRestaurant}
                    className="w-full mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 py-1"
                  >
                    No, add this as a new restaurant
                  </button>
                </div>
              )}
            </>
          )}

          {/* Continue button - for new restaurants, check duplicates first */}
          {(restaurantSelected || restaurantId !== null) && (
            <button
              type="button"
              disabled={!whereReady || checkingDuplicates}
              onClick={() => {
                if (creatingNew) {
                  // For new restaurants, check for duplicates first
                  checkForDuplicates();
                } else {
                  // For existing restaurants, go straight to dish form
                  setStep("what");
                }
              }}
              className="mt-1 rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checkingDuplicates ? "Checking..." : "Continue"}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-neutral-500">
            at <strong className="text-neutral-700">{creatingNew ? newRestaurant.name : selectedRestaurant?.name}</strong>{" "}
            <button type="button" className="text-apb hover:underline" onClick={() => setStep("where")}>
              change
            </button>
          </div>

          <Input autoFocus placeholder="Dish name *" value={dishName} onChange={(e) => setDishName(e.target.value)} />

          {duplicate && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Already listed at this restaurant —{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  onJumpToDish(duplicate.id);
                  onClose();
                }}
              >
                vote it up instead
              </button>
            </div>
          )}

          <Input placeholder="One-line description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div>
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-neutral-400">AVAILABILITY</div>
            <div className="flex gap-2">
              {(["permanent", "seasonal"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAvailability(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${availability === v
                    ? "border-apb bg-apb text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-neutral-400">TAGS</div>
            <div className="flex flex-wrap gap-1.5">
              {tagVocabulary.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition ${tags.includes(tag)
                    ? "border-apb bg-apb text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Add a tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFreeTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addFreeTag}
                disabled={!tagInput.trim()}
                className="shrink-0 rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1 text-[10px] font-bold tracking-wide text-neutral-400">CUSTOMIZATIONS (OPTIONAL)</div>
            <p className="mb-1.5 text-[11px] text-neutral-400">Options diners can pick when they rate — e.g. tofu, seitan, cabbage.</p>
            <div className="flex flex-wrap gap-1.5">
              {customizationVocabulary.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCustomization(c)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition ${customizations.includes(c)
                    ? "border-apb bg-apb text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Add a customization…"
                value={customizationInput}
                onChange={(e) => setCustomizationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFreeCustomization();
                  }
                }}
              />
              <button
                type="button"
                onClick={addFreeCustomization}
                disabled={!customizationInput.trim()}
                className="shrink-0 rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          {sessionExpired && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Session expired —{" "}
              <a className="font-semibold underline" href="/login?next=/eat-this">
                sign in again
              </a>{" "}
              to add your dish.
            </div>
          )}
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="rounded-lg bg-apb px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Adding…" : "Add dish"}
          </button>
        </div>
      )}
    </Modal>
  );
}