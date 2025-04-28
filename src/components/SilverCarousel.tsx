import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface CarouselItem {
  image: string;
  title: string;
  description: string;
}

interface SilverCarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number;
  theme?: string;
}

export const SilverCarousel: React.FC<SilverCarouselProps> = ({ 
  items, 
  autoPlayInterval = 5000, 
  theme = 'silver'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }
  };

  const goToPrev = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    }
  };

  const goToSlide = (index: number) => {
    if (!isTransitioning && index !== currentIndex) {
      setIsTransitioning(true);
      setCurrentIndex(index);
    }
  };

  // Handle auto play
  useEffect(() => {
    if (autoPlayInterval > 0) {
      timerRef.current = setInterval(goToNext, autoPlayInterval);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [autoPlayInterval]);

  // Reset transition state after animation completes
  useEffect(() => {
    const transitionTimer = setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // Match this with the CSS transition duration

    return () => clearTimeout(transitionTimer);
  }, [currentIndex]);

  // Pause autoplay on hover
  const pauseAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Resume autoplay when mouse leaves
  const resumeAutoPlay = () => {
    if (autoPlayInterval > 0 && !timerRef.current) {
      timerRef.current = setInterval(goToNext, autoPlayInterval);
    }
  };

  return (
    <div 
      className="relative w-full overflow-hidden rounded-xl"
      style={{ 
        height: '400px',
        boxShadow: '0 8px 32px rgba(14, 31, 53, 0.1), 0 4px 16px rgba(0, 169, 224, 0.15)',
        border: '1px solid rgba(201, 204, 207, 0.5)'
      }}
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
    >
      {/* Slides container */}
      <div 
        className="flex h-full transition-transform duration-600 ease-in-out"
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: 'transform 0.6s ease-in-out'
        }}
      >
        {items.map((item, index) => (
          <div 
            key={index} 
            className="relative flex-shrink-0 w-full h-full"
            style={{ 
              background: `linear-gradient(rgba(14, 31, 53, 0.5), rgba(14, 31, 53, 0.7)), url(${item.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <h3 
                className="text-2xl font-bold mb-4"
                style={{ 
                  color: '#ffffff',
                  textShadow: '0 0 10px rgba(0, 169, 224, 0.7)'
                }}
              >
                {item.title}
              </h3>
              <p 
                className="max-w-lg text-md"
                style={{ 
                  color: '#ffffff',
                  textShadow: '0 0 5px rgba(0, 169, 224, 0.5)'
                }}
              >
                {item.description}
              </p>
            </div>
            
            {/* Futuristic overlay elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {/* Top edge highlight */}
              <div 
                className="absolute top-0 left-0 w-full h-px"
                style={{ 
                  background: 'linear-gradient(90deg, transparent, rgba(0, 169, 224, 0.7), transparent)',
                  boxShadow: '0 0 8px rgba(0, 169, 224, 0.5)'
                }}
              />
              
              {/* Corner accent */}
              <div 
                className="absolute top-0 left-0 w-20 h-20"
                style={{ 
                  borderTop: '2px solid rgba(0, 169, 224, 0.7)',
                  borderLeft: '2px solid rgba(0, 169, 224, 0.7)',
                  boxShadow: '0 0 10px rgba(0, 169, 224, 0.3)'
                }}
              />
              
              {/* Bottom right corner accent */}
              <div 
                className="absolute bottom-0 right-0 w-20 h-20"
                style={{ 
                  borderBottom: '2px solid rgba(0, 169, 224, 0.7)',
                  borderRight: '2px solid rgba(0, 169, 224, 0.7)',
                  boxShadow: '0 0 10px rgba(0, 169, 224, 0.3)'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation arrows */}
      <button 
        onClick={goToPrev}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full hover:bg-black/30 transition-colors"
        style={{ 
          backgroundColor: 'rgba(176, 180, 185, 0.3)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(201, 204, 207, 0.3)'
        }}
      >
        <FaChevronLeft 
          className="text-xl" 
          style={{ 
            color: '#E3E5E7',
            filter: 'drop-shadow(0 0 3px rgba(0, 169, 224, 0.5))'
          }}
        />
      </button>
      
      <button 
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full hover:bg-black/30 transition-colors"
        style={{ 
          backgroundColor: 'rgba(176, 180, 185, 0.3)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(201, 204, 207, 0.3)'
        }}
      >
        <FaChevronRight 
          className="text-xl" 
          style={{ 
            color: '#E3E5E7',
            filter: 'drop-shadow(0 0 3px rgba(0, 169, 224, 0.5))'
          }}
        />
      </button>
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-6' : 'w-2'
            }`}
            style={
              index === currentIndex
                ? {
                    backgroundColor: 'rgba(0, 169, 224, 0.9)',
                    boxShadow: '0 0 8px rgba(0, 169, 224, 0.7)',
                  }
                : {
                    backgroundColor: 'rgba(201, 204, 207, 0.5)',
                  }
            }
          />
        ))}
      </div>
    </div>
  );
};

export default SilverCarousel;
