'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { SLIDES, type Slide } from '@/components/ProteinGuideSlides';

const GoodMeatReplica: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const slides = SLIDES;

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.deltaY > 0 && currentSlide < slides.length - 1) {
                setCurrentSlide(currentSlide + 1);
            } else if (e.deltaY < 0 && currentSlide > 0) {
                setCurrentSlide(currentSlide - 1);
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [currentSlide, slides.length]);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown' && currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else if (e.key === 'ArrowUp' && currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide, slides.length]);

    const slide = slides[currentSlide];

    return (
        <div className="w-full">
            {/* Slides Container */}
            <div className="relative w-full h-screen">
                {slides.map((s, idx) => (
                    <div
                        key={s.id}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                        style={{ backgroundColor: s.backgroundColor }}
                    >
                        {/* Background Media (for image/video only) */}
                        {s.mediaType !== 'instagram' && (
                            <div className="absolute inset-0 overflow-hidden">
                                {s.mediaType === 'image' ? (
                                    <img
                                        src={s.mediaUrl}
                                        alt={s.title}
                                        className="w-full h-full object-cover opacity-30"
                                    />
                                ) : (
                                    <video
                                        src={s.mediaUrl}
                                        autoPlay
                                        muted
                                        loop
                                        className="w-full h-full object-cover opacity-30"
                                    />
                                )}
                            </div>
                        )}

                        {/* Content - Layout changes for Instagram */}
                        <div className={`relative z-10 h-full flex items-center justify-center pt-16 ${s.mediaType === 'instagram' ? 'flex-row gap-8' : ''
                            }`}>
                            <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${s.layout === 'left' ? 'text-left w-1/2' :
                                    s.layout === 'right' ? 'text-right w-1/2 ml-auto' :
                                        'text-center w-full'
                                }`}>
                                <h1
                                    className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                                    style={{ color: s.textColor }}
                                >
                                    {s.title}
                                </h1>
                                <p
                                    className="text-lg sm:text-xl mb-8 opacity-90"
                                    style={{ color: s.textColor }}
                                >
                                    {s.subtitle}
                                </p>
                                <a
                                    href={s.ctaLink}
                                    className="inline-block px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                                    style={{
                                        backgroundColor: s.textColor === '#fff' ? '#fff' : '#000',
                                        color: s.textColor === '#fff' ? '#000' : '#fff'
                                    }}
                                >
                                    {s.cta}
                                </a>
                            </div>

                            {/* Instagram Embed - appears on right side for Instagram slides */}
                            {s.mediaType === 'instagram' && (
                                <div className="w-1/2 h-full flex items-center justify-center overflow-hidden">
                                    <div className="aspect-video" style={{ width: 'auto', maxHeight: '100%' }}>
                                        <iframe
                                            src={`https://www.instagram.com/p/${s.mediaUrl}/embed/`}
                                            width="400"
                                            height="710"
                                            style={{
                                                pointerEvents: 'auto'
                                            }}
                                            frameBorder="0"
                                            scrolling="no"
                                            allowTransparency
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Scroll Indicator (only on first slide) */}
                        {idx === 0 && (
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                                <ChevronDown size={32} style={{ color: s.textColor }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Slide Indicators */}
            <div className="fixed bottom-8 right-8 z-10 flex flex-col gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-black w-8' : 'bg-gray-400'
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Slide Counter */}
            <div className="fixed bottom-8 left-8 z-20 text-sm text-gray-600">
                {currentSlide + 1} / {slides.length}
            </div>
        </div>
    );
};

export default GoodMeatReplica;