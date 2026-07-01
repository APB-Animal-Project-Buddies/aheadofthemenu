import { useEffect, useState } from "react";

interface Dish {
    id: number;
    dish_name: string;
    dish_data: any; // The JSONB payload
    created_at: string;
}

interface UseDishesResult {
    dishes: Dish[];
    loading: boolean;
    error: string | null;
    total: number;
}

/**
 * Fetch dishes from the database via the API
 * Replaces the hard-coded APB_DISHES pattern
 */
export function useDishes(options?: {
    limit?: number;
    offset?: number;
    skip?: boolean; // If true, don't fetch (useful for conditional loading)
}): UseDishesResult {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(!options?.skip);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (options?.skip) return;

        async function fetchDishes() {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams();
                if (options?.limit) params.append("limit", String(options.limit));
                if (options?.offset) params.append("offset", String(options.offset));

                const res = await fetch(`/api/dishes?${params.toString()}`);

                if (!res.ok) {
                    throw new Error("Failed to fetch dishes");
                }

                const data = await res.json();
                setDishes(data.dishes);
                setTotal(data.total);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
                setDishes([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDishes();
    }, [options?.limit, options?.offset, options?.skip]);

    return { dishes, loading, error, total };
}

/**
 * Alternative: Static initialization function
 * Call this at app startup to populate window.APB_DISHES (for backward compatibility)
 */
export async function initializeDishesGlobal() {
    try {
        const res = await fetch("/api/dishes?limit=10000");
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        // Extract just the dish_data payloads, like the old pattern
        window.APB_DISHES = data.dishes.map((d: Dish) => d.dish_data);
        console.log(`Loaded ${window.APB_DISHES.length} dishes from database`);
    } catch (err) {
        console.error("Failed to initialize dishes:", err);
        window.APB_DISHES = [];
    }
}

// Type for TypeScript
declare global {
    interface Window {
        APB_DISHES: any[];
    }
}