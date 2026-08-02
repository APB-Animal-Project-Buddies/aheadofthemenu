/**
 * API Route: /api/autocomplete/location
 * 
 * Handles LocationIQ autocomplete requests from the frontend.
 * The API key is stored securely on the server and not exposed to the browser.
 * 
 * Usage:
 * GET /api/autocomplete/location?q=pizza&limit=5
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type LocationIQAddress = {
    name?: string;
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
    state?: string;
};

export type LocationIQResult = {
    place_id: string;
    osm_id: string;
    osm_type: 'node' | 'way' | 'relation';
    lat: string;
    lon: string;
    display_name: string;
    display_place: string;
    display_address: string;
    address: LocationIQAddress;
};

export type AutocompleteResponse = {
    results: LocationIQResult[];
    error?: string;
};

/**
 * GET /api/autocomplete/location
 * 
 * Query Parameters:
 *   q (required): Search query string
 *   limit (optional): Number of results to return (1-20, default: 5)
 *   countrycodes (optional): Comma-separated country codes (e.g., "us,gb")
 *   layers (optional): Comma-separated layers to filter (e.g., "city,suburb")
 *   accept-language (optional): Language code (default: "en")
 */
export async function GET(request: NextRequest): Promise<NextResponse<AutocompleteResponse>> {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const limitStr = searchParams.get('limit');
        const countrycodes = searchParams.get('countrycodes');
        const layers = searchParams.get('layers');
        const acceptLanguage = searchParams.get('accept-language');

        // Validate required parameter
        if (!query) {
            return NextResponse.json(
                { results: [], error: 'Query parameter "q" is required' },
                { status: 400 }
            );
        }

        // Validate query length
        if (query.trim().length === 0) {
            return NextResponse.json(
                { results: [], error: 'Query cannot be empty' },
                { status: 400 }
            );
        }

        // Get API key from environment
        const apiKey = process.env.LOCATIONIQ_API_KEY;
        if (!apiKey) {
            console.error('LOCATIONIQ_API_KEY environment variable is not set');
            return NextResponse.json(
                { results: [], error: 'Location service is not configured' },
                { status: 500 }
            );
        }

        // Build LocationIQ API request
        const params = new URLSearchParams({
            key: apiKey,
            q: query.trim(),
            limit: limitStr ? Math.min(Math.max(parseInt(limitStr, 10), 1), 20).toString() : '5',
        });

        // Add optional parameters
        if (countrycodes) {
            params.append('countrycodes', countrycodes);
        }
        if (layers) {
            params.append('layers', layers);
        }
        if (acceptLanguage) {
            params.append('accept-language', acceptLanguage);
        }

        const locationiqUrl = `https://api.locationiq.com/v1/autocomplete?${params.toString()}`;

        // Call LocationIQ API
        const response = await fetch(locationiqUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'EatThis-Autocomplete/1.0',
            },
        });

        if (!response.ok) {
            console.error(
                `LocationIQ API error: ${response.status} ${response.statusText}`,
                await response.text()
            );

            // Handle rate limiting
            if (response.status === 429) {
                return NextResponse.json(
                    { results: [], error: 'Too many requests. Please try again later.' },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                { results: [], error: 'Failed to fetch location suggestions' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Validate response format
        if (!Array.isArray(data)) {
            console.error('Unexpected LocationIQ response format:', data);
            return NextResponse.json(
                { results: [], error: 'Invalid response from location service' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            results: data as LocationIQResult[],
        });
    } catch (error) {
        console.error('Autocomplete API error:', error);
        return NextResponse.json(
            { results: [], error: 'An error occurred while fetching suggestions' },
            { status: 500 }
        );
    }
}

/**
 * Security notes:
 * 1. API key is stored in LOCATIONIQ_API_KEY environment variable (server-side only)
 * 2. Browser never sees the actual API key
 * 3. Rate limiting should be implemented at the reverse proxy/edge level
 * 4. Consider adding:
 *    - Request signing/verification if needed
 *    - Per-user rate limits
 *    - Logging of requests for monitoring
 *    - CORS configuration as needed
 */