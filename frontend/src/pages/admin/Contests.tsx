import { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Search, Pencil, Trash2, ExternalLink, 
  Calendar, MapPin, X, Copy, Upload, Check, Users, Download,
  Trophy, Dices, Mail, Send
} from 'lucide-react';
import { API_BASE, apiFetch } from '../../config';
import { showToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { useTranslation } from '../../context/LanguageContext';

interface Contest {
  id: number;
  title_id: number;
  title_name?: string;
  title_poster?: string;
  title_slug?: string;
  type: 'exclusive' | 'partner';
  require_login?: number | boolean;
  name: string;
  details: string;
  link: string;
  partner_logo?: string;
  location?: string;
  end_date?: string;
  tickets_count?: number;
  rules_link?: string;
  question?: string;
  created_at: string;
  has_winners?: boolean | number;
}

export default function AdminContests() {
  const { t } = useTranslation();
  const [contests, setContests] = useState<Contest[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<Partial<Contest> | null>(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: 0 });
  const [titleSearch, setTitleSearch] = useState('');
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [participationsModal, setParticipationsModal] = useState<{ open: boolean, contestId: number, name: string, titleName: string, question?: string }>({ open: false, contestId: 0, name: '', titleName: '', question: '' });
  const [participations, setParticipations] = useState<any[]>([]);
  const [raffleCount, setRaffleCount] = useState(10);
  const [raffleLoading, setRaffleLoading] = useState(false);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState<any>(null);

  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const openGallery = async () => {
    setIsGalleryOpen(true);
    setGalleryLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_files.php`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setGalleryImages(data.filter(f => f.type === 'Image' || (f.name && f.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))));
      }
    } catch (err) {
      console.error('Error loading files:', err);
      showToast('Erro ao carregar imagens', 'error');
    }
    setGalleryLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [contestsRes, titlesRes] = await Promise.all([
        apiFetch(`${API_BASE}/admin_contests.php`),
        apiFetch(`${API_BASE}/admin_media.php`)
      ]);
      const contestsData = await contestsRes.json();
      const titlesData = await titlesRes.json();
      setContests(Array.isArray(contestsData) ? contestsData : []);
      setTitles(titlesData.titles || []);
    } catch (error) {
      console.error('Error loading contests:', error);
      showToast('Erro ao carregar dados', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContest?.title_id || !editingContest?.name) {
      showToast('Preencha os campos obrigatórios', 'error');
      return;
    }

    try {
      const res = await apiFetch(`${API_BASE}/admin_contests.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContest)
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingContest.id ? t('admin_passatempo_atualizado', 'Passatempo atualizado') : t('admin_passatempo_criado', 'Passatempo criado'), 'success');
        setIsModalOpen(false);
        loadData();
      }
    } catch (error) {
      showToast('Erro ao gravar passatempo', 'error');
    }
  };

  const getContestLink = (c: any) => {
    if (c.type === 'exclusive') {
      return `/movie/${c.title_slug || c.title_id}`;
    }
    if (c.link) {
      if (c.link.startsWith('http') || c.link.startsWith('/')) {
        return c.link;
      }
      return `https://${c.link}`;
    }
    return '#';
  };

  const handleDelete = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_contests.php?id=${confirmModal.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Passatempo eliminado', 'success');
        setConfirmModal({ open: false, id: 0 });
        loadData();
      }
    } catch (error) {
      showToast('Erro ao eliminar', 'error');
    }
  };

  const filteredContests = contests.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.title_name?.toLowerCase().includes(search.toLowerCase())
  );

  const exportToCSV = () => {
    if (participations.length === 0) return;
    
    // Using semicolon as separator for better compatibility with European Excel settings
    const headers = [
      '"' + t('admin_nome', 'Nome') + '"',
      '"' + t('admin_email', 'Email') + '"',
      '"' + t('admin_ccbi', 'CC/BI') + '"',
      '"' + t('admin_localizacao', 'Localização') + '"',
      '"' + t('admin_resposta', 'Resposta') + '"',
      '"' + t('admin_instagram', 'Instagram') + '"',
      '"' + t('admin_data', 'Data') + '"'
    ];
    const rows = participations.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      `"${(p.cc_bi || '').replace(/"/g, '""')}"`,
      `"${(p.location || '').replace(/"/g, '""')}"`,
      `"${(p.answer || '').replace(/"/g, '""')}"`,
      `"${(p.instagram_link || '').replace(/"/g, '""')}"`,
      `"${new Date(p.created_at).toLocaleString()}"`
    ]);
    
    const csvContent = t('admin_sepn', 'sep=;\n') + [headers, ...rows].map(e => e.join(";")).join("\n");
    // Add BOM for UTF-8 to handle special characters in Excel
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `participacoes_${participationsModal.titleName.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <div className="contests-header">
        <div>
          <h1 className="contests-title">
            <Ticket size={32} className="text-accent" />
            {t('admin_gestao_de_passatempos', 'Gestão de Passatempos')}
          </h1>
          <p className="contests-subtitle">{t('admin_crie_e_gira_passatempos_exclusivos_e_de_', 'Crie e gira passatempos exclusivos e de parceiros.')}</p>
        </div>
        <button 
          onClick={() => {
            setEditingContest({ type: 'exclusive', title_id: 0, name: '', details: '', link: '', tickets_count: 0, require_login: 1 });
            setIsModalOpen(true);
          }}
          className={t('admin_btn_primary_contests_btn', 'btn-primary contests-btn')}
        >
          <Plus size={20} /> {(() => {
            const txt = t('admin_novo_passatempo', 'Novo Passatempo');
            return txt.startsWith('+') ? txt.substring(1).trim() : txt;
          })()}
        </button>
      </div>

      <div>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder={t('admin_procurar_por_nome_ou_filme', 'Procurar por nome ou filme...')} 
            style={{ width: '100%', padding: '14px 14px 14px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'var(--text-primary)' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>{t('admin_a_carregar_passatempos', 'A carregar passatempos...')}</div>
        ) : filteredContests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <Ticket size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
            <p>{t('admin_nenhum_passatempo_encontrado', 'Nenhum passatempo encontrado.')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 24 }}>
            {filteredContests.map(c => {
              const isEnded = (c.end_date && new Date(c.end_date) < new Date()) || Number(c.has_winners) === 1;
              return (
                <div key={c.id} style={{ 
                  background: isEnded ? 'var(--bg-secondary)' : (c.type === 'exclusive' ? 'rgba(229,9,20,0.05)' : 'var(--bg-secondary)'), 
                  border: isEnded ? '1px solid var(--glass-border)' : (c.type === 'exclusive' ? '1px solid rgba(229,9,20,0.3)' : '1px solid var(--glass-border)'), 
                  borderRadius: 10, 
                  padding: 0,
                  display: 'flex',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'transform 0.2s',
                  minHeight: 180,
                  filter: isEnded ? 'grayscale(1)' : 'none',
                  opacity: isEnded ? 0.6 : 1,
                }}>
                  {/* Movie Poster Sidebar */}
                  <div style={{ width: 120, flexShrink: 0, position: 'relative' }}>
                    {c.title_poster ? (
                      <img 
                        src={c.title_poster.startsWith('http') ? c.title_poster : `https://image.tmdb.org/t/p/w500${c.title_poster}`} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ticket size={24} style={{ opacity: 0.1 }} />
                      </div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.4))' }} />
                  </div>

                  {/* Content Area */}
                  <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isEnded ? (
                          <div style={{ 
                            background: 'var(--bg-primary)', 
                            color: 'var(--text-secondary)',
                            fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 1
                          }}>
                            Terminado
                          </div>
                        ) : (
                          <>
                            <div style={{ 
                              background: c.type === 'exclusive' ? 'rgba(229,9,20,0.1)' : 'var(--bg-primary)', 
                              color: c.type === 'exclusive' ? 'var(--accent)' : 'var(--text-primary)',
                              fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 1
                            }}>
                              {c.type === 'exclusive' ? 'Exclusivo' : 'Parceiro'}
                            </div>
                            <div style={{ 
                              background: 'rgba(0,220,100,0.1)', 
                              color: '#00E054',
                              fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 1
                            }}>
                              {t('admin_a_decorrer', 'A Decorrer')}
                            </div>
                          </>
                        )}
                        
                        {c.partner_logo && (
                          <div style={{ height: 24, display: 'flex', alignItems: 'center' }}>
                            <img src={c.partner_logo} alt="Partner" style={{ height: '100%', maxWidth: '80px', objectFit: 'contain', filter: 'var(--contest-logo-filter)' }} />
                          </div>
                        )}
                      </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.type === 'exclusive' && (
                        <button 
                          onClick={async () => {
                            setParticipationsModal({ open: true, contestId: c.id, name: c.name, titleName: c.title_name || '', question: c.question || '' });
                            const res = await apiFetch(`${API_BASE}/admin_participations.php?contest_id=${c.id}`);
                            const data = await res.json();
                            setParticipations(Array.isArray(data) ? data : []);
                          }}
                          className="action-btn" 
                          title={t('admin_ver_participacoes', 'Ver Participações')}
                          style={{ color: 'var(--accent)' }}
                        >
                          <Users size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const { id, created_at, title_name, title_poster, ...duplicateData } = c;
                          setEditingContest({ ...duplicateData, name: `${c.name} (Cópia)` });
                          setIsModalOpen(true);
                        }} 
                        className="action-btn" 
                        title="Duplicar"
                      >
                        <Copy size={14} />
                      </button>
                      <button onClick={() => { setEditingContest(c); setIsModalOpen(true); }} className="action-btn" title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmModal({ open: true, id: c.id })} className="action-btn delete" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 800, marginBottom: 2 }}>{c.title_name}</div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{c.name}</h3>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <Calendar size={12} style={{ opacity: 0.5 }} /> {c.end_date ? new Date(c.end_date).toLocaleString('pt-PT', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('admin_sem_data', 'Sem data')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <MapPin size={12} style={{ opacity: 0.5 }} /> {c.location || 'Nacional'}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700, opacity: 0.8 }}>{c.tickets_count || 0} bilhetes</div>
                    <a 
                      href={getContestLink(c)} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}
                    >
                      {t('admin_ver_passatempo', 'Ver Passatempo')} <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: 700, borderRadius: 10, border: '1px solid var(--glass-border)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{editingContest?.id ? t('admin_editar_passatempo', 'Editar Passatempo') : (() => {
                const txt = t('admin_novo_passatempo', 'Novo Passatempo');
                return txt.startsWith('+') ? txt.substring(1).trim() : txt;
              })()}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label className="form-label">{t('admin_tipo_de_passatempo', 'Tipo de Passatempo')}</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      type="button"
                      onClick={() => setEditingContest(prev => ({ ...prev, type: 'exclusive' }))}
                      style={{ 
                        flex: 1, padding: '14px', borderRadius: 12, border: '2px solid',
                        borderColor: editingContest?.type === 'exclusive' ? 'var(--accent)' : 'var(--glass-border)',
                        background: editingContest?.type === 'exclusive' ? 'rgba(229,9,20,0.1)' : 'var(--bg-primary)',
                        color: editingContest?.type === 'exclusive' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: '0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      {editingContest?.type === 'exclusive' && <Check size={16} />}
                      Exclusivo
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingContest(prev => ({ ...prev, type: 'partner' }))}
                      style={{ 
                        flex: 1, padding: '14px', borderRadius: 12, border: '2px solid',
                        borderColor: editingContest?.type === 'partner' ? 'var(--accent)' : 'var(--glass-border)',
                        background: editingContest?.type === 'partner' ? 'rgba(229,9,20,0.1)' : 'var(--bg-primary)',
                        color: editingContest?.type === 'partner' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: '0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      {editingContest?.type === 'partner' && <Check size={16} />}
                      Parceiro
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">{t('admin_vincular_a_filmeserie', 'Vincular a Filme/Série')}</label>
                  <div style={{ position: 'relative' }}>
                    <div 
                      onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                      style={{ 
                        padding: '12px 18px', 
                        background: 'var(--bg-primary)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: 12, 
                        color: editingContest?.title_id ? 'var(--text-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '50px'
                      }}
                    >
                      <span>
                        {editingContest?.title_id 
                          ? titles.find(t => t.id === editingContest.title_id)?.name 
                          : t('admin_selecionar_titulo', 'Selecionar Título...')}
                      </span>
                      <Search size={16} style={{ opacity: 0.5 }} />
                    </div>

                    {isTitleDropdownOpen && (
                      <div style={{ 
                        position: 'absolute', top: '100%', left: 0, right: 0, 
                        background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', 
                        borderRadius: 14, marginTop: 8, zIndex: 1100, 
                        maxHeight: 300, overflowY: 'auto', padding: 8,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        animation: t('admin_fadein_0_2s_ease', 'fadeIn 0.2s ease')
                      }}>
                        <input 
                          autoFocus
                          type="text" 
                          placeholder={t('admin_pesquisar_titulo', 'Pesquisar título...')} 
                          style={{ 
                            width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', 
                            border: '1px solid var(--glass-border)', borderRadius: 8, 
                            color: 'var(--text-primary)', fontSize: 13, marginBottom: 8, outline: 'none'
                          }}
                          value={titleSearch}
                          onChange={e => setTitleSearch(e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {titles
                            .filter(t => t.name.toLowerCase().includes(titleSearch.toLowerCase()))
                            .map(t => (
                              <div 
                                key={t.id} 
                                onClick={() => {
                                  setEditingContest(prev => ({ ...prev, title_id: t.id, title_name: t.name }));
                                  setIsTitleDropdownOpen(false);
                                  setTitleSearch('');
                                }}
                                style={{ 
                                  padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  background: editingContest?.title_id === t.id ? 'rgba(229,9,20,0.1)' : 'transparent',
                                  transition: '0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = editingContest?.title_id === t.id ? 'rgba(229,9,20,0.1)' : 'transparent'}
                              >
                                {t.poster ? (
                                  <img src={t.poster} style={{ width: 32, height: 48, borderRadius: 6, objectFit: 'cover' }} alt="" />
                                ) : (
                                  <div style={{ width: 32, height: 48, borderRadius: 6, background: '#333' }} />
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</span>
                                  <span style={{ fontSize: 11, opacity: 0.5 }}>
                                    {t.release_date ? new Date(t.release_date).getFullYear() : '—'} • {t.type === 'series' ? t('admin_serie', 'Série') : t('admin_filme', 'Filme')}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">{t('admin_nome_do_passatempo', 'Nome do Passatempo')}</label>
                <input 
                  className="form-input" 
                  style={{ padding: '14px 18px' }}
                  value={editingContest?.name}
                  onChange={e => setEditingContest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('admin_ex_ganha_convites_para_a_antestreia', 'Ex: Ganha convites para a antestreia')}
                />
              </div>

              <div>
                <label className="form-label">{t('admin_detalhes_descricao', 'Detalhes / Descrição')}</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  style={{ padding: '14px 18px' }}
                  value={editingContest?.details}
                  onChange={e => setEditingContest(prev => ({ ...prev, details: e.target.value }))}
                  placeholder={t('admin_explique_o_que_o_utilizador_ganha', 'Explique o que o utilizador ganha...')}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">{t('admin_link_externo_participacao', 'Link Externo / Participação')}</label>
                  <input 
                    className="form-input" 
                    style={{ padding: '14px 18px' }}
                    value={editingContest?.link}
                    onChange={e => setEditingContest(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">{t('admin_link_do_regulamento', 'Link do Regulamento')}</label>
                  <input 
                    className="form-input" 
                    style={{ padding: '14px 18px' }}
                    value={editingContest?.rules_link}
                    onChange={e => setEditingContest(prev => ({ ...prev, rules_link: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {editingContest?.type === 'exclusive' ? (
                <div>
                  <label className="form-label">{t('admin_pergunta_do_passatempo', 'Pergunta do Passatempo')}</label>
                  <input 
                    className="form-input" 
                    style={{ padding: '14px 18px' }}
                    value={editingContest?.question}
                    onChange={e => setEditingContest(prev => ({ ...prev, question: e.target.value }))}
                    placeholder={t('admin_ex_quem_e_o_realizador_do_filme', 'Ex: Quem é o realizador do filme?')}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <input 
                      type="checkbox" 
                      id="require_login"
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
                      checked={editingContest?.require_login === 1 || editingContest?.require_login === true}
                      onChange={e => setEditingContest(prev => ({ ...prev, require_login: e.target.checked ? 1 : 0 }))}
                    />
                    <label htmlFor="require_login" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}>
                      {t('admin_exigir_inicio_de_sessao_apenas_utilizadores_regist', 'Exigir início de sessão (apenas utilizadores registados podem participar)')}
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="form-label">{t('admin_logotipo_do_parceiro', 'Logótipo do Parceiro')}</label>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      style={{ 
                        flex: 1, height: '100px', borderRadius: 16, border: '2px dashed var(--glass-border)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 8, cursor: 'pointer', transition: '0.2s', background: 'rgba(255,255,255,0.02)',
                        overflow: 'hidden', position: 'relative'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                    >
                      {editingContest?.partner_logo ? (
                        <>
                          <img src={editingContest.partner_logo} alt="Preview" style={{ height: '60%', objectFit: 'contain' }} />
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>{t('admin_clique_para_alterar', 'Clique para alterar')}</div>
                        </>
                      ) : (
                        <>
                          <Upload size={24} style={{ opacity: 0.3 }} />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{t('admin_upload_de_logotipo', 'Upload de Logótipo')}</span>
                        </>
                      )}
                      <input 
                        id="logo-upload"
                        type="file" 
                        hidden 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const formData = new FormData();
                          formData.append('file', file);
                          
                          try {
                            const res = await apiFetch(`${API_BASE}/upload.php`, {
                              method: 'POST',
                              body: formData
                            });
                            const data = await res.json();
                            if (data.success) {
                              setEditingContest(prev => ({ ...prev, partner_logo: data.url }));
                              showToast('Logótipo carregado', 'success');
                            } else {
                              showToast(data.error || 'Erro no upload', 'error');
                            }
                          } catch (error) {
                            showToast('Erro ao carregar ficheiro', 'error');
                          }
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>{t('admin_ou_introduzir_url', 'Ou introduzir URL')}</label>
                        <input 
                          className="form-input" 
                          style={{ padding: '12px 16px', fontSize: 13 }}
                          value={editingContest?.partner_logo}
                          onChange={e => setEditingContest(prev => ({ ...prev, partner_logo: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={openGallery}
                        className="btn-secondary"
                        style={{ padding: '10px 14px', fontSize: 12, justifyContent: 'center', borderRadius: 10 }}
                      >
                        Escolher da Galeria
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div>
                  <label className="form-label">{t('admin_localizacao', 'Localização')}</label>
                  <input 
                    className="form-input" 
                    style={{ padding: '14px 18px' }}
                    value={editingContest?.location}
                    onChange={e => setEditingContest(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t('admin_ex_lisboa_porto', 'Ex: Lisboa / Porto')}
                  />
                </div>
                <div>
                  <label className="form-label">{t('admin_qtd_bilhetes', 'Qtd. Bilhetes')}</label>
                  <input 
                    type="number"
                    className="form-input" 
                    style={{ padding: '14px 18px' }}
                    value={editingContest?.tickets_count}
                    onChange={e => setEditingContest(prev => ({ ...prev, tickets_count: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="form-label">{t('admin_data_de_fim', 'Data de Fim')}</label>
                  <input 
                    type="datetime-local"
                    className="form-input" 
                    style={{ padding: '14px 18px' }}
                    value={editingContest?.end_date ? editingContest.end_date.replace(' ', 'T').substring(0, 16) : ''}
                    onChange={e => setEditingContest(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <X size={18} /> {t('btn_cancel', 'Cancelar')}
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  <Check size={20} />
                  {editingContest?.id ? 'Guardar Alterações' : 'Criar Passatempo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participations Modal */}
      {participationsModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '90%', maxWidth: 1000, borderRadius: 10, border: '1px solid var(--glass-border)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{t('admin_participacoes', 'Participações')}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{participationsModal.titleName}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>•</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{participationsModal.name}</span>
                </div>
                {participationsModal.question && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, fontStyle: 'italic', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--glass-border)', display: 'inline-block' }}>
                    Pergunta: {participationsModal.question}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {participations.length > 0 && (
                  <button 
                    onClick={exportToCSV}
                    className="btn-secondary"
                  >
                    <Download size={16} /> {t('admin_extrair_csv', 'Extrair CSV')}
                  </button>
                )}
                <button onClick={() => setParticipationsModal({ open: false, contestId: 0, name: '', titleName: '', question: '' })} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
              </div>
            </div>

            {/* Raffle Bar */}
            <div style={{ padding: '16px 32px', background: 'rgba(229, 9, 21, 0.05)', borderBottom: '1px solid rgba(229, 9, 21, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Trophy size={20} color="var(--accent)" />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{t('admin_sorteio_aleatorio', 'Sorteio Aleatório')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_n_de_vencedores', 'Nº de vencedores:')}</span>
                <input 
                  type="number" 
                  min="1" 
                  className="glass-input" 
                  style={{ width: 60, height: 36, textAlign: 'center', padding: 0 }}
                  value={raffleCount}
                  onChange={e => setRaffleCount(parseInt(e.target.value) || 1)}
                />
                <button 
                  onClick={async () => {
                    if (!window.confirm(t('admin_sortear_rafflecount_vencedores_aleatorio', 'Sortear ${raffleCount} vencedores aleatórios? Os vencedores anteriores serão substituídos.'))) return;
                    setRaffleLoading(true);
                    try {
                      await apiFetch(`${API_BASE}/admin_participations.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'raffle', contest_id: participationsModal.contestId, count: raffleCount })
                      });
                      const res = await apiFetch(`${API_BASE}/admin_participations.php?contest_id=${participationsModal.contestId}`);
                      const data = await res.json();
                      setParticipations(data);
                      showToast('Sorteio concluído!', 'success');
                    } catch (err) {
                      showToast('Erro ao realizar sorteio', 'error');
                    } finally {
                      setRaffleLoading(false);
                    }
                  }}
                  className="btn-primary"
                  style={{ height: 36, padding: '0 16px', fontSize: 13 }}
                  disabled={raffleLoading}
                >
                  <Dices size={16} /> {raffleLoading ? t('admin_a_sortear', 'A sortear...') : t('admin_realizar_roll', 'Realizar Roll')}
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
              {participations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>{t('admin_nenhuma_participacao_registada_ainda', 'Nenhuma participação registada ainda.')}</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('admin_nomeemail', 'Nome/Email')}</th>
                      <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('admin_ccbi', 'CC/BI')}</th>
                      <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('admin_localizacao', 'Localização')}</th>
                      <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('admin_resposta', 'Resposta')}</th>
                      <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('admin_instagram', 'Instagram')}</th>
                      <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('admin_data', 'Data')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participations.map((p, idx) => (
                      <tr key={idx} style={{ 
                        borderBottom: '1px solid var(--glass-border)',
                        background: p.is_winner ? 'rgba(229, 9, 21, 0.05)' : 'transparent'
                      }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.is_winner == 1 && <Trophy size={16} color="var(--accent)" />}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                          {p.cc_bi || '-'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <MapPin size={12} style={{ opacity: 0.5 }} /> {p.location}
                          </div>
                        </td>
                        <td style={{ padding: '16px', maxWidth: 250 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.answer}</div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {p.instagram_link ? (
                            <a href={p.instagram_link} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                              <ExternalLink size={12} /> Perfil
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {new Date(p.created_at).toLocaleDateString()}
                            
                            <div style={{ display: 'flex', gap: 8 }}>
                              {p.is_winner == 1 && (
                                <button 
                                  onClick={() => {
                                    setSelectedParticipation(p);
                                    setIsMailModalOpen(true);
                                  }}
                                  className="action-btn-circle"
                                  style={{ color: 'var(--accent)', borderColor: 'rgba(229,9,21,0.3)' }}
                                  title={t('admin_enviar_e_mail_de_vencedor', 'Enviar E-mail de Vencedor')}
                                >
                                  <Mail size={14} />
                                </button>
                              )}
                              <button 
                                onClick={async () => {
                                  await apiFetch(`${API_BASE}/admin_participations.php`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'toggle_winner', id: p.id })
                                  });
                                  const res = await apiFetch(`${API_BASE}/admin_participations.php?contest_id=${participationsModal.contestId}`);
                                  const data = await res.json();
                                  setParticipations(data);
                                }}
                                className="action-btn-circle"
                                title={p.is_winner ? t('admin_remover_dos_vencedores', 'Remover dos Vencedores') : t('admin_marcar_como_vencedor', 'Marcar como Vencedor')}
                              >
                                {p.is_winner ? <X size={14} /> : <Check size={14} />}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.open}
        title={t('admin_eliminar_passatempo', 'Eliminar Passatempo')}
        message={t('admin_tem_a_certeza_que_deseja_eliminar_este_p', 'Tem a certeza que deseja eliminar este passatempo? Esta ação não pode ser revertida.')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ open: false, id: 0 })}
      />

      {isMailModalOpen && selectedParticipation && (
        <MailComposer 
          target={selectedParticipation}
          contest={participationsModal}
          onClose={() => setIsMailModalOpen(false)}
        />
      )}

      <style>{`
        .contests-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 20px;
        }
        .contests-title {
          font-size: 28px;
          font-weight: 900;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .contests-subtitle {
          color: var(--text-secondary);
          margin-top: 4px;
          margin-bottom: 0;
        }
        .contests-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .contests-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .contests-btn {
            width: 100%;
            justify-content: center;
          }
        }

        .form-label { display: block; margin-bottom: 12px; color: var(--text-secondary); font-size: 13px; font-weight: 500; }
        .glass-input {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          color: white;
          padding: 8px 12px;
          outline: none;
        }
        .action-btn-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--glass-border);
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn-circle:hover {
          background: rgba(255,255,255,0.05);
          color: white;
          border-color: rgba(255,255,255,0.2);
        }
      `}</style>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '90%', maxWidth: 600, borderRadius: 18, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{t('admin_galeria_de_imagens', 'Galeria de Imagens')}</h3>
              <button onClick={() => setIsGalleryOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {galleryLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>{t('admin_carregando_imagens', 'Carregando imagens...')}</div>
              ) : galleryImages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>{t('admin_nenhuma_imagem_carregada', 'Nenhuma imagem carregada.')}</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 16 }}>
                  {galleryImages.map(img => (
                    <div 
                      key={img.id}
                      onClick={() => {
                        setEditingContest(prev => ({ ...prev, partner_logo: img.url }));
                        setIsGalleryOpen(false);
                      }}
                      style={{ 
                        borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)',
                        aspectRatio: '1', cursor: 'pointer', background: 'var(--bg-primary)', position: 'relative',
                        transition: t('admin_all_0_2s_ease', 'all 0.2s ease'), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = t('admin_scale105', 'scale(1.05)');
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = t('admin_scale1', 'scale(1)');
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                        e.currentTarget.style.background = 'var(--bg-primary)';
                      }}
                      title={img.name}
                    >
                      <img src={img.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MailComposer({ target, contest, onClose }: { target: any, contest: any, onClose: () => void }) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const [movie, setMovie] = useState(contest.titleName || '');
  const [tickets, setTickets] = useState(t('admin_x1_bilhete_duplo', 'x1 Bilhete Duplo'));
  const [cinema, setCinema] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_mail_templates.php`);
      const data = await res.json();
      setTemplates(data);
      // Auto-select contest winner template if exists
      const winnerTpl = data.find((t: any) => t.slug === 'contest_winner');
      if (winnerTpl) {
        setSelectedTemplate(winnerTpl.slug);
        setSubject(winnerTpl.subject);
        setMessage(winnerTpl.body);
      }
    } catch (err) {
      console.error(t('admin_error_fetching_templates', 'Error fetching templates'));
    }
  };

  const handleTemplateChange = (slug: string) => {
    const tpl = templates.find(t => t.slug === slug);
    if (tpl) {
      setSelectedTemplate(slug);
      setSubject(tpl.subject);
      setMessage(tpl.body);
    }
  };

  const processedMessage = message
    .replace(/{{name}}/g, target.name)
    .replace(/{{movie}}/g, movie)
    .replace(/{{contest_name}}/g, movie)
    .replace(/{{tickets}}/g, tickets)
    .replace(/{{cinema}}/g, cinema)
    .replace(/{{date}}/g, date)
    .replace(/{{time}}/g, time)
    .replace(/{{prize_details}}/g, `${tickets} - ${cinema} - ${date} às ${time}`)
    .replace(/{{site_url}}/g, window.location.origin);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_send_mail.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: target.email,
          subject: subject.replace(/{{movie}}/g, movie).replace(/{{contest_name}}/g, movie),
          message: processedMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`E-mail enviado para ${target.name}!`, 'success');
        onClose();
      } else {
        showToast(data.error || t('admin_erro_ao_enviar_e_mail', 'Erro ao enviar e-mail'), 'error');
      }
    } catch (err) {
      showToast('Erro ao ligar ao servidor', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 800, padding: 0, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={20} color="var(--accent)" /> {t('admin_enviar_e_mail_de_vencedor', 'Enviar E-mail de Vencedor')}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Vencedor: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{target.name} ({target.email})</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSend} style={{ padding: 24, display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">"Template"</label>
              <select 
                className="form-input" 
                value={selectedTemplate}
                onChange={e => handleTemplateChange(e.target.value)}
              >
                {templates.map(t => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedTemplate === 'contest_winner' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-primary)', padding: 16, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                <div style={{ gridColumn: t('admin_span_2', 'span 2') }}>
                  <label className="form-label">{t('admin_filme', 'Filme')}</label>
                  <input className="form-input" value={movie} onChange={e => setMovie(e.target.value)} />
                </div>
                <div style={{ gridColumn: t('admin_span_2', 'span 2') }}>
                  <label className="form-label">{t('admin_tipo_de_bilhetes', 'Tipo de Bilhete(s)')}</label>
                  <input className="form-input" value={tickets} onChange={e => setTickets(e.target.value)} placeholder={t('admin_ex_x1_bilhete_duplo', 'Ex: x1 Bilhete Duplo')} />
                </div>
                <div>
                  <label className="form-label">{t('admin_cinema_local', 'Cinema / Local')}</label>
                  <input className="form-input" value={cinema} onChange={e => setCinema(e.target.value)} placeholder={t('admin_ex_colombo_imax', 'Ex: Colombo IMAX')} />
                </div>
                <div>
                  <label className="form-label">{t('admin_data', 'Data')}</label>
                  <input className="form-input" value={date} onChange={e => setDate(e.target.value)} placeholder={t('admin_ex_17_de_abril', 'Ex: 17 de Abril')} />
                </div>
                <div>
                  <label className="form-label">{t('admin_hora', 'Hora')}</label>
                  <input className="form-input" value={time} onChange={e => setTime(e.target.value)} placeholder={t('admin_ex_21h30', 'Ex: 21h30')} />
                </div>
              </div>
            )}

            <div>
              <label className="form-label">{t('contact_subject', 'Assunto')}</label>
              <input className="form-input" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
          </div>

          <div style={{ flex: 1.2 }}>
             <label className="form-label">{t('admin_conteudo_preview', 'Conteúdo (Preview)')}</label>
             <div style={{ 
               background: 'var(--bg-primary)', 
               border: '1px solid var(--glass-border)', 
               borderRadius: 8, 
               padding: 20, 
               height: 380, 
               overflowY: 'auto',
               fontSize: 13,
               color: 'var(--text-primary)'
             }}>
               <div dangerouslySetInnerHTML={{ __html: processedMessage }} />
             </div>
             
             <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>{t('btn_cancel', 'Cancelar')}</button>
                <button type="submit" className="btn-primary" disabled={sending} style={{ flex: 2, justifyContent: 'center' }}>
                  {sending ? t('admin_a_enviar', 'A enviar...') : <><Send size={18} /> {t('admin_enviar_vencedor', 'Enviar Vencedor')}</>}
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
}

