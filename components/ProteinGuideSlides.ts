export interface SlideCard {
    src: string;
    alt: string;
}

export interface Slide {
    id: string;
    title: string;
    subtitle: string;
    cta: string;
    ctaLink: string;
    backgroundColor: string;
    mediaType: 'image' | 'video' | 'instagram' | 'carousel';
    mediaUrl: string;
    textColor: string;
    layout: 'left' | 'right' | 'center';
    cards?: SlideCard[];
    // Photographic images cycled (crossfade) behind a carousel slide.
    backgroundShuffle?: string[];
}

// Emphasis: whole, unprocessed plant proteins first. Cell-cultivated is a single
// slide near the end framed as an emerging option, and Wendy's Instagram closes
// the deck. Non-card images are Unsplash placeholders for now.
export const SLIDES: Slide[] = [
    {
        id: 'intro',
        title: 'Protein Guide',
        subtitle: "Get ready to have your mind blown and explore a world of plant-based possibility you didn't dream of.",
        cta: 'Start scrolling',
        ctaLink: '#',
        backgroundColor: '#f5f5f5',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80',
        textColor: '#000',
        layout: 'left'
    },
    {
        id: 'tofu',
        title: 'This is all TOFU!',
        subtitle: 'Delicious, minimally-processed, endlessly versatile — big thinkers use tofu for chocolate mousse all the way to crispy "chicken" nuggets.',
        cta: 'Learn more with Wendy',
        ctaLink: 'https://www.instagram.com/wendythefoodscientist/',
        backgroundColor: '#1a1a1a',
        mediaType: 'carousel',
        mediaUrl: '/protein-guide/tofu/tofu_aubergine.webp',
        textColor: '#fff',
        layout: 'center',
        backgroundShuffle: [
            '/protein-guide/tofu/tofu_aubergine.webp',
            '/protein-guide/tofu/kinkifromhokaido.jpg',
            '/protein-guide/tofu/tofu_mousse.jpeg'
        ],
        cards: [
            { src: '/protein-guide/tofu/thaw.png', alt: 'Freeze + thaw tofu, ripped into jagged pieces for crispy "chicken" nuggets' },
            { src: '/protein-guide/tofu/boil.png', alt: 'Boiling and pressing tofu for firm, flavorful lemongrass tofu' },
            { src: '/protein-guide/tofu/mousse.png', alt: 'Silken tofu blended into creamy chocolate mousse and tofu-based sauces' },
            { src: '/protein-guide/tofu/noodles.png', alt: 'Tofu blended with flour and salt to make high-protein tofu noodles' }
        ]
    },
    {
        id: 'legumes',
        title: 'Beans, lentils & chickpeas',
        subtitle: 'The cheapest, least-processed protein there is — roughly 15–18g per cooked cup, fiber included.',
        cta: 'Learn more',
        ctaLink: '#',
        backgroundColor: '#f5f5f5',
        mediaType: 'image',
        mediaUrl: '/protein-guide/beans_lentils.webp',
        textColor: '#000',
        layout: 'right'
    },
    {
        id: 'grains-seeds',
        title: 'Whole grains & seeds',
        subtitle: 'Quinoa, oats, hemp and pumpkin seeds — protein that shows up with fiber and micronutrients.',
        cta: 'Learn more',
        ctaLink: '#',
        backgroundColor: '#ffffff',
        mediaType: 'image',
        mediaUrl: '/protein-guide/wholegrainsandseeds.jpg',
        textColor: '#000',
        layout: 'left'
    },
    {
        id: 'nuts-coconut',
        title: 'Nuts & Coconut',
        subtitle: 'Snackable whole-food protein that has wild applications of creams, cheeses, and even ice cream.',
        cta: 'Learn more',
        ctaLink: '#',
        backgroundColor: '#f5f5f5',
        mediaType: 'image',
        mediaUrl: '/protein-guide/nuts-edamame.jpeg',
        textColor: '#000',
        layout: 'center'
    },
    {
        id: 'cell-cultivated',
        title: 'On the horizon: cell-cultivated',
        subtitle: 'An emerging option — real animal protein grown without slaughter. Not the focus of this guide, but worth watching.',
        cta: 'The frontier',
        ctaLink: '#',
        backgroundColor: '#0a4d2e',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
        textColor: '#fff',
        layout: 'right'
    },
    {
        id: 'wendy',
        title: 'More from Wendy',
        subtitle: 'Follow Wendy the Food Scientist for endless plant-based tofu inspiration.',
        cta: 'Follow on Instagram',
        ctaLink: 'https://www.instagram.com/wendythefoodscientist/',
        backgroundColor: '#1a1a1a',
        mediaType: 'instagram',
        mediaUrl: 'Da3TVFTIDTz',
        textColor: '#fff',
        layout: 'center'
    }
];
