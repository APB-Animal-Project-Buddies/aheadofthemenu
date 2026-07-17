'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SLIDES, type SlideCard } from '@/components/ProteinGuideSlides';

// Circular carousel of image cards — the active card is always centered, and
// prev/next (and the dots) wrap around from the last card to the first and back.
// Lives inside a vertical scroll-snap section: page scrolls vertically, cards
// cycle horizontally.
const CardCarousel: React.FC<{ cards: SlideCard[] }> = ({ cards }) => {
    const [active, setActive] = useState(0);
    const n = cards.length;
    const go = (dir: number) => setActive((prev) => (prev + dir + n) % n);
    return (
        <div className="relative w-full max-w-3xl">
            <div className="overflow-hidden rounded-2xl">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${active * 100}%)` }}
                >
                    {cards.map((c) => (
                        <img
                            key={c.src}
                            src={c.src}
                            alt={c.alt}
                            loading="lazy"
                            className="w-full shrink-0 rounded-2xl shadow-2xl"
                        />
                    ))}
                </div>
            </div>
            <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous card"
                className="absolute -left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black shadow-lg transition hover:bg-white"
            >
                <ChevronLeft size={22} />
            </button>
            <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next card"
                className="absolute -right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black shadow-lg transition hover:bg-white"
            >
                <ChevronRight size={22} />
            </button>
            <div className="mt-4 flex justify-center gap-2">
                {cards.map((c, i) => (
                    <button
                        key={c.src}
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={`Show card ${i + 1}`}
                        className={`h-2 rounded-full bg-white transition-all ${i === active ? 'w-6' : 'w-2 opacity-50'}`}
                    />
                ))}
            </div>
        </div>
    );
};

// Full-screen vertical deck built on native CSS scroll-snap. Scrolling (wheel,
// trackpad, touch, scrollbar) moves between sections natively — no wheel hijack,
// no focus trap. Arrow/Page keys jump one section; an IntersectionObserver keeps
// the dot indicators + counter in sync with the scroll position.
const ProteinGuide: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const slides = SLIDES;
    const containerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        const root = containerRef.current;
        if (!root) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const idx = Number((entry.target as HTMLElement).dataset.index);
                        if (!Number.isNaN(idx)) setCurrentSlide(idx);
                    }
                });
            },
            { root, threshold: 0.6 }
        );
        slideRefs.current.forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, [slides.length]);

    const scrollToSlide = (idx: number) => {
        const clamped = Math.max(0, Math.min(slides.length - 1, idx));
        slideRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            e.preventDefault();
            scrollToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            e.preventDefault();
            scrollToSlide(currentSlide - 1);
        }
    };

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="h-[calc(100vh-4rem)] w-full overflow-y-scroll snap-y snap-mandatory outline-none"
        >
            {slides.map((s, idx) => (
                <section
                    key={s.id}
                    ref={(el) => { slideRefs.current[idx] = el; }}
                    data-index={idx}
                    className="relative h-[calc(100vh-4rem)] w-full snap-start snap-always overflow-hidden"
                    style={{ backgroundColor: s.backgroundColor }}
                >
                    {/* Background media */}
                    {(s.mediaType === 'image' || s.mediaType === 'carousel') && s.mediaUrl && (
                        <div className="absolute inset-0 overflow-hidden">
                            <img src={s.mediaUrl} alt="" className="w-full h-full object-cover opacity-30" />
                        </div>
                    )}
                    {s.mediaType === 'video' && (
                        <div className="absolute inset-0 overflow-hidden">
                            <video src={s.mediaUrl} autoPlay muted loop className="w-full h-full object-cover opacity-30" />
                        </div>
                    )}

                    {s.mediaType === 'carousel' ? (
                        /* Carousel layout — title up top, cards, then CTA */
                        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-6 px-4 py-10">
                            <div className="text-center max-w-3xl">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight" style={{ color: s.textColor }}>
                                    {s.title}
                                </h1>
                                <p className="text-lg sm:text-xl opacity-90" style={{ color: s.textColor }}>
                                    {s.subtitle}
                                </p>
                            </div>
                            {s.cards && <CardCarousel cards={s.cards} />}
                            <a
                                href={s.ctaLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block px-8 py-3 rounded-lg font-semibold bg-white text-black transition-all hover:scale-105"
                            >
                                {s.cta}
                            </a>
                        </div>
                    ) : (
                        /* Generic layout — text (+ Instagram embed on the right for IG slides) */
                        <div className={`relative z-10 h-full flex items-center justify-center ${s.mediaType === 'instagram' ? 'flex-row gap-8' : ''}`}>
                            <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${s.layout === 'left' ? 'text-left w-1/2' :
                                s.layout === 'right' ? 'text-right w-1/2 ml-auto' :
                                    'text-center w-full'
                                }`}>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: s.textColor }}>
                                    {s.title}
                                </h1>
                                <p className="text-lg sm:text-xl mb-8 opacity-90" style={{ color: s.textColor }}>
                                    {s.subtitle}
                                </p>
                                <a
                                    href={s.ctaLink}
                                    target={s.mediaType === 'instagram' ? '_blank' : undefined}
                                    rel={s.mediaType === 'instagram' ? 'noreferrer' : undefined}
                                    className="inline-block px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                                    style={{
                                        backgroundColor: s.textColor === '#fff' ? '#fff' : '#000',
                                        color: s.textColor === '#fff' ? '#000' : '#fff'
                                    }}
                                >
                                    {s.cta}
                                </a>
                            </div>

                            {s.mediaType === 'instagram' && (
                                <div className="w-1/2 h-full flex items-center justify-center overflow-hidden">
                                    <div className="aspect-video" style={{ width: 'auto', maxHeight: '100%' }}>
                                        <iframe
                                            title={s.title}
                                            src={`https://www.instagram.com/p/${s.mediaUrl}/embed/`}
                                            width="400"
                                            height="710"
                                            frameBorder="0"
                                            scrolling="no"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Scroll hint on the first slide — click to advance */}
                    {idx === 0 && (
                        <button
                            type="button"
                            onClick={() => scrollToSlide(1)}
                            aria-label="Scroll to next section"
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce cursor-pointer"
                        >
                            <ChevronDown size={32} style={{ color: s.textColor }} />
                        </button>
                    )}
                </section>
            ))}

            {/* Slide indicators — mix-blend keeps them visible on light and dark slides */}
            <div className="fixed bottom-8 right-8 z-30 flex flex-col gap-2 mix-blend-difference">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => scrollToSlide(idx)}
                        className={`h-2 rounded-full bg-white transition-all ${idx === currentSlide ? 'w-8' : 'w-2 opacity-50'}`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Slide counter */}
            <div className="fixed bottom-8 left-8 z-30 text-sm text-white mix-blend-difference">
                {currentSlide + 1} / {slides.length}
            </div>
        </div>
    );
};

export default ProteinGuide;
