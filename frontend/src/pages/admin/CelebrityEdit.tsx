import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, ExternalLink, Calendar, MapPin, Star, Film, RefreshCw } from 'lucide-react';
import { showToast } from '../../components/Toast';

import { API_BASE, apiFetch, PLACEHOLDER_IMG } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

export default function AdminCelebrityEdit() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isNew = id === 'new';

  const fetchCelebrity = async () => {
    if (isNew) {
      setData({
        person: {
          name: '',
          poster: '',
          biography: '',
          birthday: '',
          place_of_birth: '',
          popularity: 0,
          imdb_id: '',
          slug: '',
          tmdb_id: ''
        },
        credits: []
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_people.php?id=${id}`, { credentials: 'include' });
      const d = await res.json();
      setData(d);
    } catch (err) { 
      console.error('Fetch error:', err);
      showToast('Erro ao carregar celebridade.', 'error'); 
    }
    setLoading(false);
  };

  useEffect(() => { fetchCelebrity(); }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.person.name.trim()) {
      showToast('O nome é obrigatório.', 'error');
      return;
    }
    setSaving(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const res = await apiFetch(`${API_BASE}/admin_people.php`, {
        method, 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify(data.person)
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(isNew ? t('admin_celebridade_criada_com_sucesso', 'Celebridade criada com sucesso!') : t('admin_alteracoes_guardadas', 'Alterações guardadas!'), 'success');
        if (isNew && resData.id) {
          navigate(`/admin/celebrities/${resData.id}`);
        }
      } else {
        showToast('Erro: ' + (resData.error || t('admin_erro_ao_guardar', 'Erro ao guardar.')), 'error');
      }
    } catch (err) { 
      console.error('Save celebrity error:', err);
      showToast('Erro de ligação.', 'error'); 
    }
    setSaving(false);
  };

  const handleSync = async () => {
    if (!data.person.tmdb_id) return showToast('Esta celebridade não tem ID TMDB.', 'error');
    setSyncing(true);
    try {
      const res = await apiFetch(`${API_BASE}/tmdb_person_sync.php?id=${id}`, { credentials: 'include' });
      const resData = await res.json();
      if (resData.success) {
        showToast('Sincronização concluída!', 'success');
        fetchCelebrity();
      } else {
        showToast(resData.error || t('admin_erro_na_sincronizacao', 'Erro na sincronização.'), 'error');
      }
    } catch (err) { 
      console.error('Sync celebrity error:', err);
      showToast('Erro de ligação. Verifique a consola para mais detalhes.', 'error'); 
    }
    setSyncing(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>{t('admin_a_carregar', 'A carregar...')}</div>;
  if (!data?.person) return <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>{t('admin_celebridade_nao_encontrada', 'Celebridade não encontrada.')}</div>;

  const { person, credits } = data;

  return (
    <form onSubmit={handleSave} className="admin-artist-edit">
      <header className="celebrity-edit-header">
        <div className="celebrity-edit-header-left">
          <button type="button" onClick={() => navigate(-1)} className="icon-btn"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="celebrity-edit-header-title">{isNew ? t('admin_adicionar_celebridade', 'Adicionar Celebridade') : person.name}</h1>
            <p className="celebrity-edit-header-subtitle">
              {isNew ? t('admin_adicionar_uma_nova_celebridade', 'Adicionar uma nova celebridade') : `ID #${person.id} ${person.tmdb_id ? `· TMDB #${person.tmdb_id}` : ''}`}
            </p>
          </div>
        </div>
        <div className="celebrity-edit-header-actions">
          {!isNew && (
            <>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleSync} 
                disabled={syncing}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <RefreshCw size={18} className={syncing ? 'spin' : ''} /> {syncing ? 'A sincronizar...' : 'Sincronizar'}
              </button>
              <Link to={`/celebrity/${data.person.slug || id}`} target="_blank" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExternalLink size={16} /> Ver Página Pública
              </Link>
              {person.imdb_id && (
                <a href={`https://www.imdb.com/name/${person.imdb_id}`} target="_blank" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ExternalLink size={16} /> IMDB
                </a>
              )}
            </>
          )}
          <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={18} /> {saving ? (isNew ? t('admin_a_criar', 'A criar...') : t('admin_a_guardar', 'A guardar...')) : (isNew ? t('admin_criar_celebridade', 'Criar Celebridade') : 'Guardar')}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32 }}>
        {/* Sidebar: Photo & Stats */}
        <aside>
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', marginBottom: 24 }}>
            <img src={person.poster || PLACEHOLDER_IMG} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} />
            <div style={{ padding: 20, borderTop: '1px solid var(--glass-border)' }}>
              <label className="form-label">{t('admin_url_da_foto', 'URL da Foto')}</label>
              <input className="form-input" value={person.poster || ''} onChange={e => setData({...data, person: {...person, poster: e.target.value}})} />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>{t('admin_detalhes_pessoais', 'Detalhes Pessoais')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>{t('admin_nome', 'Nome')}</label>
                <input className="form-input" value={person.name || ''} onChange={e => setData({...data, person: {...person, name: e.target.value}})} required />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>{t('admin_data_de_nascimento', 'Data de Nascimento')}</label>
                <input type="date" className="form-input" value={person.birthday || ''} onChange={e => setData({...data, person: {...person, birthday: e.target.value}})} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>{t('admin_local_de_nascimento', 'Local de Nascimento')}</label>
                <input className="form-input" value={person.place_of_birth || ''} onChange={e => setData({...data, person: {...person, place_of_birth: e.target.value}})} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>{t('admin_popularidade', 'Popularidade')}</label>
                <input type="number" step="0.1" className="form-input" value={person.popularity || 0} onChange={e => setData({...data, person: {...person, popularity: parseFloat(e.target.value) || 0}})} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>{t('admin_id_tmdb', 'ID TMDB')}</label>
                <input className="form-input" value={person.tmdb_id || ''} onChange={e => setData({...data, person: {...person, tmdb_id: e.target.value}})} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11, marginBottom: 4 }}>{t('admin_id_imdb', 'ID IMDb')}</label>
                <input className="form-input" value={person.imdb_id || ''} onChange={e => setData({...data, person: {...person, imdb_id: e.target.value}})} />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content: Info & Credits */}
        <div>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 24, border: '1px solid var(--glass-border)', marginBottom: 32 }}>
            <label className="form-label" style={{ fontSize: 16, marginBottom: 12 }}>{t('admin_biografia', 'Biografia')}</label>
            <textarea 
              className="form-input" 
              rows={10} 
              style={{ lineHeight: 1.6, background: 'transparent' }}
              value={person.biography || ''} 
              onChange={e => setData({...data, person: {...person, biography: e.target.value}})}
            />
          </div>

          {!isNew && (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Film size={20} /> Histórico de Créditos ({credits.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {credits.map((c: any) => (
                  <Link 
                    key={`${c.title_id}-${c.character}`} 
                    to={`/admin/${c.type === 'movie' ? 'movies' : 'series'}/${c.title_id}`}
                    style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, border: '1px solid var(--glass-border)', textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = t('admin_translatey_4px', 'translateY(-4px)')}
                    onMouseLeave={e => e.currentTarget.style.transform = t('admin_translatey0', 'translateY(0)')}
                  >
                    <img src={c.title_poster} alt="" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 8, objectFit: 'cover', marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.title_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)' }}>{c.character || c.job}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{new Date(c.release_date).getFullYear() || '—'}</div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .celebrity-edit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 20px;
          gap: 20px;
        }
        .celebrity-edit-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .celebrity-edit-header-title {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
        }
        .celebrity-edit-header-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .celebrity-edit-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .celebrity-edit-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .celebrity-edit-header-actions {
            width: 100%;
            justify-content: flex-start;
          }
          
          .celebrity-edit-header-actions .btn-primary,
          .celebrity-edit-header-actions .btn-secondary,
          .celebrity-edit-header-actions a.btn-secondary {
            flex: 1 1 auto;
            min-width: fit-content;
            justify-content: center;
            font-size: 13px;
            padding: 10px 14px;
            white-space: nowrap;
          }
        }
      `}} />
    </form>
  );
}
