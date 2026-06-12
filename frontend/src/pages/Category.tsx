import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Tag } from 'lucide-react';
import { API_BASE, PLACEHOLDER_IMG } from '../config';
import { useTranslation } from '../context/LanguageContext';

interface Media {
  id: number;
  name: string;
  slug: string;
  poster: string;
  rating: number;
  type: string;
}

interface CategoryType {
  id: number;
  name: string;
  display_name: string;
}

export default function Category() {
  const { slug } = useParams();
  const [titles, setTitles] = useState<Media[]>([]);
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, currentLanguage } = useTranslation();

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/titles_by_category.php?slug=${slug}&lang=${currentLanguage}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCategory(data.category);
          setTitles(data.titles);
          const siteName = localStorage.getItem('site_name') || 'Antestreias';
          document.title = `${siteName} - ${t('category_title_prefix', 'Categoria')}: ${data.category.display_name}`;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, t, currentLanguage]);

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  if (!category) {
    return (
      <div className="container" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, marginBottom: 15 }}>{t('category_not_found', 'Categoria não encontrada')}</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
          {t('category_not_found_desc', 'Lamentamos, mas não conseguimos encontrar a categoria que procuras.')}
        </p>
        <Link to="/" className="btn-primary" style={{ marginTop: 20 }}>{t('btn_back_home', 'Voltar ao Início')}</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '100px', paddingTop: '100px' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ width: '4px', height: '32px', background: 'var(--accent)', borderRadius: '2px' }}></span>
          {category.display_name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginLeft: '19px' }}>
          {t('category_all_titles', 'Todos os títulos na categoria {name}.').replace('{name}', category.display_name)}
        </p>
      </div>

      {titles.length > 0 ? (
        <div className="movie-grid">
          {titles.map(item => (
            <Link to={`/movie/${item.slug || item.id}`} key={item.id} className="movie-card">
              <img src={item.poster || PLACEHOLDER_IMG} alt={item.name} />
              <div className="movie-info">
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {item.type === 'movie' ? t('media_type_movie', 'Filme') : t('media_type_series', 'Série')}
                </div>
                <h3>{item.name}</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={14} fill="var(--accent)" /> {item.rating || 'N/A'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
          <Tag size={60} style={{ marginBottom: 20 }} />
          <h3>{t('category_no_titles', 'Nenhum título encontrado nesta categoria.')}</h3>
        </div>
      )}
    </div>
  );
}
