import { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, User as UserIcon, Shield, Ban, Edit2, ChevronLeft, ChevronRight, X, Trash2, Mail, Send } from 'lucide-react';
import { showToast } from '../../components/Toast';
import AdminPageHeader from '../../components/AdminPageHeader';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  cargos: string;
  permissions?: string[];
  suspenso: number | boolean;
  ultima_atividade: string;
  criado_em: string;
}

interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailTarget, setMailTarget] = useState<User | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [filters, setFilters] = useState({
    email: '',
    date_from: '',
    date_to: '',
    activity: '',
    role: ''
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        q: search,
        ...filters
      });
      const res = await apiFetch(`${API_BASE}/admin_users.php?${queryParams}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      showToast('Erro ao carregar utilizadores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
    fetchUsers();
  };

  const handleClearFilters = () => {
    setFilters({
      email: '',
      date_from: '',
      date_to: '',
      activity: '',
      role: ''
    });
    setIsFilterOpen(false);
    setTimeout(fetchUsers, 0);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'toggle_status', id })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_estado_do_utilizador_atualizado', 'Estado do utilizador atualizado!'));
        fetchUsers();
      }
    } catch (err) {
      showToast('Erro ao atualizar estado', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin_tem_a_certeza_que_deseja_eliminar_este_u', 'Tem a certeza que deseja eliminar este utilizador permanentemente?'))) return;
    try {
      const res = await apiFetch(`${API_BASE}/admin_users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('admin_utilizador_eliminado', 'Utilizador eliminado!'));
        fetchUsers();
      }
    } catch (err) {
      showToast('Erro ao eliminar utilizador', 'error');
    }
  };

  const handleExport = () => {
    if (users.length === 0) {
      showToast('Não existem dados para exportar', 'error');
      return;
    }
    const headers = ['ID', t('admin_nome', 'Nome'), 'Email', 'Cargo', 'Status', t('admin_ultima_atividade', 'Ultima Atividade'), t('admin_criado_em', 'Criado Em')];
    const rows = users.map(user => [
      user.id,
      `"${user.name}"`,
      `"${user.email}"`,
      `"${user.cargos}"`,
      user.suspenso ? t('admin_suspenso', 'Suspenso') : t('admin_ativo', 'Ativo'),
      `"${user.ultima_atividade}"`,
      `"${user.criado_em}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `utilizadores_antestreias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('admin_exportacao_concluida', 'Exportação concluída!'));
  };


  const openModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const openMailModal = (user: User) => {
    setMailTarget(user);
    setIsMailModalOpen(true);
  };

  return (
    <div className="admin-page">
      <AdminPageHeader 
        title={t('menu_users', 'Utilizadores')}
        subtitle={t('admin_gerir_contas_cargos_e_permissoes_dos_uti', 'Gerir contas, cargos e permissões dos utilizadores do sistema.')}
        actions={
          <>
            <div style={{ position: 'relative' }}>
              <button
                className={`btn-secondary ${isFilterOpen ? 'active' : ''}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} color="var(--accent)" />
                {t('admin_filtrar', 'Filtrar')}
              </button>

              {isFilterOpen && (
                <>
                  {isMobile && (
                    <div 
                      onClick={() => setIsFilterOpen(false)} 
                      style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 1099
                      }}
                    />
                  )}
                  <div className={t('admin_glass_card_filter_dropdown', 'glass-card filter-dropdown')} style={isMobile ? {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: t('admin_translate_50_50', 'translate(-50%, -50%)'),
                    width: t('admin_calc_100_32px', 'calc(100% - 32px)'),
                    maxWidth: 340,
                    zIndex: 1100,
                    padding: 0,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    border: '1px solid var(--glass-border)',
                    background: '#111'
                  } : {
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: 320,
                    zIndex: 100,
                    padding: 0,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    border: '1px solid var(--glass-border)',
                    background: '#111'
                  }}>
                    <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={handleClearFilters} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('admin_limpar', 'Limpar')}</button>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{t('admin_filtrar', 'Filtrar')}</span>
                      <button onClick={handleApplyFilters} className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>{t('admin_aplicar', 'Aplicar')}</button>
                    </div>

                    <div style={{ padding: '10px 0' }}>
                      <div className="filter-option">
                        <div className="filter-header" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="checkbox" checked={!!filters.email} readOnly className="custom-checkbox" />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{t('auth_email', 'E-mail')}</span>
                          </div>
                          <ChevronRight size={16} opacity={0.5} />
                        </div>
                        <div style={{ padding: '0 20px 15px 48px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={t('admin_filtrar_por_e_mail', 'Filtrar por e-mail...')}
                            value={filters.email}
                            onChange={e => setFilters({ ...filters, email: e.target.value })}
                            style={{ fontSize: 13, padding: '8px 12px', background: 'rgba(255,255,255,0.02)' }}
                          />
                        </div>
                      </div>

                      <div className="filter-option">
                        <div className="filter-header" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="checkbox" checked={!!(filters.date_from || filters.date_to)} readOnly className="custom-checkbox" />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{t('admin_data_de_criacao', 'Data de criação')}</span>
                          </div>
                          <ChevronRight size={16} opacity={0.5} />
                        </div>
                        <div style={{ padding: '0 20px 15px 48px', display: 'flex', gap: 8 }}>
                          <input type="date" className="form-input" value={filters.date_from} onChange={e => setFilters({ ...filters, date_from: e.target.value })} style={{ fontSize: 11, padding: 6, background: 'rgba(255,255,255,0.02)' }} title="Desde" />
                          <input type="date" className="form-input" value={filters.date_to} onChange={e => setFilters({ ...filters, date_to: e.target.value })} style={{ fontSize: 11, padding: 6, background: 'rgba(255,255,255,0.02)' }} title={t('admin_ate', 'Até')} />
                        </div>
                      </div>

                      <div className="filter-option">
                        <div className="filter-header" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input type="checkbox" checked={!!filters.role} readOnly className="custom-checkbox" />
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{t('admin_cargos', 'Cargos')}</span>
                          </div>
                          <ChevronRight size={16} opacity={0.5} />
                        </div>
                        <div style={{ padding: '0 20px 15px 48px' }}>
                          <select
                            className="form-input"
                            value={filters.role}
                            onChange={e => setFilters({ ...filters, role: e.target.value })}
                            style={{ fontSize: 13, padding: '8px 12px', width: '100%', background: 'rgba(255,255,255,0.02)' }}
                          >
                            <option value="" style={{ background: '#111' }}>{t('admin_todos_os_cargos', 'Todos os cargos')}</option>
                            <option value={t('admin_administrador', 'Administrador')} style={{ background: '#111' }}>{t('admin_administrador', 'Administrador')}</option>
                            <option value={t('admin_moderador', 'Moderador')} style={{ background: '#111' }}>{t('admin_moderador', 'Moderador')}</option>
                            <option value={t('admin_editor', 'Editor')} style={{ background: '#111' }}>{t('admin_editor', 'Editor')}</option>
                            <option value="Membro" style={{ background: '#111' }}>"Membro"</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button className="btn-secondary" onClick={handleExport} title={t('admin_exportar_para_csv', 'Exportar para CSV')}>
              <Download size={18} />
            </button>
            <button
              className="btn-primary"
              onClick={() => openModal()}
            >
              <Plus size={18} />
              {t('admin_adicionar_novo_utilizador', 'Adicionar novo utilizador')}
            </button>
          </>
        }
      />

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          padding: isMobile ? '12px 16px' : '20px 24px', 
          borderBottom: '1px solid var(--glass-border)', 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 0,
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center' 
        }}>
          <div className="search-box" style={{ width: isMobile ? '100%' : 350, background: 'rgba(255,255,255,0.03)' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder={t('admin_escreva_para_pesquisar', 'Escreva para pesquisar...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUsers()}
              style={{ width: '100%' }}
            />
          </div>
          {isMobile && users.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
              <input
                id="select-all-mobile"
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={toggleSelectAll}
                className="custom-checkbox"
              />
              <label htmlFor="select-all-mobile" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Selecionar Todos ({selectedUsers.length} de {users.length})
              </label>
            </div>
          )}
        </div>

        {isMobile ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>{t('admin_a_carregar_utilizadores', 'A carregar utilizadores...')}</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>{t('admin_nenhum_utilizador_encontrado', 'Nenhum utilizador encontrado.')}</div>
            ) : (
              users.map(user => (
                <div 
                  key={user.id} 
                  className={`glass-card ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                  style={{ 
                    padding: 16, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 16, 
                    border: '1px solid var(--glass-border)',
                    borderRadius: 12,
                    background: selectedUsers.includes(user.id) ? 'rgba(229, 9, 21, 0.05)' : 'rgba(255,255,255,0.01)',
                    position: 'relative'
                  }}
                >
                  {/* Top section: Checkbox, Avatar, Name & Email, Status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ paddingTop: 4 }}>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="custom-checkbox"
                      />
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {user.avatar ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={20} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{user.email}</div>
                    </div>
                    <div style={{ paddingTop: 6 }} title={user.suspenso ? t('admin_suspenso', 'Suspenso') : t('admin_ativo', 'Ativo')}>
                      <div className={`status-dot ${user.suspenso ? 'suspended' : 'active'}`}></div>
                    </div>
                  </div>

                  {/* Middle section: Roles / Badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {user.cargos.split(',')
                      .filter(r => r)
                      .map(r => r.trim())
                      .sort((a, b) => {
                        const superRegex = /super/i;
                        const isSuperA = superRegex.test(a);
                        const isSuperB = superRegex.test(b);
                        if (isSuperA && !isSuperB) return -1;
                        if (!isSuperA && isSuperB) return 1;

                        const adminRegex = /^administrador$/i;
                        const isAdminA = adminRegex.test(a);
                        const isAdminB = adminRegex.test(b);
                        if (isAdminA && !isAdminB) return -1;
                        if (!isAdminA && isAdminB) return 1;

                        return a.localeCompare(b);
                      })
                      .map((role, idx) => {
                        const isSuper = /super/i.test(role);
                        const isAdmin = /^administrador$/i.test(role);

                        return (
                          <span key={idx} className="role-badge" style={{
                            background: isSuper ? 'rgba(229, 9, 21, 0.15)' : (isAdmin ? 'rgba(241, 196, 15, 0.1)' : 'rgba(255,255,255,0.05)'),
                            color: isSuper ? 'var(--accent)' : (isAdmin ? '#f1c40f' : 'var(--text-secondary)'),
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            border: `1px solid ${isSuper ? 'rgba(229, 9, 21, 0.3)' : (isAdmin ? 'rgba(241, 196, 15, 0.2)' : 'rgba(255,255,255,0.1)')}`,
                            boxShadow: isSuper ? '0 0 10px rgba(229, 9, 21, 0.1)' : 'none',
                            letterSpacing: '0.5px'
                          }}>
                            {isSuper ? t('admin_super_admin', 'Super Admin') : role}
                          </span>
                        );
                      })}
                  </div>

                  {/* Metadata: Activity and Creation date */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('admin_ultima_atividade', 'Última Atividade')}</div>
                      <div style={{ fontSize: 12, color: 'white', marginTop: 4 }}>{user.ultima_atividade || 'Nunca'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('admin_criado_em', 'Criado em')}</div>
                      <div style={{ fontSize: 12, color: 'white', marginTop: 4 }}>{user.criado_em}</div>
                    </div>
                  </div>

                  {/* Bottom section: Actions */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 8, 
                    borderTop: '1px solid rgba(255,255,255,0.04)', 
                    paddingTop: 12 
                  }}>
                    <button className="action-btn-circle" onClick={() => openMailModal(user)} title={t('admin_enviar_e_mail', 'Enviar E-mail')} style={{ width: 36, height: 36 }}><Mail size={16} /></button>
                    <button className="action-btn-circle" onClick={() => openModal(user)} title="Editar" style={{ width: 36, height: 36 }}><Edit2 size={16} /></button>
                    <button className="action-btn-circle" onClick={() => handleToggleStatus(user.id)} title={user.suspenso ? 'Ativar' : 'Suspender'} style={{ width: 36, height: 36 }}>
                      {user.suspenso ? <Shield size={16} /> : <Ban size={16} />}
                    </button>
                    <button className="action-btn-circle delete" onClick={() => handleDelete(user.id)} title="Eliminar" style={{ width: 36, height: 36 }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="admin-table-wrapper" style={{ border: 'none', background: 'transparent' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={toggleSelectAll}
                      className="custom-checkbox"
                    />
                  </th>
                  <th>{t('admin_utilizador', 'Utilizador')}</th>
                  <th>{t('admin_cargos', 'Cargos')}</th>
                  <th>{t('admin_suspenso', 'Suspenso')}</th>
                  <th>{t('admin_ultima_atividade', 'Última atividade')}</th>
                  <th>{t('admin_criado_em', 'Criado em')}</th>
                  <th style={{ textAlign: 'right' }}>{t('admin_acoes', 'Ações')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 50, color: 'var(--text-secondary)' }}>{t('admin_a_carregar_utilizadores', 'A carregar utilizadores...')}</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 50, color: 'var(--text-secondary)' }}>{t('admin_nenhum_utilizador_encontrado', 'Nenhum utilizador encontrado.')}</td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="custom-checkbox"
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {user.avatar ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {user.cargos.split(',')
                            .filter(r => r)
                            .map(r => r.trim())
                            .sort((a, b) => {
                              const superRegex = /super/i;
                              const isSuperA = superRegex.test(a);
                              const isSuperB = superRegex.test(b);
                              if (isSuperA && !isSuperB) return -1;
                              if (!isSuperA && isSuperB) return 1;

                              const adminRegex = /^administrador$/i;
                              const isAdminA = adminRegex.test(a);
                              const isAdminB = adminRegex.test(b);
                              if (isAdminA && !isAdminB) return -1;
                              if (!isAdminA && isAdminB) return 1;

                              return a.localeCompare(b);
                            })
                            .map((role, idx) => {
                              const isSuper = /super/i.test(role);
                              const isAdmin = /^administrador$/i.test(role);

                              return (
                                <span key={idx} className="role-badge" style={{
                                  background: isSuper ? 'rgba(229, 9, 21, 0.15)' : (isAdmin ? 'rgba(241, 196, 15, 0.1)' : 'rgba(255,255,255,0.05)'),
                                  color: isSuper ? 'var(--accent)' : (isAdmin ? '#f1c40f' : 'var(--text-secondary)'),
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  whiteSpace: 'nowrap',
                                  border: `1px solid ${isSuper ? 'rgba(229, 9, 21, 0.3)' : (isAdmin ? 'rgba(241, 196, 15, 0.2)' : 'rgba(255,255,255,0.1)')}`,
                                  boxShadow: isSuper ? '0 0 10px rgba(229, 9, 21, 0.1)' : 'none',
                                  letterSpacing: '0.5px'
                                }}>
                                  {isSuper ? t('admin_super_admin', 'Super Admin') : role}
                                </span>
                              );
                            })}
                        </div>
                      </td>
                      <td>
                        <div className={`status-dot ${user.suspenso ? 'suspended' : 'active'}`}></div>
                      </td>
                      <td>{user.ultima_atividade}</td>
                      <td>{user.criado_em}</td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button className="action-btn-circle" onClick={() => openMailModal(user)} title={t('admin_enviar_e_mail', 'Enviar E-mail')}><Mail size={14} /></button>
                          <button className="action-btn-circle" onClick={() => openModal(user)} title="Editar"><Edit2 size={14} /></button>
                          <button className="action-btn-circle" onClick={() => handleToggleStatus(user.id)} title={user.suspenso ? 'Ativar' : 'Suspender'}>
                            {user.suspenso ? <Shield size={14} /> : <Ban size={14} />}
                          </button>
                          <button className="action-btn-circle delete" onClick={() => handleDelete(user.id)} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <UserEditor
            user={editingUser}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => { setIsModalOpen(false); fetchUsers(); }}
          />
        )}

        {isMailModalOpen && mailTarget && (
          <MailComposer 
            target={mailTarget}
            onClose={() => setIsMailModalOpen(false)}
          />
        )}

        <div className="table-footer" style={{ 
          padding: isMobile ? '12px 16px' : '16px 24px', 
          borderTop: '1px solid var(--glass-border)', 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 0,
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {t('admin_itens_por_pagina', 'Itens por página:')}
            <select className="glass-select" style={{ marginLeft: 8 }}>
              <option>15</option>
              <option>30</option>
              <option>50</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end', width: isMobile ? '100%' : 'auto', gap: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>1 - {users.length} de {users.length}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={t('admin_page_btn_disabled', 'page-btn disabled')}><ChevronLeft size={18} /></button>
              <button className={t('admin_page_btn_disabled', 'page-btn disabled')}><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .badge-role {
          background: rgba(255,255,255,0.05);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot.active { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
        .status-dot.suspended { background: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
        
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
        
        .page-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          opacity: 0.7;
        }
        .page-btn.disabled { opacity: 0.2; cursor: default; }
        
        .custom-checkbox {
          accent-color: var(--accent);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        .admin-table tr.selected {
          background: rgba(229, 9, 21, 0.03) !important;
        }
      `}} />
    </div>
  );
}

function MailComposer({ target, onClose }: { target: User, onClose: () => void }) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      showToast('Preencha o assunto e a mensagem', 'error');
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_send_mail.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: target.id,
          to: target.email,
          subject,
          message
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 600, padding: 0, borderRadius: 12, overflow: 'hidden', background: '#111', border: '1px solid var(--glass-border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={20} color="var(--accent)" /> {t('admin_enviar_e_mail', 'Enviar E-mail')}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Para: <span style={{ color: 'white', fontWeight: 600 }}>{target.name} ({target.email})</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}><X size={24} /></button>
        </div>

        <form onSubmit={handleSend} style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{t('contact_subject', 'Assunto')}</label>
            <input 
              className="form-input" 
              placeholder={t('admin_assunto_da_mensagem', 'Assunto da mensagem...')} 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{t('admin_mensagem_html_suportado', 'Mensagem (HTML suportado)')}</label>
            <textarea 
              className="form-input" 
              rows={10} 
              placeholder={t('admin_escreva_aqui_a_sua_mensagem', 'Escreva aqui a sua mensagem...')} 
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>{t('btn_cancel', 'Cancelar')}</button>
            <button type="submit" className="btn-primary" disabled={sending} style={{ flex: 2, justifyContent: 'center' }}>
              {sending ? t('admin_a_enviar', 'A enviar...') : <><Send size={18} /> {t('contact_submit', 'Enviar Mensagem')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserEditor({ user, onClose, onSuccess }: UserModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('detalhes');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    apelido: '',
    storage: '',
    email_confirmed: true,
    cargos: user?.cargos || 'Membro',
    permissions: user?.permissions || [] as string[],
    password: ''
  });

  const rolePermissions: Record<string, string[]> = {
    [t('admin_super_administrador', 'Super Administrador')]: ['super_admin_all'],
    [t('admin_administrador', 'Administrador')]: [
      'access_admin', 'update_appearance', 'view_users', 'view_titles',
      'view_reviews', 'create_reviews',
      'view_actors', 'create_news', 'view_videos',
      'play_videos'
    ],
    [t('admin_moderador', 'Moderador')]: [
      'view_users', 'view_titles',
      'view_reviews', 'create_reviews', 'view_actors',
      'view_videos', 'play_videos'
    ],
    [t('admin_editor', 'Editor')]: [
      'view_users', 'view_titles', 'view_reviews',
      'view_actors', 'create_news', 'view_videos', 'play_videos'
    ],
    ['Membro']: [
      'view_users', 'view_titles', 'view_reviews', 'view_actors',
      'view_videos', 'play_videos'
    ]
  };

  // Only sync roles to permissions if it's a NEW user or if the user manually changed the cargos
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  useEffect(() => {
    if (user && !initialSyncDone) {
      setInitialSyncDone(true);
      return;
    }

    const roles = formData.cargos.split(',').filter((r: string) => r).map((r: string) => r.trim());
    const newPerms = new Set<string>();
    roles.forEach((role: string) => {
      if (rolePermissions[role]) {
        rolePermissions[role].forEach(p => newPerms.add(p));
      }
    });
    setFormData(prev => ({ ...prev, permissions: Array.from(newPerms) }));
  }, [formData.cargos]);

  const [loading, setLoading] = useState(false);
  const [expandedPermission, setExpandedPermission] = useState<string | null>('super_admin');

  const tabs = [
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'permissions', label: t('admin_cargos_permissoes', 'Cargos & Permissões') },
    { id: 'security', label: t('admin_seguranca', 'Segurança') },
    { id: 'datetime', label: t('admin_data_hora', 'Data & Hora') },
    { id: 'api', label: 'API' }
  ];

  const permissionsGroups = [
    {
      id: 'super_admin',
      label: t('admin_super_administrador', 'Super Administrador'),
      perms: [
        { id: 'super_admin_all', label: t('admin_super_administrador', 'Super Administrador'), desc: t('admin_dar_todas_as_permissoes_ao_utilizador', 'Dar todas as permissões ao utilizador') }
      ]
    },
    {
      id: 'administrador_access',
      label: t('admin_administrador', 'Administrador'),
      perms: [
        { id: 'access_admin', label: 'Aceder à Administração', desc: t('admin_necessario_para_aceder_a_qualquer_pagina_da_area_d', 'Necessário para aceder a qualquer página da área de administração') },
        { id: 'update_appearance', label: 'Atualizar aparência', desc: t('admin_permite_o_acesso_ao_editor_de_aparencia', 'Permite o acesso ao editor de aparência.') }
      ]
    },
    {
      id: 'utilizadores_perms',
      label: 'Utilizadores',
      perms: [
        { id: 'view_users', label: 'Ver Utilizadores', desc: t('admin_permitir_a_visualizacao_das_paginas_de_perfil_do_u', 'Permitir a visualização das páginas de perfil do utilizador no site. O utilizador pode ver o seu próprio perfil sem esta permissão') }
      ]
    },
    {
      id: 'filmes_series',
      label: t('admin_filmes_series', 'Filmes & Séries'),
      perms: [
        { id: 'view_titles', label: 'Ver Filmes & Séries', desc: t('admin_permitir_a_visualizacao_de_filmes_series_e_passate', 'Permitir a visualização de filmes, séries e passatempos do site') }
      ]
    },
    {
      id: 'passatempos_perms',
      label: t('admin_passatempos_exclusivos', 'Passatempos Exclusivos'),
      perms: [
        { id: 'view_contests', label: 'Ver Passatempos Exclusivos', desc: t('admin_permitir_a_visualizacao_de_passatempos_exclusivos', 'Permitir a visualização de passatempos exclusivos na lista.') },
        { id: 'participate_contests', label: 'Participar em Passatempos Exclusivos', desc: t('admin_permitir_a_submissao_de_participacoes_em_passatemp', 'Permitir a submissão de participações em passatempos exclusivos.') }
      ]
    },
    {
      id: 'criticas_perms',
      label: 'Críticas',
      perms: [
        { id: 'view_reviews', label: 'Ver Críticas', desc: t('admin_permitir_que_o_utilizador_veja_criticas_deixadas_p', 'Permitir que o utilizador veja críticas deixadas por outros utilizadores') },
        { id: 'create_reviews', label: 'Criar Críticas', desc: t('admin_permitir_que_o_utilizador_classifique_filmes_e_ser', 'Permitir que o utilizador classifique filmes e series') }
      ]
    },
    {
      id: 'elenco_perms',
      label: 'Elenco',
      perms: [
        { id: 'view_actors', label: 'Ver Elenco', desc: t('admin_permitir_a_visualizacao_de_paginas_de_atores_no_si', 'Permitir a visualização de páginas de atores no site.') }
      ]
    },
    {
      id: 'noticias_perms',
      label: 'Notícias',
      perms: [
        { id: 'create_news', label: 'Criar Notícias', desc: t('admin_permitir_que_os_utilizadores_criem_artigos_de_noti', 'Permitir que os utilizadores criem artigos de noticias') }
      ]
    },
    {
      id: 'videos_perms',
      label: 'Vídeos',
      perms: [
        { id: 'view_videos', label: t('admin_ver_videos', 'Ver videos'), desc: t('admin_permitir_que_o_utilizador_veja_videos_no_site_isto', 'Permitir que o utilizador veja videos no site. Isto apenas mostrara a miniatura e o titulo do video, mas nao permitira a repodrução') },
        { id: 'play_videos', label: t('admin_reproduzir_videos', 'Reproduzir Videos'), desc: t('admin_permitir_que_o_utilizador_reproduza_videos_no_site', 'Permitir que o utilizador reproduza videos no site') }
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('O nome é obrigatório', 'error');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      showToast('Insira um e-mail válido', 'error');
      return;
    }
    if (!user && !formData.password.trim()) {
      showToast('A palavra-passe é obrigatória para novos utilizadores', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = user
        ? { action: 'update', id: user.id, ...formData }
        : { ...formData };

      const res = await apiFetch(`${API_BASE}/admin_users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(user ? t('admin_utilizador_atualizado', 'Utilizador atualizado!') : t('admin_utilizador_criado', 'Utilizador criado!'));
        onSuccess();
      }
    } catch (err) {
      showToast('Erro ao processar pedido', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advanced-editor-overlay">
      <div className="advanced-editor-container">
        {/* Header bar */}
        <div className="editor-header-bar">
          <button className="editor-back-btn" onClick={onClose}>
            <ChevronLeft size={20} /> {user ? t('admin_editar_utilizador', 'Editar utilizador') : t('admin_adicionar_utilizador', 'Adicionar utilizador')}
          </button>
          <div style={{ position: 'relative' }}>
            <button className={t('admin_btn_secondary_actions_trigger', 'btn-secondary actions-trigger')}>{t('admin_acoes', 'Ações')} <ChevronRight size={14} style={{ transform: 'rotate(90deg)', marginLeft: 4 }} /></button>
          </div>
        </div>

        {/* User Info Header */}
        <div className="user-profile-header">
          <div className="avatar-section">
            <div className="avatar-large">
              {user?.avatar ? <img src={user.avatar} alt="" /> : <UserIcon size={40} />}
              <button className="avatar-edit-btn"><Plus size={16} /></button>
            </div>
            <button className="remove-img-btn">"Remover imagem"</button>
          </div>
          <div className="user-info-text">
            <h2>{formData.name || t('admin_novo_utilizador', 'Novo Utilizador')}</h2>
            <p>{formData.email || t('admin_sem_e_mail', 'sem e-mail')}</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="editor-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content-area">
          <form onSubmit={handleSubmit}>
            {activeTab === 'detalhes' && (
              <div className="tab-pane">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('admin_nome', 'Nome')}</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={t('admin_ex_joao', 'Ex: João')} />
                  </div>
                  <div className="form-group">
                    <label>{t('admin_apelido', 'Apelido')}</label>
                    <input type="text" value={formData.apelido} onChange={e => setFormData({ ...formData, apelido: e.target.value })} placeholder={t('admin_ex_silva', 'Ex: Silva')} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 20 }}>
                  <label>{t('auth_email', 'E-mail')}</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder={t('admin_ex_joaosilvaexamplecom', 'Ex: joao.silva@example.com')} required />
                </div>

                <div className="toggle-field" style={{ marginTop: 24 }}>
                  <div className={`custom-switch ${formData.email_confirmed ? 'on' : ''}`} onClick={() => setFormData({ ...formData, email_confirmed: !formData.email_confirmed })}>
                    <div className="switch-handle"></div>
                  </div>
                  <div style={{ marginLeft: 12 }}>
                    <span style={{ fontSize: 13, color: formData.email_confirmed ? 'white' : 'var(--text-secondary)' }}>{t('admin_e_mail_confirmado', 'E-mail confirmado')}</span>
                    <p className="field-hint" style={{ marginTop: 4 }}>{t('admin_se_o_endereco_de_e_mail_foi_confirmado_o', 'Se o endereço de e-mail foi confirmado. O utilizador não poderá iniciar sessão até que o e-mail seja confirmado.')}</p>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 32 }}>
                  <label style={{ fontSize: 16, color: 'white', marginBottom: 16 }}>{t('admin_cargos', 'Cargos')}</label>
                  <div className="roles-tags-container">
                    {formData.cargos.split(',').filter((r: string) => r).map((role: string) => (
                      <div key={role} className="role-tag">
                        {role}
                        <button type="button" className="remove-tag-btn" onClick={() => {
                          const newRoles = formData.cargos.split(',').filter((r: string) => r && r !== role).join(',');
                          setFormData({ ...formData, cargos: newRoles });
                        }}><X size={12} /></button>
                      </div>
                    ))}

                    <div className="custom-dropdown-wrapper">
                      <button 
                        type="button" 
                        className="add-role-trigger"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsRoleDropdownOpen(!isRoleDropdownOpen);
                        }}
                      >
                        <Plus size={14} /> {t('admin_adicionar_cargo', 'Adicionar Cargo')}
                      </button>
                      {isRoleDropdownOpen && (
                        <>
                          <div 
                            style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                            onClick={() => setIsRoleDropdownOpen(false)} 
                          />
                          <div className="custom-dropdown-menu" style={{ opacity: 1, visibility: 'visible', transform: 'translateY(0)', zIndex: 100 }}>
                            {[t('admin_super_administrador', 'Super Administrador'), t('admin_administrador', 'Administrador'), t('admin_moderador', 'Moderador'), t('admin_editor', 'Editor'), 'Membro'].map(role => (
                              <div
                                key={role}
                                className="dropdown-item"
                                onClick={() => {
                                  const currentRoles = formData.cargos.split(',').filter((r: string) => r);
                                  if (!currentRoles.includes(role)) {
                                    setFormData({ ...formData, cargos: [...currentRoles, role].join(',') });
                                  }
                                  setIsRoleDropdownOpen(false);
                                }}
                              >
                                {role}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="tab-pane">
                <div className="form-group">
                  <label style={{ fontSize: 16, color: 'white', marginBottom: 16 }}>{t('admin_cargos', 'Cargos')}</label>
                  <div className="multiselect-placeholder"></div>
                </div>

                <div className="permissions-section" style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>{t('admin_permissoes', 'Permissões')}</h3>

                  <div className="permissions-list">
                    {permissionsGroups.map(group => (
                      <div key={group.id} className={`permission-group ${expandedPermission === group.id ? 'expanded' : ''}`}>
                        <div className="group-header" onClick={() => setExpandedPermission(expandedPermission === group.id ? null : group.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Shield size={16} />
                            <span>{group.label}</span>
                          </div>
                          <ChevronRight size={16} className="arrow-icon" />
                        </div>
                        {expandedPermission === group.id && group.perms.length > 0 && (
                          <div className="group-body">
                            {group.perms.map(perm => (
                              <div key={perm.id} className="permission-item">
                                <div className="perm-info">
                                  <div className="perm-label">{perm.label}</div>
                                  <div className="perm-desc">{perm.desc}</div>
                                </div>
                                <div
                                  className={`custom-switch ${formData.permissions.includes(perm.id) ? 'on' : ''}`}
                                  onClick={() => {
                                    const newPerms = formData.permissions.includes(perm.id)
                                      ? formData.permissions.filter(p => p !== perm.id)
                                      : [...formData.permissions, perm.id];
                                    setFormData({ ...formData, permissions: newPerms });
                                  }}
                                >
                                  <div className="switch-handle"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="toggle-field" style={{ marginTop: 24 }}>
                  <div className="custom-switch">
                    <div className="switch-handle"></div>
                  </div>
                  <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-secondary)' }}>{t('admin_mostrar_permissoes_avancadas', 'Mostrar permissões avançadas')}</span>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="tab-pane">
                <div className="form-group">
                  <label>{user ? t('admin_nova_palavra_passe_deixe_em_branco_para_manter_a_a', 'Nova palavra-passe (deixe em branco para manter a atual)') : 'Palavra-passe'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder={user ? t('admin_sugerimos_uma_palavra_passe_forte', 'Sugerimos uma palavra-passe forte...') : t('admin_introduza_a_palavra_passe', 'Introduza a palavra-passe...')}
                    required={!user}
                    className="form-input"
                    style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white' }}
                  />
                </div>
                
                <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="toggle-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{t('admin_autenticacao_de_dois_fatores_2fa', 'Autenticação de Dois Fatores (2FA)')}</span>
                      <p className="field-hint" style={{ marginTop: 4, maxWidth: '85%' }}>{t('admin_exigir_um_codigo_de_verificacao_adiciona', 'Exigir um código de verificação adicional ao iniciar sessão para proteger a conta.')}</p>
                    </div>
                    <div className="custom-switch">
                      <div className="switch-handle"></div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'white' }}>{t('admin_dispositivos_e_sessoes_ativas', 'Dispositivos e Sessões Ativas')}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{t('admin_windows_11_chrome_browser', 'Windows 11 • Chrome Browser')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{t('admin_lisboa_portugal_sessao_atual', 'Lisboa, Portugal • Sessão Atual')}</div>
                      </div>
                      <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{t('admin_ativo', 'Ativo')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'datetime' && (
              <div className="tab-pane">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('admin_fuso_horario', 'Fuso Horário')}</label>
                    <select 
                      className="form-input" 
                      style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white' }}
                    >
                      <option value="Europe/Lisbon" style={{ background: '#111' }}>{t('admin_europalisboa_wetwest', 'Europa/Lisboa (WET/WEST)')}</option>
                      <option value="Europe/London" style={{ background: '#111' }}>{t('admin_europalondres_gmtbst', 'Europa/Londres (GMT/BST)')}</option>
                      <option value="America/New_York" style={{ background: '#111' }}>{t('admin_americanova_iorque_estedt', 'América/Nova Iorque (EST/EDT)')}</option>
                      <option value="UTC" style={{ background: '#111' }}>{t('admin_tempo_universal_coordenado_utc', 'Tempo Universal Coordenado (UTC)')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('admin_formato_de_data', 'Formato de Data')}</label>
                    <select 
                      className="form-input" 
                      style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'white' }}
                    >
                      <option value="DD/MM/YYYY" style={{ background: '#111' }}>{t('admin_ddmmyyyy_ex_21052026', 'DD/MM/YYYY (Ex: 21/05/2026)')}</option>
                      <option value="YYYY-MM-DD" style={{ background: '#111' }}>{t('admin_yyyy_mm_dd_ex_2026_05_21', 'YYYY-MM-DD (Ex: 2026-05-21)')}</option>
                      <option value="MM/DD/YYYY" style={{ background: '#111' }}>{t('admin_mmddyyyy_ex_05212026', 'MM/DD/YYYY (Ex: 05/21/2026)')}</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="toggle-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{t('admin_formato_de_24_horas', 'Formato de 24 horas')}</span>
                      <p className="field-hint" style={{ marginTop: 4, maxWidth: '85%' }}>{t('admin_utilizar_formato_de_24_horas_ex_1430_em_', 'Utilizar formato de 24 horas (ex: 14:30) em vez do formato de 12 horas (ex: 2:30 PM).')}</p>
                    </div>
                    <div className={t('admin_custom_switch_on', 'custom-switch on')}>
                      <div className="switch-handle"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="tab-pane">
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'white', display: 'block', marginBottom: 4 }}>{t('admin_token_de_acesso_pessoal_api_key', 'Token de Acesso Pessoal (API Key)')}</span>
                  <p className="field-hint" style={{ marginBottom: 16 }}>{t('admin_use_este_token_para_autenticar_os_seus_s', 'Use este token para autenticar os seus scripts ou integrações com a nossa API. Não partilhe este token.')}</p>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={user ? "at_live_51O2x8291hsa7a8hs172" : t('admin_gere_o_utilizador_primeiro_para_criar_tokens_de_ap', 'Gere o utilizador primeiro para criar tokens de API')} 
                      style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#aaa', fontSize: 13, fontFamily: 'monospace' }} 
                    />
                    {user && (
                      <button type="button" className="btn-secondary" style={{ padding: '0 16px', fontSize: 12, height: 'auto' }} onClick={() => showToast('Token copiado!', 'success')}>{t('admin_copiar', 'Copiar')}</button>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'white' }}>{t('admin_limites_de_rate_limit', 'Limites de Rate Limit')}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('admin_limite_de_pedidos_por_minuto', 'Limite de pedidos por minuto:')}</span>
                      <span style={{ color: 'white', fontWeight: 600 }}>{t('admin_60_reqmin', '60 req/min')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('admin_pedidos_efetuados_hoje', 'Pedidos efetuados hoje:')}</span>
                      <span style={{ color: 'white', fontWeight: 600 }}>0 / 10,000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="editor-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>{t('btn_cancel', 'Cancelar')}</button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? t('admin_a_guardar', 'A guardar...') : (user ? t('admin_atualizar_perfil', 'Atualizar Perfil') : t('admin_criar_utilizador', 'Criar Utilizador'))}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .advanced-editor-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0a0a0a;
          z-index: 1000;
          display: flex;
          justify-content: center;
          overflow-y: auto;
          padding: 40px 20px;
        }
        .advanced-editor-container {
          width: 100%;
          max-width: 900px;
          position: relative;
        }
        .editor-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        .editor-back-btn {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-align: left;
          padding: 0;
        }
        .actions-trigger {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--glass-border);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
        }
        
        .user-profile-header {
          display: flex;
          align-items: center;
          gap: 30px;
          margin-bottom: 40px;
        }
        .avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #222;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        .avatar-large img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-edit-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent);
          border: 2px solid #0a0a0a;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .remove-img-btn {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 11px;
          margin-top: 8px;
          cursor: pointer;
          width: 100%;
        }
        .user-info-text h2 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .user-info-text p { color: var(--text-secondary); font-size: 14px; }

        .editor-tabs {
          display: flex;
          gap: 30px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 30px;
        }
        .tab-item {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 12px 0;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
        }
        .tab-item.active {
          color: white;
        }
        .tab-item.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
        }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
          color: white;
        }
        .form-group input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 12px 16px;
          color: white;
          font-size: 14px;
        }
        .input-with-suffix {
          display: flex;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          overflow: hidden;
        }
        .input-with-suffix input { border: none; background: transparent; }
        .suffix-select {
          padding: 0 16px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          border-left: 1px solid rgba(255,255,255,0.1);
        }
        .field-hint {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 8px;
          line-height: 1.6;
        }

        .toggle-field { display: flex; align-items: flex-start; }
        .custom-switch {
          width: 36px;
          height: 20px;
          background: #333;
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .custom-switch.on { background: var(--accent); }
        .switch-handle {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: all 0.3s;
        }
        .custom-switch.on .switch-handle { left: 18px; }

        .roles-tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          min-height: 60px;
          align-items: center;
        }
        .role-tag {
          background: var(--accent);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 10px rgba(229, 9, 21, 0.2);
        }
        .remove-tag-btn {
          background: rgba(0,0,0,0.15);
          border: none;
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .custom-dropdown-wrapper {
          position: relative;
        }
        .add-role-trigger {
          background: rgba(255,255,255,0.05);
          border: 1px dashed rgba(255,255,255,0.2);
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .custom-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          width: 180px;
          padding: 6px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          z-index: 100;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s;
        }
        .custom-dropdown-wrapper:hover .custom-dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        .dropdown-item {
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 13px;
          color: #ccc;
          cursor: pointer;
        }
        .dropdown-item:hover {
          background: var(--accent);
          color: white;
        }

        .permission-group {
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.01);
        }
        .group-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background: rgba(255,255,255,0.02);
        }
        .group-header span { font-size: 13px; font-weight: 600; text-transform: capitalize; }
        .arrow-icon { transition: transform 0.3s; opacity: 0.5; }
        .permission-group.expanded .arrow-icon { transform: rotate(90deg); }
        
        .group-body { padding: 10px 20px 20px; }
        .permission-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .perm-label { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
        .perm-desc { font-size: 11px; color: var(--text-secondary); }

        .editor-footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-cancel {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-save {
          background: var(--accent);
          border: none;
          color: white;
          padding: 12px 40px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(229, 9, 21, 0.3);
        }

        @media (max-width: 1024px) {
          .advanced-editor-overlay {
            padding: 16px 12px;
          }
          .editor-header-bar {
            margin-bottom: 20px;
            gap: 12px;
          }
          .editor-back-btn {
            font-size: 18px;
            white-space: normal;
          }
          .user-profile-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
            margin-bottom: 24px;
          }
          .avatar-section {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .user-info-text h2 {
            font-size: 20px;
            word-break: break-word;
          }
          .editor-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            border-bottom: none;
            overflow-x: visible;
            white-space: normal;
            margin-bottom: 20px;
          }
          .editor-tabs .tab-item {
            padding: 8px 16px;
            font-size: 13px;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 20px;
            flex-shrink: 0;
            color: var(--text-secondary);
            transition: all 0.2s;
          }
          .editor-tabs .tab-item.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
          }
          .editor-tabs .tab-item.active::after {
            display: none;
          }
          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .editor-footer {
            margin-top: 30px;
            padding-top: 20px;
            flex-direction: column-reverse;
            gap: 12px;
          }
          .editor-footer button {
            width: 100%;
            text-align: center;
            justify-content: center;
          }
        }
      `}} />
    </div>
  );
}
