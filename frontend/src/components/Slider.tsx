import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface Movie {
  id: number;
  name: string;
  description: string;
  backdrop: string;
  poster: string;
}

export default function Slider({ movies, autoplay = true, intervalMs = 6000 }: { movies: Movie[], autoplay?: boolean, intervalMs?: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (movies.length === 0 || !autoplay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [movies, autoplay, intervalMs]);

  if (movies.length === 0) return null;

  const currentMovie = movies[currentIndex];

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % movies.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);

  return (
    <div className="slider-container">
      <div 
        className="slider-bg" 
        style={{ backgroundImage: `url(${currentMovie.backdrop || currentMovie.poster})` }}
      />
      <div className="slider-overlay" />
      
      <div className="container slider-content">
        <div className="slider-info">
          <h1 style={{ borderLeft: '5px solid var(--accent)', paddingLeft: '16px', marginBottom: '16px', lineHeight: 1.1 }}>
            {currentMovie.name}
          </h1>
          <p className="slider-desc">{currentMovie.description?.substring(0, 160)}...</p>
          <div className="slider-actions">
            <Link to={`/movie/${currentMovie.id}`} className="btn-primary">
              <Play size={18} fill="currentColor" /> {t('slider_watch_trailer', 'Assistir Trailer')}
            </Link>
            <Link to={`/movie/${currentMovie.id}`} className="btn-secondary">
              <Info size={18} /> {t('slider_more_info', 'Mais Informações')}
            </Link>
          </div>
        </div>
      </div>

      <button className="slider-btn left" onClick={prevSlide}><ChevronLeft size={32} /></button>
      <button className="slider-btn right" onClick={nextSlide}><ChevronRight size={32} /></button>

      <div className="slider-indicators">
        {movies.map((_, idx) => (
          <div 
            key={idx} 
            className={`indicator ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
}
