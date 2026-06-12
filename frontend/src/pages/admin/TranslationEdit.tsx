import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Search, Plus, X, Save } from 'lucide-react';
import { showToast } from '../../components/Toast';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

interface TranslationLine {
  id?: number;
  key: string;
  value: string;
}

export default function AdminTranslationEdit() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [localization, setLocalization] = useState<any>(null);
  const [lines, setLines] = useState<TranslationLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const [locRes, linesRes] = await Promise.all([
      apiFetch(`${API_BASE}/admin_translations.php?id=${id}`).then(res => res.json()),
      apiFetch(`${API_BASE}/admin_translations.php?localization_id=${id}`).then(res => res.json())
    ]);
    setLocalization(locRes);
    setLines(linesRes);
    setLoading(false);
  };

  const handleAddLine = () => {
    setLines([...lines, { key: '', value: '' }]);
  };

  const handleUpdateLine = (index: number, field: 'key' | 'value', val: string) => {
    const newLines = [...lines];
    newLines[index][field] = val;
    setLines(newLines);
  };

  const handleDeleteLine = async (lineId?: number, index?: number) => {
    if (lineId) {
      const res = await apiFetch(`${API_BASE}/admin_translations.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lineId, delete_line: true })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_linha_removida', 'Linha removida.'));
      }
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const res = await apiFetch(`${API_BASE}/admin_translations.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        save_lines: true, 
        localization_id: id, 
        lines 
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(t('admin_traducoes_guardadas_com_sucesso', 'Traduções guardadas com sucesso!'));
      fetchData();
    }
  };

  const filteredLines = lines
    .map((line, originalIndex) => ({ ...line, originalIndex }))
    .filter(l => 
      l.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30, fontSize: 14, color: 'var(--text-secondary)' }}>
        <Link to="/admin/translations" style={{ color: 'inherit', textDecoration: 'none' }}>{t('admin_localizacoes', 'Localizações')}</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)' }}>{t('admin_traducoes_em', 'Traduções em')} {localization?.name}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div style={{ position: 'relative', width: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder={t('admin_escreve_para_pesquisar', 'Escreve para pesquisar...')} 
            className="form-input"
            style={{ paddingLeft: 40 }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={handleAddLine} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> {t('admin_adicionar_novo', 'Adicionar novo')}
          </button>
          <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E50914' }}>
            {t('admin_guardar_traducoes', 'Guardar traduções')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredLines.map((line) => (
          <div key={line.originalIndex} className="glass-card" style={{ padding: 20, borderRadius: 12, position: 'relative', border: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => handleDeleteLine(line.id, line.originalIndex)}
              style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>{t('admin_chave_original', 'CHAVE (ORIGINAL)')}</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ fontSize: 14, fontWeight: 600, padding: '8px 14px', height: 38 }}
                value={line.key}
                onChange={e => handleUpdateLine(line.originalIndex, 'key', e.target.value)}
                placeholder={t('admin_ex_search_placeholder', 'Ex: search_placeholder')}
              />
            </div>
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>{t('admin_traducao', 'TRADUÇÃO')}</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ fontSize: 14, padding: '8px 14px', height: 38 }}
                value={line.value}
                onChange={e => handleUpdateLine(line.originalIndex, 'value', e.target.value)}
                placeholder={t('admin_introduz_a_traducao_aqui', 'Introduz a tradução aqui...')}
              />
            </div>
          </div>
        ))}

        {filteredLines.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
            {t('admin_nenhuma_traducao_encontrada_para_esta_pesquisa', 'Nenhuma tradução encontrada para esta pesquisa.')}
          </div>
        )}
      </div>
    </div>
  );
}
