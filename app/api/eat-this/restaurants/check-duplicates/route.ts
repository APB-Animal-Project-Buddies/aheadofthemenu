/**
 * API Route: /api/eat-this/restaurants/check-duplicates
 * 
 * Checks if a restaurant already exists in the database by comparing:
 * - Restaurant name (fuzzy matching with 80%+ similarity)
 * - Address (simple text similarity)
 * 
 * Returns matching restaurants with their locations so user can verify
 * and either use the existing restaurant or create a new one.
 */

import { NextRequest, NextResponse } from 'next/server';
import { graphql } from '@/lib/nhost';

export const maxDuration = 60;

type DuplicateCheckRequest = {
    name: string;
    address: string;
    city?: string;
};

type RestaurantMatch = {
    id: string;
    name: string;
    locations: Array<{
        id: string;
        address: string;
        neighborhood?: string;
    }>;
    matchScore: number;
    nameMatchScore: number;
    addressMatchScore: number;
};

type DuplicateCheckResponse = {
    similarRestaurants: RestaurantMatch[];
    hasDuplicates: boolean;
};

type RestaurantRow = {
    id: string;
    name: string;
    locations: Array<{
        id: string;
        address: string;
        neighborhood: string | null;
    }>;
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching on restaurant names
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Number representing the edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = Array(len2 + 1)
        .fill(null)
        .map(() => Array(len1 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
        for (let i = 1; i <= len1; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    return matrix[len2][len1];
}

/**
 * Calculate similarity score between two strings (0-100)
 * Based on Levenshtein distance
 * 
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity score 0-100
 */
function calculateSimilarity(str1: string, str2: string): number {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 100;
    return Math.round(((maxLength - distance) / maxLength) * 100);
}

/**
 * Check if two addresses are similar using simple substring matching
 * 
 * @param addr1 First address
 * @param addr2 Second address
 * @returns Similarity score 0-100
 */
function calculateAddressSimilarity(addr1: string, addr2: string): number {
    const a1 = addr1.toLowerCase().trim();
    const a2 = addr2.toLowerCase().trim();

    // Exact match
    if (a1 === a2) return 100;

    // Check if one contains the other (common for abbreviated addresses)
    if (a1.includes(a2) || a2.includes(a1)) return 85;

    // Extract street numbers and names
    const getStreetKey = (addr: string) => {
        const match = addr.match(/^(\d+)\s+(.+?)(?:,|$)/);
        return match ? `${match[1]} ${match[2].toLowerCase()}` : addr;
    };

    const key1 = getStreetKey(a1);
    const key2 = getStreetKey(a2);

    // Compare street keys
    if (key1 === key2) return 90;

    // Use Levenshtein for partial similarity
    const nameSim = calculateSimilarity(key1, key2);
    return Math.max(nameSim, calculateSimilarity(a1, a2));
}

/**
 * GraphQL query to fetch restaurants for duplicate checking
 * Uses Nhost GraphQL client (same as other eat-this routes)
 */
const FETCH_RESTAURANTS_QUERY = `
  query FetchRestaurants($city: String!) {
    restaurants(
      where: { city: { _eq: $city } }
      order_by: { name: asc }
    ) {
      id
      name
      locations(order_by: { created_at: asc }) {
        id
        address
        neighborhood
      }
    }
  }
`;

/**
 * POST /api/eat-this/restaurants/check-duplicates
 * 
 * Request body:
 * {
 *   "name": "Pizza Place",
 *   "address": "123 Main St, Seattle, WA",
 *   "city": "seattle" (optional, defaults to seattle)
 * }
 */
export async function POST(
    request: NextRequest
): Promise<NextResponse<DuplicateCheckResponse>> {
    try {
        const body = (await request.json()) as DuplicateCheckRequest;
        const { name, address, city = 'seattle' } = body;

        // Validate input
        if (!name || !name.trim()) {
            return NextResponse.json(
                { similarRestaurants: [], hasDuplicates: false },
                { status: 200 }
            );
        }

        if (!address || !address.trim()) {
            return NextResponse.json(
                { similarRestaurants: [], hasDuplicates: false },
                { status: 200 }
            );
        }

        // Fetch all restaurants in the city using Nhost GraphQL
        const res = await graphql<{ restaurants: RestaurantRow[] }>(
            FETCH_RESTAURANTS_QUERY,
            {
                useAdminSecret: true,
                variables: { city: city.toLowerCase() },
            }
        );

        if (res.errors?.length) {
            console.error('GraphQL errors:', res.errors);
            return NextResponse.json(
                { similarRestaurants: [], hasDuplicates: false },
                { status: 200 }
            );
        }

        const restaurants = res.data?.restaurants || [];

        // Calculate similarity scores for each restaurant
        const matches: RestaurantMatch[] = restaurants
            .map((restaurant: any) => {
                const nameScore = calculateSimilarity(name, restaurant.name);

                // Calculate best address match among all locations
                let bestAddressScore = 0;
                if (restaurant.locations && restaurant.locations.length > 0) {
                    bestAddressScore = Math.max(
                        ...restaurant.locations.map((loc: any) =>
                            calculateAddressSimilarity(address, loc.address)
                        )
                    );
                }

                // Combined score: 70% name, 30% address
                const combinedScore = Math.round(nameScore * 0.7 + bestAddressScore * 0.3);

                return {
                    id: restaurant.id,
                    name: restaurant.name,
                    locations: restaurant.locations || [],
                    matchScore: combinedScore,
                    nameMatchScore: nameScore,
                    addressMatchScore: bestAddressScore,
                };
            })
            // Filter: Name must be 80%+ similar, combined score must be 70%+
            .filter((match: RestaurantMatch) => match.nameMatchScore >= 80 && match.matchScore >= 70)
            // Sort by match score descending
            .sort((a: RestaurantMatch, b: RestaurantMatch) => b.matchScore - a.matchScore);

        return NextResponse.json({
            similarRestaurants: matches,
            hasDuplicates: matches.length > 0,
        });
    } catch (error) {
        console.error('Duplicate check error:', error);
        return NextResponse.json(
            { similarRestaurants: [], hasDuplicates: false },
            { status: 200 }
        );
    }
}

/**
 * Matching Algorithm Explanation:
 * 
 * 1. NAME MATCHING (Fuzzy, 80%+ required)
 *    - Uses Levenshtein distance algorithm
 *    - Catches typos, abbreviations, slight misspellings
 *    - Example: "Pizzeria" vs "Pizza" = ~82% match
 *    - Minimum 80% to proceed
 * 
 * 2. ADDRESS MATCHING (Simple text similarity)
 *    - Exact match = 100%
 *    - One contains the other = 85%
 *    - Same street name = 90%
 *    - Levenshtein similarity for partial matches
 * 
 * 3. COMBINED SCORING (70% name + 30% address)
 *    - Name is weighted higher as it's more reliable
 *    - Example: 90% name + 70% address = 85% combined
 *    - Minimum 70% combined score to show as suggestion
 * 
 * 4. FILTERING & SORTING
 *    - Must meet BOTH name (80%) AND combined (70%) thresholds
 *    - Results sorted by combined score (highest first)
 *    - Typically shows 0-3 matches
 */