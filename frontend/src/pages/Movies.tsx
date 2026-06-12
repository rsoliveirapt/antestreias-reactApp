import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film, SlidersHorizontal, AlignLeft, Grid, LayoutGrid, List, ChevronDown, ChevronUp, Check, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { API_BASE, PLACEHOLDER_IMG } from '../config';

const extractSlogan = (html: string) => {
  if (!html) return '';
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  let text = tempDiv.textContent || tempDiv.innerText || "";
  if (text.length > 120) return text.substring(0, 120) + '...';
  return text;
};

interface Media {
  id: number;
  name: string;
  original_title?: string;
  slug: string;
  description?: string;
  poster: string;
  backdrop?: string;
  release_date?: string;
  tmdb_vote_average?: number;
  local_vote_average?: number;
  type: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  genre?: string;
  country?: string;
  language?: string;
  certification?: string;
  created_at?: string;
  popularity?: number;
}

export default function Movies() {
  const { hasPermission } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const [movies, setMovies] = useState<Media[]>(() => {
    try {
      const saved = localStorage.getItem(`movies_list_${currentLanguage}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return localStorage.getItem(`movies_list_${currentLanguage}`) === null;
    } catch {
      return true;
    }
  });

  // Dropdown visibility
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Active settings
  const [sortBy, setSortBy] = useState('popularity'); // popularity, created_at, rating, budget, revenue
  const [viewMode, setViewMode] = useState('grid'); // grid, landscape, list
  const [openAccordion, setOpenAccordion] = useState<string | null>('genres');

  // Filter state
  const [filters, setFilters] = useState({
    genres: [] as string[],
    releaseYears: [] as string[],
    minRating: 0,
    runtime: [] as string[],
    languages: [] as string[],
    countries: [] as string[],
    certifications: [] as string[],
    budget: [] as string[],
    revenue: [] as string[]
  });

  useEffect(() => {
    fetch(`${API_BASE}/movies.php?lang=${currentLanguage}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((d: any) => d.type === 'movie');
        setMovies(filtered);
        try {
          localStorage.setItem(`movies_list_${currentLanguage}`, JSON.stringify(filtered));
        } catch (e) {
          console.warn("Failed to write movies cache to localStorage", e);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentLanguage]);

  const toggleSort = () => { setShowSortDropdown(!showSortDropdown); setShowFilterDropdown(false); setShowViewDropdown(false); };
  const toggleFilter = () => { setShowFilterDropdown(!showFilterDropdown); setShowSortDropdown(false); setShowViewDropdown(false); };
  const toggleView = () => { setShowViewDropdown(!showViewDropdown); setShowSortDropdown(false); setShowFilterDropdown(false); };

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'popularity': return t('sort_popularity', 'Mais populares');
      case 'created_at': return t('sort_recently_added', 'Adicionados recentemente');
      case 'rating': return t('sort_best_rating', 'Melhor avaliação');
      case 'budget': return t('sort_biggest_budget', 'Maior orçamento');
      case 'revenue': return t('sort_biggest_revenue', 'Maior receita');
      default: return t('sort_popularity', 'Mais populares');
    }
  };

  const toggleFilterOption = (category: keyof typeof filters, value: any) => {
    setFilters(prev => {
      const current = prev[category] as any[];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      genres: [],
      releaseYears: [],
      minRating: 0,
      runtime: [],
      languages: [],
      countries: [],
      certifications: [],
      budget: [],
      revenue: []
    });
  };

  const availableGenres = Array.from(new Set(movies.flatMap(m => (m.genre || '').split(',')).map(g => g.trim()).filter(Boolean)));
  const availableLanguages = Array.from(new Set(movies.map(m => m.language || '').filter(Boolean)));
  const availableCountries = Array.from(new Set(movies.map(m => m.country || '').filter(Boolean)));
  const availableCertifications = Array.from(new Set(movies.map(m => m.certification || '').filter(Boolean)));

  const filteredMovies = movies.filter(m => {
    // Genres
    if (filters.genres.length > 0) {
      const mGenres = (m.genre || '').toLowerCase();
      if (!filters.genres.some(g => mGenres.includes(g.toLowerCase()))) return false;
    }
    // Release Years
    if (filters.releaseYears.length > 0) {
      const year = new Date(m.release_date || '').getFullYear();
      const match = filters.releaseYears.some(y => {
        if (y === '2020 e anterior') return year <= 2020;
        return year.toString() === y;
      });
      if (!match) return false;
    }
    // Min Rating
    if (filters.minRating > 0) {
      if ((m.local_vote_average || m.tmdb_vote_average || 0) < filters.minRating) return false;
    }
    // Runtime
    if (filters.runtime.length > 0) {
      const rt = m.runtime || 0;
      const match = filters.runtime.some(r => {
        if (r === '< 90 min') return rt > 0 && rt < 90;
        if (r === '90 - 120 min') return rt >= 90 && rt <= 120;
        if (r === '> 120 min') return rt > 120;
        return false;
      });
      if (!match) return false;
    }
    // Languages
    if (filters.languages.length > 0) {
      const mLang = (m.language || '').toLowerCase();
      if (!filters.languages.some(l => mLang.includes(l.toLowerCase()))) return false;
    }
    // Countries
    if (filters.countries.length > 0) {
      const mCountry = (m.country || '').toLowerCase();
      if (!filters.countries.some(c => mCountry.includes(c.toLowerCase()))) return false;
    }
    // Certifications
    if (filters.certifications.length > 0) {
      const mCert = (m.certification || '').toLowerCase();
      if (!filters.certifications.some(c => mCert === c.toLowerCase())) return false;
    }
    // Budget
    if (filters.budget.length > 0) {
      const bg = m.budget || 0;
      const match = filters.budget.some(b => {
        if (b === '< $50M') return bg > 0 && bg < 50000000;
        if (b === '$50M - $100M') return bg >= 50000000 && bg <= 100000000;
        if (b === '> $100M') return bg > 100000000;
        return false;
      });
      if (!match) return false;
    }
    // Revenue
    if (filters.revenue.length > 0) {
      const rev = m.revenue || 0;
      const match = filters.revenue.some(r => {
        if (r === '< $100M') return rev > 0 && rev < 100000000;
        if (r === '$100M - $500M') return rev >= 100000000 && rev <= 500000000;
        if (r === '> $500M') return rev > 500000000;
        return false;
      });
      if (!match) return false;
    }
    return true;
  });

  const sortedMovies = [...filteredMovies].sort((a, b) => {
    if (sortBy === 'popularity') return (b.popularity || 0) - (a.popularity || 0);
    if (sortBy === 'created_at') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (sortBy === 'rating') return (b.tmdb_vote_average || 0) - (a.tmdb_vote_average || 0);
    if (sortBy === 'budget') return (b.budget || 0) - (a.budget || 0);
    if (sortBy === 'revenue') return (b.revenue || 0) - (a.revenue || 0);
    return 0;
  });

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  if (!hasPermission('view_titles')) {
    return (
      <div className="container" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, marginBottom: 15 }}>{t('home_restricted_access', 'Acesso Restrito')}</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          {t('movies_restricted_desc', 'Lamentamos, mas a tua conta não tem permissão para visualizar o catálogo de Filmes.')}
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '100px', paddingTop: '100px' }}>
      <style>{`
        .movies-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 40px;
        }
        .movies-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }
        .dropdown-btn {
          background: transparent;
          border: none;
          color: white;
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .dropdown-btn:hover {
          color: var(--accent);
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          margin-top: 8px;
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          z-index: 100;
          box-shadow: 0 20px 40px rgba(0,0,0,0.8);
          animation: fadeIn 0.2s ease;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .dropdown-item.active {
          background: rgba(229, 9, 21, 0.1);
          color: var(--accent);
          font-weight: 600;
        }
        
        /* New Grid View */
        .movies-grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 30px;
        }
        .movie-card-clean {
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
          text-decoration: none;
        }
        .movie-card-clean:hover {
          transform: translateY(-6px);
        }
        .movie-poster-container {
          position: relative;
          aspect-ratio: 2/3;
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg-secondary);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        .movie-poster-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .movie-card-clean:hover .movie-poster-container img {
          transform: scale(1.05);
        }
        .play-overlay {
          position: absolute;
          bottom: 16px;
          left: 16px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.3s ease;
          opacity: 0.8;
        }
        .movie-card-clean:hover .play-overlay {
          background: var(--accent);
          border-color: var(--accent);
          opacity: 1;
          transform: scale(1.1);
        }
        
        /* Landscape View */
        .movies-landscape-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
          gap: 30px;
        }
        .landscape-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
          text-decoration: none;
        }
        .landscape-card:hover {
          transform: translateY(-6px);
        }
        .landscape-image-container {
          position: relative;
          aspect-ratio: 16/9;
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg-secondary);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        .landscape-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .landscape-card:hover .landscape-image-container img {
          transform: scale(1.05);
        }
        
        /* List View */
        .movies-list-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .list-card {
          display: flex;
          gap: 24px;
          background: transparent;
          border: none;
          padding: 20px 0;
          cursor: pointer;
          transition: transform 0.2s ease;
          align-items: flex-start;
          text-decoration: none;
        }
        .list-card:hover {
          transform: translateX(6px);
        }
        .list-poster {
          width: 140px;
          min-width: 140px;
          aspect-ratio: 2/3;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 16px rgba(0,0,0,0.4);
        }
        .list-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        /* Filter Accordion */
        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }
        .accordion-header:hover {
          color: var(--accent);
        }
        .accordion-body {
          padding: 12px 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 220px;
          overflow-y: auto;
        }
        .filter-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .filter-checkbox:hover {
          color: white;
        }
        .filter-checkbox input[type="checkbox"] {
          accent-color: var(--accent);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
      `}</style>

      <div className="movies-header-bar">
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ width: '4px', height: '32px', background: 'var(--accent)', borderRadius: '2px' }}></span>
            {t('nav_movies', 'Filmes')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginLeft: '19px' }}>{t('movies_desc', 'Explora todos os títulos de cinema disponíveis.')}</p>
        </div>

        <div className="movies-actions">
          {/* Sort Dropdown */}
          <div style={{ position: 'relative' }}>
            <button className="dropdown-btn" onClick={toggleSort}>
              <AlignLeft size={16} /> {getSortLabel(sortBy)}
            </button>
            {showSortDropdown && (
              <div className="dropdown-menu" style={{ right: 0, width: 240 }}>
                {[
                  { key: 'popularity', label: t('sort_popularity', 'Mais populares') },
                  { key: 'created_at', label: t('sort_recently_added', 'Adicionados recentemente') },
                  { key: 'rating', label: t('sort_best_rating', 'Melhor avaliação') },
                  { key: 'budget', label: t('sort_biggest_budget', 'Maior orçamento') },
                  { key: 'revenue', label: t('sort_biggest_revenue', 'Maior receita') }
                ].map(opt => (
                  <div 
                    key={opt.key} 
                    className={`dropdown-item ${sortBy === opt.key ? 'active' : ''}`}
                    onClick={() => { setSortBy(opt.key); setShowSortDropdown(false); }}
                  >
                    {sortBy === opt.key ? <Check size={16} color="var(--accent)" /> : <div style={{ width: 16 }} />}
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <button className="dropdown-btn" onClick={toggleFilter}>
              <SlidersHorizontal size={16} /> {t('filter_title', 'Filtros')}
            </button>
            {showFilterDropdown && (
              <div className="dropdown-menu" style={{ right: 0, width: 320 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }} onClick={clearFilters}>
                    {t('filter_clear', 'Limpar')}
                  </button>
                  <span style={{ fontWeight: 700, fontSize: 16, color: 'white' }}>{t('filter_title', 'Filtros')}</span>
                  <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 13, borderRadius: 6 }} onClick={() => setShowFilterDropdown(false)}>
                    {t('filter_apply', 'Aplicar')}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Genres */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'genres' ? null : 'genres')}>
                      <span>{t('filter_genres', 'Géneros')}</span>
                      {openAccordion === 'genres' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'genres' && (
                      <div className="accordion-body">
                        {availableGenres.map(genre => (
                          <label key={genre} className="filter-checkbox">
                            <input 
                              type="checkbox" 
                              checked={filters.genres.includes(genre)}
                              onChange={() => toggleFilterOption('genres', genre)}
                            />
                            {genre}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Release Date */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'releaseYears' ? null : 'releaseYears')}>
                      <span>{t('filter_release_year', 'Ano de lançamento')}</span>
                      {openAccordion === 'releaseYears' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'releaseYears' && (
                      <div className="accordion-body">
                        {['2026', '2025', '2024', '2023', '2022', '2021', t('filter_year_older', '2020 e anterior')].map(year => (
                          <label key={year} className="filter-checkbox">
                            <input 
                              type="checkbox" 
                              checked={filters.releaseYears.includes(year)}
                              onChange={() => toggleFilterOption('releaseYears', year)}
                            />
                            {year}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* User Rating */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'minRating' ? null : 'minRating')}>
                      <span>{t('media_rating', 'Avaliação')}</span>
                      {openAccordion === 'minRating' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'minRating' && (
                      <div className="accordion-body" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {[0, 5, 6, 7, 8, 9].map(rate => (
                          <button 
                            key={rate} 
                            style={{ 
                              background: filters.minRating === rate ? 'var(--accent)' : 'rgba(255,255,255,0.05)', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              color: 'white', 
                              padding: '6px 12px', 
                              borderRadius: 6, 
                              fontSize: 13, 
                              cursor: 'pointer' 
                            }}
                            onClick={() => setFilters({ ...filters, minRating: rate })}
                          >
                            {rate === 0 ? t('filter_rating_any', 'Qualquer') : `${rate}+ ★`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Runtime */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'runtime' ? null : 'runtime')}>
                      <span>{t('media_duration', 'Duração')}</span>
                      {openAccordion === 'runtime' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'runtime' && (
                      <div className="accordion-body">
                        {['< 90 min', '90 - 120 min', '> 120 min'].map(rt => (
                          <label key={rt} className="filter-checkbox">
                            <input 
                              type="checkbox" 
                              checked={filters.runtime.includes(rt)}
                              onChange={() => toggleFilterOption('runtime', rt)}
                            />
                            {rt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Original Language */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'languages' ? null : 'languages')}>
                      <span>{t('filter_original_language', 'Idioma original')}</span>
                      {openAccordion === 'languages' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'languages' && (
                      <div className="accordion-body">
                        {availableLanguages.map(lang => (
                          <label key={lang} className="filter-checkbox">
                            <input 
                              type="checkbox" 
                              checked={filters.languages.includes(lang)}
                              onChange={() => toggleFilterOption('languages', lang)}
                            />
                            {lang}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Production Countries */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'countries' ? null : 'countries')}>
                      <span>{t('filter_production_countries', 'Países de produção')}</span>
                      {openAccordion === 'countries' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'countries' && (
                      <div className="accordion-body">
                        {availableCountries.map(country => (
                          <label key={country} className="filter-checkbox">
                            <input 
                              type="checkbox" 
                              checked={filters.countries.includes(country)}
                              onChange={() => toggleFilterOption('countries', country)}
                            />
                            {country}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Age Rating */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'certifications' ? null : 'certifications')}>
                      <span>{t('filter_age_rating', 'Classificação etária')}</span>
                      {openAccordion === 'certifications' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'certifications' && (
                      <div className="accordion-body" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {availableCertifications.map(cert => (
                          <button 
                            key={cert} 
                            style={{ 
                              background: filters.certifications.includes(cert) ? 'var(--accent)' : 'rgba(255,255,255,0.05)', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              color: 'white', 
                              padding: '6px 12px', 
                              borderRadius: 6, 
                              fontSize: 13, 
                              cursor: 'pointer' 
                            }}
                            onClick={() => toggleFilterOption('certifications', cert)}
                          >
                            {cert}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Budget */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'budget' ? null : 'budget')}>
                      <span>{t('filter_budget', 'Orçamento')}</span>
                      {openAccordion === 'budget' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'budget' && (
                      <div className="accordion-body">
                        {['< $50M', '$50M - $100M', '> $100M'].map(bg => (
                          <label key={bg} className="filter-checkbox">
                            <input 
                              type="checkbox" 
                              checked={filters.budget.includes(bg)}
                              onChange={() => toggleFilterOption('budget', bg)}
                            />
                            {bg}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revenue */}
                  <div>
                    <div className="accordion-header" onClick={() => setOpenAccordion(openAccordion === 'revenue' ? null : 'revenue')}>
                      <span>{t('filter_revenue', 'Receita')}</span>
                      {openAccordion === 'revenue' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {openAccordion === 'revenue' && (
                      <div className="accordion-body">
                        {['< $100M', '$100M - $500M', '> $500M'].map(rev => (
                          <label key={rev} className="filter-checkbox">
                            <input 
                              type="checkbox" 
                              checked={filters.revenue.includes(rev)}
                              onChange={() => toggleFilterOption('revenue', rev)}
                            />
                            {rev}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div style={{ position: 'relative' }}>
            <button className="dropdown-btn" onClick={toggleView}>
              {viewMode === 'grid' ? <Grid size={16} /> : viewMode === 'landscape' ? <LayoutGrid size={16} /> : <List size={16} />}
              {viewMode === 'grid' ? t('view_grid', 'Grelha') : viewMode === 'landscape' ? t('view_landscape', 'Paisagem') : t('view_list', 'Lista')}
            </button>
            {showViewDropdown && (
              <div className="dropdown-menu" style={{ right: 0, width: 160 }}>
                {[
                  { key: 'grid', label: t('view_grid', 'Grelha'), icon: <Grid size={16} /> },
                  { key: 'landscape', label: t('view_landscape', 'Paisagem'), icon: <LayoutGrid size={16} /> },
                  { key: 'list', label: t('view_list', 'Lista'), icon: <List size={16} /> }
                ].map(opt => (
                  <div 
                    key={opt.key} 
                    className={`dropdown-item ${viewMode === opt.key ? 'active' : ''}`}
                    onClick={() => { setViewMode(opt.key); setShowViewDropdown(false); }}
                  >
                    {viewMode === opt.key ? <Check size={16} color="var(--accent)" /> : <div style={{ width: 16 }} />}
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {sortedMovies.length > 0 ? (
        <>
          {viewMode === 'grid' && (
            <div className="movie-grid">
              {sortedMovies.map(item => (
                <Link to={`/movie/${item.slug || item.id}`} key={item.id} className="movie-card">
                  <img src={item.poster || PLACEHOLDER_IMG} alt={item.name} />
                  <div className="movie-info">
                    <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ffc800', fontSize: 13, fontWeight: 700 }}>
                        <Star size={12} fill="#ffc800" /> {item.tmdb_vote_average && Number(item.tmdb_vote_average) > 0 ? Number(item.tmdb_vote_average).toFixed(1) : '-'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
                        <Star size={12} fill="var(--accent)" /> {item.local_vote_average && Number(item.local_vote_average) > 0 ? Number(item.local_vote_average).toFixed(1) : '-'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {viewMode === 'landscape' && (
            <div className="movies-landscape-view">
              {sortedMovies.map(item => (
                <Link to={`/movie/${item.slug || item.id}`} key={item.id} className="review-card-cinematic">
                  <div className="card-clip-box">
                    <img className="bg-img" src={item.backdrop || item.poster || PLACEHOLDER_IMG} alt={item.name} />
                    
                    <div className="card-overlay">
                      {item.local_vote_average && Number(item.local_vote_average) > 0 && (
                        <div style={{ 
                          position: 'absolute', top: 20, right: 20, 
                          background: 'var(--accent)', 
                          padding: '6px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, 
                          boxShadow: '0 8px 20px rgba(229, 9, 21, 0.4)',
                          pointerEvents: 'auto'
                        }}>
                          <Star size={16} fill="white" /> 
                          <span style={{ fontSize: 18, fontWeight: 800 }}>
                            {Number(item.local_vote_average).toFixed(1)}
                          </span>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', pointerEvents: 'auto' }}>
                        <div>
                          <h3 style={{ 
                            fontSize: 26, fontWeight: 800, margin: '0 0 8px', 
                            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {item.name}
                          </h3>
                          <p style={{ 
                            fontSize: 15, color: 'rgba(255,255,255,0.9)', margin: '0 0 15px 0',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            lineHeight: 1.5, textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                          }}>
                            "{extractSlogan(item.description || '')}"
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            {item.release_date && (
                              <span style={{ 
                                fontSize: 13, background: 'rgba(255,255,255,0.1)', 
                                padding: '4px 12px', borderRadius: 6, color: 'white', fontWeight: 600
                              }}>
                                {new Date(item.release_date).getFullYear()}
                              </span>
                            )}
                            {item.runtime && item.runtime > 0 ? (
                              <span style={{ 
                                fontSize: 13, background: 'rgba(255,255,255,0.1)', 
                                padding: '4px 12px', borderRadius: 6, color: 'white', fontWeight: 600
                              }}>
                                {Math.floor(item.runtime / 60)}h {item.runtime % 60}m
                              </span>
                            ) : null}
                            {item.certification && (
                              <span style={{ 
                                fontSize: 13, background: 'rgba(255,255,255,0.1)', 
                                padding: '4px 12px', borderRadius: 6, color: 'white', fontWeight: 600
                              }}>
                                {item.certification}
                              </span>
                            )}
                            {item.tmdb_vote_average && Number(item.tmdb_vote_average) > 0 ? (
                              <span style={{ 
                                fontSize: 13, background: 'rgba(255,255,255,0.1)', 
                                padding: '4px 12px', borderRadius: 6, color: 'white', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 4
                              }}>
                                <Star size={12} fill="#ffc800" color="#ffc800" /> TMDB {Number(item.tmdb_vote_average).toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="movies-list-view">
              {sortedMovies.map(item => (
                <Link to={`/movie/${item.slug || item.id}`} key={item.id} className="list-card">
                  <div className="list-poster">
                    <img src={item.poster || PLACEHOLDER_IMG} alt={item.name} />
                    <div className="play-overlay">
                      <Play size={18} fill="white" color="white" style={{ marginLeft: 2 }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 6 }}>
                      {item.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {item.runtime && item.runtime > 0 ? (
                        <span>{Math.floor(item.runtime / 60)}h {item.runtime % 60}m</span>
                      ) : null}
                      {item.certification && (
                        <span>• {item.certification}</span>
                      )}
                      {item.release_date && (
                        <span>• {new Date(item.release_date).getFullYear()}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      {item.local_vote_average && Number(item.local_vote_average) > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 15, fontWeight: 700 }}>
                          <Star size={16} fill="var(--accent)" /> {Number(item.local_vote_average).toFixed(1)} / 10
                        </span>
                      )}
                      {item.tmdb_vote_average && Number(item.tmdb_vote_average) > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ffc800', fontSize: 15, fontWeight: 700 }}>
                          <Star size={16} fill="#ffc800" /> TMDB {Number(item.tmdb_vote_average).toFixed(1)} / 10
                        </span>
                      )}
                      {(!item.local_vote_average || Number(item.local_vote_average) === 0) && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star size={14} /> {t('rate_title', 'Avaliar')}
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description || t('media_no_synopsis', 'Nenhuma sinopse disponível para este título.')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
          <Film size={60} style={{ margin: '0 auto 20px' }} />
          <h3>{t('movies_none_found', 'Nenhum filme encontrado.')}</h3>
          <button className="btn-secondary" style={{ marginTop: 20 }} onClick={clearFilters}>
            {t('filter_clear_filters', 'Limpar Filtros')}
          </button>
        </div>
      )}
    </div>
  );
}
