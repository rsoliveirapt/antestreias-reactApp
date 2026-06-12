import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, ShieldCheck, Monitor, Globe, Code2, Trash2, 
  Camera, Save, Check, ShieldAlert, Loader2, Eye, EyeOff,
  ChevronDown, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { API_BASE } from '../config';
import { useTranslation } from '../context/LanguageContext';

interface UserProfile {
  first_name: string;
  last_name: string;
  avatar: string;
  username: string;
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['detalhes', 'password', '2fa', 'sessoes', 'idioma', 'notificacoes', 'eliminar'];
    return validTabs.includes(hash) ? hash : 'detalhes';
  });

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchProfileData = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile.php`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (!data.error) {
        setProfile(data);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const menuItems = [
    { id: 'detalhes', label: t('settings_nav_details', 'Detalhes da conta'), icon: User },
    { id: 'password', label: t('settings_nav_password', 'Palavra-passe'), icon: Lock },
    { id: '2fa', label: t('settings_nav_2fa', 'Autenticação de dois fatores'), icon: ShieldCheck },
    { id: 'sessoes', label: t('settings_nav_sessions', 'Sessões atisons'), icon: Monitor },
    { id: 'idioma', label: t('settings_nav_locale', 'Localização e idioma'), icon: Globe },
    { id: 'notificacoes', label: t('settings_nav_notifications', 'Notificações Push'), icon: Bell },
    { id: 'eliminar', label: t('settings_nav_delete', 'Eliminar conta'), icon: Trash2, danger: true },
  ];

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" size={40} color="var(--accent)" />
    </div>
  );

  return (
    <div className="container settings-page" style={{ paddingTop: 120, paddingBottom: 60 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 10px 0' }}>{t('settings_title', 'Definições de conta')}</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('settings_subtitle', 'Vê e atualiza os detalhes da tua conta, perfil e muito mais.')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 40 }}>
        {/* Mobile Dropdown Navigation */}
        <div className="mobile-only" style={{ position: 'relative', marginBottom: 10, width: '100%' }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {(() => {
              const activeItem = menuItems.find(item => item.id === activeTab);
              const Icon = activeItem?.icon || User;
              return (
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={18} color="var(--accent)" />
                  {activeItem?.label}
                </span>
              );
            })()}
            <span style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', display: 'flex', alignItems: 'center' }}>
              <ChevronDown size={18} />
            </span>
          </button>

          {isDropdownOpen && (
            <>
              <div 
                onClick={() => setIsDropdownOpen(false)} 
                style={{ 
                  position: 'fixed', 
                  inset: 0, 
                  zIndex: 99 
                }} 
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  background: '#1a1a1a',
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                  zIndex: 100,
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  animation: 'dropdownFade 0.2s ease-out'
                }}
              >
                {menuItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        changeTab(item.id);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 8,
                        background: activeTab === item.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                        border: 'none',
                        width: '100%',
                        color: item.danger ? 'var(--accent)' : (activeTab === item.id ? 'white' : 'var(--text-secondary)'),
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => changeTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 15,
                padding: '12px 20px', borderRadius: 12,
                background: activeTab === item.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: item.danger ? 'var(--accent)' : (activeTab === item.id ? 'white' : 'var(--text-secondary)'),
                fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                textAlign: 'left'
              }}
              className="settings-nav-btn"
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </aside>

        <main style={{ minWidth: 0 }}>
          {activeTab === 'detalhes' && <DetailsSection profile={profile} onUpdate={fetchProfileData} refreshUser={refreshUser} />}
          {activeTab === 'password' && <PasswordSection logout={logout} navigate={navigate} />}
          {activeTab === '2fa' && <TwoFactorSection logout={logout} navigate={navigate} />}
          {activeTab === 'sessoes' && <SessionsSection />}
          {activeTab === 'idioma' && <LanguageSection profile={profile} onUpdate={fetchProfileData} />}
          {activeTab === 'notificacoes' && <NotificationsSection />}
          {activeTab === 'eliminar' && <DeleteSection logout={logout} />}
        </main>
      </div>
    </div>
  );
}

function DetailsSection({ profile, onUpdate, refreshUser }: { profile: any, onUpdate: () => void, refreshUser: () => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    username: profile?.username || '',
    email: profile?.email || ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, ...formData }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        onUpdate();
        refreshUser();
        showToast(t('settings_details_save_success', 'Detalhes atualizados com sucesso!'), "success");
      } else {
        showToast(data.error || t('settings_details_save_error', 'Erro ao atualizar detalhes.'), "error");
      }
    } catch (err) {
      showToast(t('settings_details_save_general_error', 'Erro ao guardar.'), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'avatar');

    try {
      const res = await fetch(`${API_BASE}/upload.php`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      
      if (data.success) {
        // Save URL to profile
        await fetch(`${API_BASE}/profile.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...profile, avatar: data.url }),
          credentials: 'include'
        });
        onUpdate();
        refreshUser();
        showToast(t('settings_details_avatar_success', 'Imagem de perfil atualizada!'), "success");
      }
    } catch (err) {
      showToast(t('settings_details_avatar_error', 'Erro no upload da imagem.'), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="metric-card" style={{ padding: 30 }}>
      <h3 style={{ fontSize: 18, marginBottom: 25, fontWeight: 700 }}>{t('settings_details_title', 'Atualizar detalhes da conta')}</h3>
      
      <div style={{ display: 'flex', gap: 40 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="field-group">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('auth_username', 'Nome de utilizador')}</label>
            <input 
              type="text" 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="glass-input" 
              style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }} 
            />
          </div>
          <div className="field-group">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('auth_email', 'E-mail')}</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="glass-input" 
              style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }} 
            />
          </div>
          <div className="field-group">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('settings_details_firstname', 'Nome')}</label>
            <input 
              type="text" 
              value={formData.first_name} 
              onChange={e => setFormData({...formData, first_name: e.target.value})}
              className="glass-input" 
              style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }} 
            />
          </div>
          <div className="field-group">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('settings_details_lastname', 'Apelido')}</label>
            <input 
              type="text" 
              value={formData.last_name}
              onChange={e => setFormData({...formData, last_name: e.target.value})}
              className="glass-input" 
              style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ 
                padding: '12px 30px', borderRadius: 12, border: 'none', 
                background: 'var(--accent)', color: 'white', fontWeight: 700, 
                cursor: 'pointer', opacity: saving ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : null}
              {t('btn_save', 'Guardar')}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 15, display: 'block', textTransform: 'uppercase' }}>{t('settings_details_avatar', 'Imagem de perfil')}</label>
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 30, background: '#2a2a2a', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              {uploading ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : (
                profile?.avatar ? <img src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} style={{ margin: 40, opacity: 0.2 }} />
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} style={{ display: 'none' }} accept="image/*" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: -5, right: -5, width: 32, height: 32, borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <Camera size={16} />
            </button>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 700, marginTop: 15, cursor: 'pointer' }}>{t('settings_details_remove_avatar', 'Remover imagem')}</button>
        </div>
      </div>
    </div>
  );
}

function PasswordSection({ logout, navigate }: { logout: () => void, navigate: any }) {
  const { t } = useTranslation();
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleUpdate = async () => {
    if (!passwords.current_password || !passwords.new_password || !passwords.confirm_password) {
      showToast(t('settings_password_empty_fields', 'Preenche todos os campos.'), "error");
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      showToast(t('settings_password_mismatch', 'As novas palavras-passe não coincidem.'), "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/change_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(data.message || t('settings_password_success', 'Palavra-passe atualizada com sucesso!'), "success");
        setPasswords({ current_password: '', new_password: '', confirm_password: '' });
        // Auto logout for security
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        showToast(data.error || t('settings_password_error', 'Erro ao atualizar palavra-passe.'), "error");
      }
    } catch (err) {
      console.error("Erro na alteração de password:", err);
      showToast(t('settings_password_conn_error', 'Erro na ligação ao servidor.'), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="metric-card" style={{ padding: 30 }}>
      <h3 style={{ fontSize: 18, marginBottom: 25, fontWeight: 700 }}>{t('settings_password_title', 'Atualizar palavra-passe')}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="field-group">
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('settings_current_password', 'Palavra-passe atual')}</label>
          <input 
            type="password" 
            value={passwords.current_password}
            onChange={e => setPasswords({...passwords, current_password: e.target.value})}
            style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }} 
          />
        </div>
        <div className="field-group">
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('settings_new_password', 'Nova palavra-passe')}</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showNewPass ? "text" : "password"} 
              value={passwords.new_password}
              onChange={e => setPasswords({...passwords, new_password: e.target.value})}
              style={{ width: '100%', padding: '12px 45px 12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }} 
            />
            <button 
              type="button"
              tabIndex={-1}
              onClick={() => setShowNewPass(!showNewPass)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="field-group">
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('settings_confirm_password', 'Confirmar palavra-passe')}</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showConfirmPass ? "text" : "password"} 
              value={passwords.confirm_password}
              onChange={e => setPasswords({...passwords, confirm_password: e.target.value})}
              style={{ width: '100%', padding: '12px 45px 12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }} 
            />
            <button 
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button 
            onClick={handleUpdate}
            disabled={loading}
            style={{ 
              padding: '12px 30px', borderRadius: 12, border: 'none', 
              background: 'var(--accent)', color: 'white', fontWeight: 700, 
              cursor: 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {t('settings_update_password', 'Atualizar palavra-passe')}
          </button>
        </div>
      </div>
    </div>
  );
}

function TwoFactorSection({ logout, navigate }: { logout: () => void, navigate: any }) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/two_factor.php?action=status`, { credentials: 'include' });
      const data = await res.json();
      setEnabled(data.enabled);
    } catch (err) {}
    setLoading(false);
  };

  const handleSetup = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/two_factor.php?action=generate`, { credentials: 'include' });
      const data = await res.json();
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      setSecret(data.secret);
      // Use public QR generator API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCodeUrl)}`;
      setQrCodeUrl(qrUrl);
      setSetupMode(true);
    } catch (err: any) {
      console.error("Erro no 2FA Setup:", err);
      showToast(t('settings_2fa_setup_error', 'Erro ao iniciar configuração: ') + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (code.length !== 6) {
      showToast(t('settings_2fa_code_short', 'Introduz o código de 6 dígitos.'), "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/two_factor.php?action=confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('settings_2fa_success_enabled', 'Autenticação de dois fatores ativada!'), "success");
        setEnabled(true);
        setSetupMode(false);
        // Force logout for security verification
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
      } else {
        showToast(data.error || t('settings_2fa_confirm_error', 'Erro ao confirmar código.'), "error");
      }
    } catch (err) {
      showToast(t('settings_2fa_confirm_error', 'Erro ao confirmar código.'), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = () => {
    setShowDisableConfirm(true);
  };

  const executeDisable = async () => {
    setShowDisableConfirm(false);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/two_factor.php?action=disable`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        showToast(t('settings_2fa_success_disabled', '2FA desativado.'), "success");
        setEnabled(false);
      } else {
        showToast(data.error || t('settings_2fa_disable_error', 'Erro ao desativar 2FA.'), "error");
      }
    } catch (err) {
      showToast(t('settings_2fa_disable_error', 'Erro ao desativar 2FA.'), "error");
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="metric-card" style={{ padding: 30, display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="metric-card" style={{ padding: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
        <div style={{ 
          width: 45, height: 45, borderRadius: 12, 
          background: enabled ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: enabled ? '#4caf50' : 'white'
        }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t('settings_2fa_title', 'Autenticação de dois fatores')}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {enabled ? t('settings_2fa_enabled_status', 'A tua conta está protegida com um nível extra de segurança.') : t('settings_2fa_disabled_status', 'Adiciona uma camada extra de segurança à tua conta.')}
          </p>
        </div>
      </div>

      {!enabled && !setupMode && (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>
            {t('settings_2fa_description', 'Quando a autenticação de dois fatores estiver ativa, ser-te-á solicitado um token seguro e aleatório durante a autenticação. Podes obter este token através da aplicação Google Authenticator no teu telemóvel.')}
          </p>
          <button 
            onClick={handleSetup}
            disabled={actionLoading}
            style={{ 
              padding: '12px 30px', borderRadius: 12, border: 'none', 
              background: 'var(--accent)', color: 'white', fontWeight: 700, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {actionLoading && <Loader2 className="animate-spin" size={18} />}
            {t('settings_2fa_enable_btn', 'Ativar 2FA')}
          </button>
        </div>
      )}

      {setupMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
            <div style={{ padding: 15, background: 'white', borderRadius: 15 }}>
              <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: 180, height: 180 }} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{t('settings_2fa_setup_title', 'Configura a tua aplicação')}</h4>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 15 }}>
                {t('settings_2fa_setup_step1', '1. Instala a app Google Authenticator.')}<br />
                {t('settings_2fa_setup_step2', '2. Abre a app e seleciona "Ler código QR".')}<br />
                {t('settings_2fa_setup_step3', '3. Lê o código ao lado com o teu telemóvel.')}
              </p>
              <div style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px dashed var(--glass-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t('settings_2fa_manual_code', 'Ou introduz este código manualmente:')}</span>
                <code style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>{secret}</code>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 25 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', display: 'block' }}>{t('settings_2fa_code_label', 'Código de 6 dígitos')}</label>
            <div style={{ display: 'flex', gap: 15 }}>
              <input 
                type="text" 
                maxLength={6}
                placeholder={t('settings_2fa_code_placeholder', '000 000')}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none', fontSize: 18, letterSpacing: 5, textAlign: 'center' }} 
              />
              <button 
                onClick={handleConfirm}
                disabled={actionLoading}
                style={{ padding: '0 30px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {actionLoading && <Loader2 className="animate-spin" size={18} />}
                {t('settings_2fa_confirm_btn', 'Confirmar e Ativar')}
              </button>
              <button 
                onClick={() => setSetupMode(false)}
                style={{ padding: '0 20px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                {t('btn_cancel', 'Cancelar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {enabled && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(76, 175, 80, 0.05)', borderRadius: 15, border: '1px solid rgba(76, 175, 80, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4caf50' }}>
            <Check size={20} />
            <span style={{ fontWeight: 600 }}>{t('settings_2fa_active_message', 'O 2FA está ativo e configurado.')}</span>
          </div>
          <button 
            onClick={handleDisable}
            disabled={actionLoading}
            style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
          >
            {t('settings_2fa_disable_btn', 'Desativar 2FA')}
          </button>
        </div>
      )}

      <ConfirmModal 
        isOpen={showDisableConfirm}
        title={t('settings_2fa_modal_title', 'Desativar 2FA?')}
        message={t('settings_2fa_modal_message', 'Ao desativar a autenticação de dois fatores, a tua conta ficará menos protegida contra acessos não autorizados. Tens a certeza?')}
        confirmLabel={t('settings_2fa_modal_confirm', 'Desativar Segurança')}
        cancelLabel={t('settings_2fa_modal_cancel', 'Manter Ativo')}
        onConfirm={executeDisable}
        onCancel={() => setShowDisableConfirm(false)}
        variant="danger"
      />
    </div>
  );
}

function SessionsSection() { 
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions.php`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setSessions(data.sessions || []);
    } catch (err) {}
    setLoading(false);
  };

  const handleLogoutOthers = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sessions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_all_others' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('settings_sessions_terminate_others_success', 'Sessões terminadas com sucesso!'), 'success');
        fetchSessions();
      }
    } catch(err) {}
    setActionLoading(false);
  };

  const handleLogoutSession = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sessions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: sessionId }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast(t('settings_sessions_terminate_single_success', 'Sessão terminada!'), 'success');
        fetchSessions();
      }
    } catch(err) {}
    setActionLoading(false);
  };

  function parseUserAgent(ua: string) {
    let device = t('settings_sessions_unknown_device', 'Dispositivo Desconhecido');
    if (ua.includes('Windows')) device = 'Windows';
    else if (ua.includes('Mac')) device = 'Mac';
    else if (ua.includes('Linux')) device = 'Linux';
    else if (ua.includes('Android')) device = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) device = 'iOS';
    
    let browser = t('settings_sessions_unknown_browser', 'Navegador Desconhecido');
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    return `${device} - ${browser}`;
  }

  if (loading) return <div className="metric-card" style={{ padding: 30, display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" size={24} /></div>;

  return (
    <div className="metric-card" style={{ padding: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t('settings_sessions_title', 'Sessões ativas')}</h3>
        {sessions.length > 1 && (
          <button 
            onClick={handleLogoutOthers}
            disabled={actionLoading}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            {actionLoading ? t('settings_sessions_terminating', 'A terminar...') : t('settings_sessions_terminate_others', 'Terminar outras sessões')}
          </button>
        )}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>
        {t('settings_sessions_description', 'Se necessário, podes terminar sessão em todas as tuas outras sessões de navegador em todos os teus dispositivos. As tuas sessões recentes estão listadas abaixo. Se sentires que a tua conta foi comprometida, deves também atualizar a tua palavra-passe.')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sessions.map((session, idx) => (
          <SessionItem 
            key={idx}
            device={parseUserAgent(session.user_agent)} 
            ip={session.ip_address} 
            current={session.is_current} 
            time={session.is_current ? '' : (session.last_activity || t('settings_sessions_time_recent', 'Recentemente'))} 
            onDelete={() => handleLogoutSession(session.id || session.session_id)}
            isDeleting={actionLoading}
          />
        ))}
      </div>
    </div>
  ); 
}

function LanguageSection({ profile, onUpdate }: { profile: any, onUpdate: () => void }) { 
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    language: profile?.language || 'pt',
    country: profile?.country || 'Portugal',
    timezone: profile?.timezone || 'UTC'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, ...formData }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        onUpdate();
        showToast(t('settings_locale_save_success', 'Definições de localização atualizadas!'), "success");
      } else {
        showToast(data.error || t('settings_locale_save_error', 'Erro ao guardar.'), "error");
      }
    } catch (err) {
      showToast(t('settings_locale_save_error', 'Erro ao guardar.'), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="metric-card" style={{ padding: 30 }}>
      <h3 style={{ fontSize: 18, marginBottom: 25, fontWeight: 700 }}>{t('settings_locale_title', 'Data, hora e idioma')}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="field-group">
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('settings_locale_lang', 'Idioma')}</label>
          <select 
            value={formData.language}
            onChange={e => setFormData({...formData, language: e.target.value})}
            className="glass-input"
            style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }}
          >
            <option value="pt">{t('settings_locale_lang_pt', 'Português')}</option>
            <option value="en">{t('settings_locale_lang_en', 'Inglês')}</option>
            <option value="es">{t('settings_locale_lang_es', 'Espanhol')}</option>
            <option value="fr">{t('settings_locale_lang_fr', 'Francês')}</option>
          </select>
        </div>
        
        <div className="field-group">
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('settings_locale_country', 'País')}</label>
          <select 
            value={formData.country}
            onChange={e => setFormData({...formData, country: e.target.value})}
            className="glass-input"
            style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }}
          >
            <option value="Portugal">{t('settings_locale_country_pt', 'Portugal')}</option>
            <option value="Brasil">{t('settings_locale_country_br', 'Brasil')}</option>
            <option value="Angola">{t('settings_locale_country_ao', 'Angola')}</option>
            <option value="Moçambique">{t('settings_locale_country_mz', 'Moçambique')}</option>
            <option value="USA">{t('settings_locale_country_us', 'Estados Unidos')}</option>
            <option value="UK">{t('settings_locale_country_uk', 'Reino Unido')}</option>
          </select>
        </div>
        
        <div className="field-group">
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{t('settings_locale_timezone', 'Fuso horário')}</label>
          <select 
            value={formData.timezone}
            onChange={e => setFormData({...formData, timezone: e.target.value})}
            className="glass-input"
            style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }}
          >
            <option value="UTC">{t('settings_locale_timezone_utc', 'UTC (Padrão)')}</option>
            <option value="Europe/Lisbon">{t('settings_locale_timezone_lisbon', 'Lisboa (GMT+0/1)')}</option>
            <option value="Europe/London">{t('settings_locale_timezone_london', 'Londres (GMT+0/1)')}</option>
            <option value="America/Sao_Paulo">{t('settings_locale_timezone_saopaulo', 'São Paulo (GMT-3)')}</option>
            <option value="Europe/Paris">{t('settings_locale_timezone_paris', 'Paris (GMT+1/2)')}</option>
            <option value="America/New_York">{t('settings_locale_timezone_newyork', 'Nova Iorque (GMT-5/4)')}</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ padding: '12px 30px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving && <Loader2 className="animate-spin" size={18} />}
            {t('btn_save', 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  ); 
}

function DeleteSection({ logout }: { logout: () => void }) { 
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      showToast(t('settings_delete_password_empty', 'Insere a tua palavra-passe para confirmar.'), "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/delete_account.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(t('settings_delete_success', 'Conta eliminada com sucesso. Até breve!'), "success");
        setTimeout(() => {
          logout();
          window.location.href = '/';
        }, 2000);
      } else {
        showToast(data.error || t('settings_delete_error', 'Erro ao eliminar conta.'), "error");
      }
    } catch (err) {
      showToast(t('settings_delete_network_error', 'Erro de rede.'), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = () => {
    window.location.href = 'mailto:info@antestreias.com?subject=Solicitação de Apagamento de Dados (RGPD)&body=Olá equipa do Antestreias,%0A%0ASolicito o apagamento de todos os meus dados pessoais associados a esta conta nos termos do RGPD.%0A%0AObrigado.';
    showToast(t('settings_delete_rgpd_toast', 'A abrir cliente de e-mail para info@antestreias.com'), "success");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      <div className="metric-card" style={{ padding: 30, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h3 style={{ fontSize: 18, marginBottom: 15, fontWeight: 700 }}>{t('settings_delete_rgpd_title', 'Solicitar apagamento dos dados (RGPD)')}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 25 }}>
          {t('settings_delete_rgpd_desc', 'Nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD), tens o direito ao esquecimento. Podes solicitar à nossa equipa de proteção de dados a remoção e expurgo completo de todos os teus dados pessoais, históricos de passatempos e registos de atividade.')}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap' }}>
          <button 
            onClick={handleRequestDeletion}
            style={{ padding: '12px 25px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {t('settings_delete_rgpd_btn', 'Solicitar Apagamento (info@antestreias.com)')}
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('settings_delete_rgpd_time', 'Tempo de resposta estimado: 24h a 48h')}</span>
        </div>
      </div>

      <div className="metric-card" style={{ padding: 30, border: '1px solid rgba(229, 9, 21, 0.2)' }}>
        <h3 style={{ fontSize: 18, marginBottom: 15, fontWeight: 700, color: 'var(--accent)' }}>{t('settings_delete_danger_title', 'Zona de perigo (Eliminação Automática)')}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 25 }}>
          {t('settings_delete_danger_desc', 'Podes também eliminar a tua conta imediatamente de forma autónoma. Uma vez eliminada, não há volta a dar. Todos os teus dados, listas e preferências serão removidos permanentemente.')}
        </p>

        {!showConfirm ? (
          <button 
            onClick={() => setShowConfirm(true)}
            className="btn-primary" 
            style={{ padding: '12px 25px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
          >
            {t('settings_delete_danger_btn', 'Eliminar minha conta imediatamente')}
          </button>
        ) : (
          <div style={{ background: 'rgba(229, 9, 21, 0.05)', padding: 20, borderRadius: 12, border: '1px solid rgba(229, 9, 21, 0.2)' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 10, display: 'block', textTransform: 'uppercase' }}>
              {t('settings_delete_confirm_label', 'Confirma a tua palavra-passe')}
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('settings_delete_confirm_placeholder', 'Digita a tua password...')}
                style={{ flex: 1, padding: '12px 15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 10, color: 'white', outline: 'none' }}
              />
              <button 
                onClick={handleDelete}
                disabled={loading}
                style={{ padding: '0 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                {t('btn_confirm', 'Confirmar')}
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                style={{ padding: '0 20px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                {t('btn_cancel', 'Cancelar')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ); 
}

function FormGroup({ label, type = 'text' }: { label: string, type?: string }) { 
  const { t } = useTranslation();
  return (
    <div className="field-group">
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{label}</label>
      <input type={type} style={{ width: '100%', padding: '12px 15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 12, color: 'white', outline: 'none' }} />
    </div>
  ); 
}

function SessionItem({ device, ip, current, time, onDelete, isDeleting }: { device: string, ip: string, current?: boolean, time?: string, onDelete?: () => void, isDeleting?: boolean }) { 
  const { t } = useTranslation();
  const [location, setLocation] = useState(t('settings_sessions_getting_location', 'A obter localização...'));

  useEffect(() => {
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
      setLocation(t('settings_sessions_local_network', 'Local (Rede Privada)'));
      return;
    }

    fetch(`https://ipapi.co/${ip}/json/`)
      .then(res => res.json())
      .then(data => {
        if (data.city && data.country_name) {
          setLocation(`${data.city}, ${data.country_name}`);
        } else {
          setLocation(ip);
        }
      })
      .catch(() => setLocation(ip));
  }, [ip]);

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ color: 'var(--text-secondary)' }}><Monitor size={32} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{device}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{location}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.8 }}>
          {ip} {current && <span style={{ color: '#22c55e', fontWeight: 700 }}>{t('settings_sessions_current_device', '- Este dispositivo')}</span>}
          {time && <span> - {time}</span>}
        </div>
      </div>
      {!current && onDelete && (
        <button 
          onClick={onDelete}
          disabled={isDeleting}
          style={{ background: 'transparent', border: '1px solid rgba(255,68,68,0.3)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          {isDeleting ? '...' : t('settings_sessions_terminate_btn', 'Terminar')}
        </button>
      )}
    </div>
  ); 
}

function NotificationsSection() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setLoading(false);
      return;
    }

    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Erro ao verificar subscrição:', err);
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      showToast(t('settings_push_unsupported', 'O seu navegador não suporta notificações Push.'), 'error');
      return;
    }

    setActionLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        showToast(t('settings_push_permission_denied', 'Permissão de notificações recusada.'), 'error');
        setActionLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Public VAPID key
      const publicKey = 'BPtpDmLkHk8xqr26ilJuLU9tPCJ9skL0izYIuhuhi1jX6N8DrrUd9J1VG2knykhIK61sVTpimGKx_AUDUgcnrY8';
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to backend
      const res = await fetch(`${API_BASE}/push_subscribe.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
        credentials: 'include'
      });
      const data = await res.json();

      if (data.success) {
        setIsSubscribed(true);
        showToast(t('settings_push_subscribed_success', 'Notificações ativadas com sucesso!'), 'success');
      } else {
        showToast(data.error || t('settings_push_subscribe_error', 'Erro ao guardar subscrição no servidor.'), 'error');
      }
    } catch (err: any) {
      console.error('Erro ao subscrever:', err);
      showToast(t('settings_push_subscribe_failed', 'Falha ao ativar notificações: ') + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setActionLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        showToast(t('settings_push_unsubscribed_success', 'Notificações desativadas neste navegador.'), 'success');
      }
    } catch (err: any) {
      console.error('Erro ao desativar notificações:', err);
      showToast(t('settings_push_unsubscribe_failed', 'Falha ao desativar notificações.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="metric-card" style={{ padding: 30, display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

  return (
    <div className="metric-card" style={{ padding: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 25 }}>
        <div style={{ 
          width: 45, height: 45, borderRadius: 12, 
          background: isSubscribed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isSubscribed ? '#4caf50' : 'white'
        }}>
          <Bell size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t('settings_push_title', 'Notificações Push')}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {isSubscribed ? t('settings_push_enabled_status', 'Tens as notificações push ativadas neste dispositivo.') : t('settings_push_disabled_status', 'Recebe alertas sobre antevisões, passatempos e críticas.')}
          </p>
        </div>
      </div>

      {!isSupported && (
        <div style={{ background: 'rgba(255, 68, 68, 0.05)', padding: 20, borderRadius: 12, border: '1px solid rgba(255, 68, 68, 0.2)' }}>
          <p style={{ color: 'var(--accent)', margin: 0, fontSize: 14 }}>
            {t('settings_push_unsupported_desc', 'O teu navegador ou dispositivo não suporta notificações Push. No iOS, certifica-te de que instalaste a aplicação a partir do ecrã principal primeiro.')}
          </p>
        </div>
      )}

      {isSupported && permission === 'denied' && (
        <div style={{ background: 'rgba(255, 68, 68, 0.05)', padding: 20, borderRadius: 12, border: '1px solid rgba(255, 68, 68, 0.2)', marginBottom: 20 }}>
          <p style={{ color: 'var(--accent)', margin: 0, fontSize: 14 }}>
            {t('settings_push_denied_desc', 'Bloqueaste as notificações nas definições deste navegador. Para as receberes, por favor ativa as permissões de notificação do site nas definições do teu navegador.')}
          </p>
        </div>
      )}

      {isSupported && permission !== 'denied' && (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>
            {t('settings_push_description', 'Ao ativar as notificações push, receberás alertas instantâneos no teu telemóvel ou computador sempre que publicarmos novas antevisões de cinema, novos passatempos ou novas críticas de filmes e séries.')}
          </p>
          
          {isSubscribed ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(76, 175, 80, 0.05)', borderRadius: 15, border: '1px solid rgba(76, 175, 80, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4caf50' }}>
                <Check size={20} />
                <span style={{ fontWeight: 600 }}>{t('settings_push_active_message', 'Notificações estão ativas neste navegador.')}</span>
              </div>
              <button 
                onClick={handleUnsubscribe}
                disabled={actionLoading}
                style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
              >
                {t('settings_push_disable_btn', 'Desativar')}
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSubscribe}
              disabled={actionLoading}
              style={{ 
                padding: '12px 30px', borderRadius: 12, border: 'none', 
                background: 'var(--accent)', color: 'white', fontWeight: 700, 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              {actionLoading && <Loader2 className="animate-spin" size={18} />}
              {t('settings_push_enable_btn', 'Ativar Notificações')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
