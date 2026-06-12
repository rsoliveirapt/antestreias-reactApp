import { useState, useEffect } from 'react';
import { Shield, Save, Plus, CheckCircle2 } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import { API_BASE, apiFetch } from '../../../config';
import { useTranslation } from '../../../context/LanguageContext';

interface Role {
  id: number;
  name: string;
  display_name: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { id: 'access_admin', label: 'Aceder à Administração', group: 'Geral' },
  { id: 'update_appearance', label: 'Atualizar aparência', group: 'Geral' },
  
  { id: 'view_users', label: 'Ver Utilizadores', group: 'Utilizadores' },
  
  { id: 'view_titles', label: 'Ver Filmes & Séries', group: 'Conteúdo' },
  { id: 'create_news', label: 'Criar Notícias', group: 'Conteúdo' },
  { id: 'view_cast', label: 'Ver Elenco', group: 'Conteúdo' },
  
  { id: 'view_reviews', label: 'Ver Críticas', group: 'Social' },
  { id: 'create_reviews', label: 'Criar Críticas', group: 'Social' },
  
  { id: 'view_videos', label: 'Ver Vídeos', group: 'Multimédia' },
  { id: 'play_videos', label: 'Reproduzir Vídeos', group: 'Multimédia' },

  { id: 'view_contests', label: 'Ver Passatempos Exclusivos', group: 'Passatempos' },
  { id: 'participate_contests', label: 'Participar em Passatempos Exclusivos', group: 'Passatempos' },
];

export default function SettingsRoles() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRoles = () => {
    apiFetch(`${API_BASE}/admin_roles.php`)
      .then(res => res.json())
      .then(data => {
        setRoles(data);
        if (data.length > 0 && !selectedRole) setSelectedRole(data[0]);
      });
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleTogglePermission = (permId: string) => {
    if (!selectedRole) return;
    const newPermissions = selectedRole.permissions.includes(permId)
      ? selectedRole.permissions.filter(p => p !== permId)
      : [...selectedRole.permissions, permId];
    setSelectedRole({ ...selectedRole, permissions: newPermissions });
  };

  const handleSave = () => {
    if (!selectedRole) return;
    setSaving(true);
    apiFetch(`${API_BASE}/admin_roles.php`, {
      method: 'PUT',
      body: JSON.stringify(selectedRole)
    }).then(res => res.json()).then(data => {
      setSaving(false);
      if (data.success) {
        showToast(t('admin_cargo_atualizado_com_sucesso', 'Cargo atualizado com sucesso!'), 'success');
        fetchRoles();
      } else {
        showToast(t('admin_erro_ao_guardar_cargo', 'Erro ao guardar cargo.'), 'error');
      }
    }).catch(() => {
      setSaving(false);
      showToast(t('admin_erro_ao_ligar_ao_servidor', 'Erro ao ligar ao servidor.'), 'error');
    });
  };

  const handleAddRole = () => {
    const name = prompt(t('admin_nome_tecnico_do_cargo_ex_moderator', 'Nome técnico do cargo (ex: moderator):'));
    const displayName = prompt(t('admin_nome_de_exibicao_ex_moderador', 'Nome de exibição (ex: Moderador):'));
    if (name && displayName) {
      apiFetch(`${API_BASE}/admin_roles.php`, {
        method: 'POST',
        body: JSON.stringify({ name, display_name: displayName, permissions: ['view_titles'] })
      }).then(res => res.json()).then(data => {
        if (data.success) {
          showToast(t('admin_cargo_criado_com_sucesso', 'Cargo criado com sucesso!').replace('{name}', displayName), 'success');
          fetchRoles();
        } else {
          showToast(t('admin_erro_ao_criar_cargo', 'Erro ao criar cargo.'), 'error');
        }
      }).catch(() => showToast(t('admin_erro_ao_ligar_ao_servidor', 'Erro ao ligar ao servidor.'), 'error'));
    }
  };

  const permissionGroups = Array.from(new Set(AVAILABLE_PERMISSIONS.map(p => p.group)));

  const cleanGroupKey = (group: string) => {
    return 'perm_group_' + group.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  };

  return (
    <div className="settings-container">
      {/* Cabeçalho */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '24px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 16 : 0
      }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield color="var(--accent)" /> {t('admin_cargos_e_permissoes', 'Cargos e Permissões')}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('admin_define_o_que_cada_nivel_de_utilizador_po', 'Define o que cada nível de utilizador pode fazer no site.')}</p>
        </div>
        <button className="btn-primary" onClick={handleAddRole} style={{ alignSelf: isMobile ? 'flex-start' : 'auto' }}>
          <Plus size={18} /> {t('admin_novo_cargo', 'Novo Cargo')}
        </button>
      </div>

      {isMobile ? (
        /* ── MOBILE: selector horizontal + permissões empilhadas ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Selector de cargo em chips com quebra de linha */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`role-chip ${selectedRole?.id === role.id ? 'active' : ''}`}
              >
                {role.display_name}
              </button>
            ))}
          </div>

          {/* Painel de permissões do cargo selecionado */}
          {selectedRole && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              {/* Cabeçalho do cargo */}
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 20, marginBottom: 4 }}>{selectedRole.display_name}</h3>
                  <code style={{ fontSize: 11, opacity: 0.5 }}>ID: {selectedRole.name}</code>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ background: 'var(--accent)', boxShadow: '0 4px 15px rgba(229,9,20,0.3)', flexShrink: 0, padding: '10px 16px', fontSize: 13 }}
                >
                  <Save size={16} /> {saving ? t('admin_a_guardar', 'A guardar...') : t('admin_guardar', 'Guardar')}
                </button>
              </div>

              {/* Grupos de permissões */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {permissionGroups.map(group => {
                  const groupKey = cleanGroupKey(group);
                  return (
                    <div key={groupKey}>
                      <h4 className="permission-group-title" style={{ fontSize: 12, marginBottom: 12, paddingBottom: 6 }}>
                        {t(groupKey, group)}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {AVAILABLE_PERMISSIONS.filter(p => p.group === group).map(perm => (
                          <label
                            key={perm.id}
                            className={`permission-row-mobile ${selectedRole.permissions.includes(perm.id) ? 'checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRole.permissions.includes(perm.id)}
                              onChange={() => handleTogglePermission(perm.id)}
                              style={{ accentColor: 'var(--accent)', width: 18, height: 18, flexShrink: 0 }}
                            />
                            <span className="permission-text">
                              {t('perm_' + perm.id, perm.label)}
                            </span>
                            {selectedRole.permissions.includes(perm.id) && <CheckCircle2 size={14} color="var(--accent)" />}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── DESKTOP: grid 2 colunas ── */
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
          {/* Barra lateral: lista de cargos */}
          <div className="roles-list-container">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`role-btn ${selectedRole?.id === role.id ? 'active' : ''}`}
              >
                {role.display_name}
              </button>
            ))}
          </div>

          {/* Matriz de permissões */}
          {selectedRole && (
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '24px', marginBottom: '5px' }}>{selectedRole.display_name}</h3>
                  <code style={{ fontSize: '12px', opacity: 0.5 }}>ID Técnico: {selectedRole.name}</code>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ background: 'var(--accent)', boxShadow: '0 4px 15px rgba(229,9,20,0.3)' }}
                >
                  <Save size={18} /> {saving ? t('admin_a_guardar', 'A guardar...') : t('admin_guardar_alteracoes', 'Guardar Alterações')}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {permissionGroups.map(group => {
                  const groupKey = cleanGroupKey(group);
                  return (
                    <div key={groupKey} style={{ marginBottom: '20px' }}>
                      <h4 className="permission-group-title">
                        {t(groupKey, group)}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {AVAILABLE_PERMISSIONS.filter(p => p.group === group).map(perm => (
                          <label
                            key={perm.id}
                            className={`permission-row ${selectedRole.permissions.includes(perm.id) ? 'checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRole.permissions.includes(perm.id)}
                              onChange={() => handleTogglePermission(perm.id)}
                              style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }}
                            />
                            <span className="permission-text">
                              {t('perm_' + perm.id, perm.label)}
                            </span>
                            {selectedRole.permissions.includes(perm.id) && (
                              <CheckCircle2 size={14} color="var(--accent)" style={{ marginLeft: 'auto' }} />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
