import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface CarouselProps {
    items: string[];
}

const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('youtube.com') || url.includes('youtu.be');
};

const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const Carousel = ({ items }: CarouselProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!items || items.length === 0) return null;

    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const renderItem = (url: string) => {
        const youtubeId = getYoutubeId(url);

        if (youtubeId) {
            return (
                <iframe
                    className="w-full h-full object-cover pointer-events-auto"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            );
        }

        if (isVideo(url)) {
            return (
                <video
                    src={url}
                    className="w-full h-full object-contain bg-black"
                    controls
                    onClick={(e) => e.stopPropagation()}
                />
            );
        }

        return (
            <img
                src={url}
                alt="Gallery item"
                className="w-full h-full object-contain"
            />
        );
    };

    return (
        <div className="relative w-full mb-6 bg-black/50 border border-cyan-900/50 rounded-lg overflow-hidden group pb-[56.25%]">
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                {renderItem(items[currentIndex])}
            </div>

            {items.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full hover:bg-cyan-500/50 transition-colors opacity-0 group-hover:opacity-100 z-10"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 text-white rounded-full hover:bg-cyan-500/50 transition-colors opacity-0 group-hover:opacity-100 z-10"
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {items.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-cyan-500' : 'bg-white/30'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
