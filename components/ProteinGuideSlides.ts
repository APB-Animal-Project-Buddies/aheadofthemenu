export interface Slide {
    id: string;
    title: string;
    subtitle: string;
    cta: string;
    ctaLink: string;
    backgroundColor: string;
    mediaType: 'image' | 'video' | 'instagram';
    mediaUrl: string;
    textColor: string;
    layout: 'left' | 'right' | 'center';
}

export const SLIDES: Slide[] = [
    {
        id: 'proteinguide',
        title: 'Protein Guide',
        subtitle: 'A guide to your plant-based daily protein in-take.',
        cta: 'Learn more',
        ctaLink: '#',
        backgroundColor: '#f5f5f5',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
        textColor: '#000',
        layout: 'left'
    },
    {
        id: 'slaughter',
        title: 'This is all TOFU',
        subtitle: 'Various Tofu recipes providing your daily protein',
        cta: 'Check out Wendy\'s IG',
        ctaLink: 'https://www.instagram.com/wendythefoodscientist/',
        backgroundColor: '#1a1a1a',
        mediaType: 'instagram',
        mediaUrl: 'Da3TVFTIDTz',
        textColor: '#fff',
        layout: 'center'
    },
    {
        id: 'harm',
        title: 'We will always eat meat. To share the planet together, we have to do it differently.',
        subtitle: 'Meat without harm.',
        cta: 'Our purpose',
        ctaLink: '#',
        backgroundColor: '#0a4d2e',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
        textColor: '#fff',
        layout: 'right'
    },
    {
        id: 'limits',
        title: 'Engineering a natural and innovative process to grow meat for the world',
        subtitle: 'Meat without limits.',
        cta: 'See our stories',
        ctaLink: '#',
        backgroundColor: '#f5f5f5',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1586985289688-cacf313cc330?w=800&q=80',
        textColor: '#000',
        layout: 'left'
    },
    {
        id: 'us',
        title: 'GOOD Meat in the U.S.',
        subtitle: 'China Chilcano by José Andrés, serving cell-cultivated GOOD Meat for the first time in the US.',
        cta: 'Eat GOOD Meat',
        ctaLink: '#',
        backgroundColor: '#fff',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        textColor: '#000',
        layout: 'center'
    }
];