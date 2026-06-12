import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../components/Toast';
import { 
  ChevronRight, Plus, GripVertical, X, LayoutDashboard, Film, Tv, Users, Settings, 
  List, MessageSquare, Languages, Bell, Search, Mail, Database, Lock, Shield, 
  Globe, Clock, Activity, FileText, Image, Video, Home, Star, Heart, Info, 
  HelpCircle, Bookmark, Calendar, Camera, Check, Circle, Cloud, Compass, 
  CreditCard, Download, Edit, Eye, LogOut, Map, Mic, Moon, Sun, Music, Phone, 
  Play, PlusCircle, ShoppingBag, Zap, Trash2, BarChart3, Palette, ClipboardList, 
  User, Users2, LayoutGrid, Clapperboard, Contact, Newspaper, PlayCircle, 
  ListChecks, MessageSquarePlus, MessageSquareText, ChevronDown
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { API_BASE, apiFetch } from '../../config';
import { useTranslation } from '../../context/LanguageContext';

interface MenuItem {
  id: string | number;
  label: string;
  url: string;
  icon?: string;
  order: number;
}

interface Menu {
  id: number;
  name: string;
  position: string;
}

export default function AdminMenus() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [modal, setModal] = useState({ open: false, title: '', message: '', onConfirm: () => {} });
  const [collapsedItems, setCollapsedItems] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/admin_menus.php`);
      const data = await res.json();
      setMenus(data);
      if (data.length > 0 && !selectedMenu) {
        selectMenu(data[0]);
      }
      setLoading(false);
    } catch (err) {
      showToast('Erro ao carregar menus.', 'error');
    }
  };

  const openMenuEditor = (menu: Menu) => {
    selectMenu(menu);
    setView('edit');
  };

  const deleteMenu = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setModal({
      open: true,
      title: t('admin_remover_menu', 'Remover Menu'),
      message: t('admin_tem_a_certeza_que_deseja_remover_este_menu_e_todos', 'Tem a certeza que deseja remover este menu e todos os seus itens? Esta ação não pode ser desfeita.'),
      onConfirm: async () => {
        try {
          const res = await apiFetch(`${API_BASE}/admin_menus.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delete_menu: id })
          });
          const data = await res.json();
          if (data.success) {
            showToast(t('admin_menu_removido_com_sucesso', 'Menu removido com sucesso!'));
            fetchMenus();
            if (selectedMenu?.id === id) {
              setSelectedMenu(null);
              setView('list');
            }
          }
        } catch (err) {
          showToast('Erro ao remover menu.', 'error');
        }
        setModal(m => ({ ...m, open: false }));
      }
    });
  };

  const selectMenu = async (menu: Menu) => {
    setSelectedMenu(menu);
    setHasChanges(false);
    try {
      const res = await apiFetch(`${API_BASE}/admin_menus.php?id=${menu.id}`);
      const data = await res.json();
      setItems(data.items);
    } catch (err) {
      showToast('Erro ao carregar itens do menu.', 'error');
    }
  };

  const addItem = () => {
    const newItem: MenuItem = {
      id: `new-${Date.now()}`,
      label: t('admin_novo_item', 'Novo Item'),
      url: '/',
      order: items.length
    };
    setItems([...items, newItem]);
    setHasChanges(true);
  };

  const seedDefaults = () => {
    if (!selectedMenu) return;
    
    let defaults: Omit<MenuItem, 'id'>[] = [];
    
    if (selectedMenu.name === t('admin_admin_sidebar', 'Admin Sidebar') || selectedMenu.position === 'admin_sidebar') {
      defaults = [
        { label: t('admin_metricas', 'Métricas'), url: '/admin', icon: 'BarChart3', order: 0 },
        { label: 'Temas', url: '/admin/settings/themes', icon: 'Palette', order: 1 },
        { label: 'Definições', url: '/admin/settings', icon: 'Settings', order: 2 },
        { label: 'RGPD', url: '/admin/rgpd', icon: 'ClipboardList', order: 3 },
        { label: 'Utilizadores', url: '/admin/users', icon: 'User', order: 4 },
        { label: 'Artistas', url: '/admin/artists', icon: 'Users2', order: 5 },
        { label: 'Geral', url: '/admin/general', icon: 'LayoutGrid', order: 6 },
        { label: 'Filmes', url: '/admin/movies', icon: 'Clapperboard', order: 7 },
        { label: 'Séries', url: '/admin/series', icon: 'Contact', order: 8 },
        { label: 'Notícias', url: '/admin/news', icon: 'Newspaper', order: 9 },
        { label: 'Vídeos', url: '/admin/videos', icon: 'PlayCircle', order: 10 },
        { label: 'Canais', url: '/admin/channels', icon: 'ListChecks', order: 11 },
        { label: 'Contactos', url: '/admin/contacts', icon: 'MessageSquareText', order: 12 },
      ];
    } else if (selectedMenu.name === 'Primary') {
      defaults = [
        { label: 'Filmes', url: '/movies', order: 0 },
        { label: 'Séries', url: '/series', order: 1 },
        { label: 'Listas', url: '/lists', order: 2 },
        { label: 'Brevemente', url: '/upcoming', order: 3 },
      ];
    }

    if (defaults.length > 0) {
      setItems(defaults.map((d, i) => ({ ...d, id: `new-${Date.now()}-${i}` })));
      setHasChanges(true);
      showToast(t('admin_itens_padrao_carregados_clique_em_guarda', 'Itens padrão carregados. Clique em Guardar para confirmar.'));
    } else {
      showToast('Nenhum padrão definido para este menu.', 'error');
    }
  };

  const updateItem = (id: string | number, field: keyof MenuItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    setHasChanges(true);
  };

  const deleteItem = async (id: string | number) => {
    if (typeof id === 'string' && id.startsWith('new-')) {
      setItems(items.filter(item => item.id !== id));
      return;
    }

    try {
      const res = await apiFetch(`${API_BASE}/admin_menus.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_item: id })
      });
      const data = await res.json();
      if (data.success) {
        setItems(items.filter(item => item.id !== id));
        showToast(t('admin_item_removido', 'Item removido!'));
      }
    } catch (err) {
      showToast('Erro ao remover item.', 'error');
    }
  };

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newItems = [...items];
    const itemToMove = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, itemToMove);
    
    // Update orders
    const updatedItems = newItems.map((item, idx) => ({ ...item, order: idx }));
    setItems(updatedItems);
    setDraggedItemIndex(index);
    setHasChanges(true);
  };

  const toggleCollapse = (id: string | number) => {
    setCollapsedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedMenu) return;
    setIsSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/admin_menus.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu_id: selectedMenu.id, items: items })
      });
      
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { throw new Error(text); }

      if (data.success) {
        showToast(t('admin_menu_guardado_com_sucesso', 'Menu guardado com sucesso!'));
        setHasChanges(false);
        selectMenu(selectedMenu);
      } else {
        throw new Error(data.error || t('admin_erro_ao_processar_pedido', 'Erro ao processar pedido'));
      }
    } catch (err: any) {
      console.error(t('admin_save_error', 'Save error:'), err);
      showToast(`Erro ao guardar: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const [showIconPicker, setShowIconPicker] = useState<{ itemId: string | number } | null>(null);
  const [iconSearch, setIconSearch] = useState('');

  const iconsList = [
    { name: 'LayoutDashboard', Icon: LayoutDashboard },
    { name: 'Film', Icon: Film },
    { name: 'Tv', Icon: Tv },
    { name: 'Users', Icon: Users },
    { name: 'Settings', Icon: Settings },
    { name: 'List', Icon: List },
    { name: 'MessageSquare', Icon: MessageSquare },
    { name: 'Languages', Icon: Languages },
    { name: 'Bell', Icon: Bell },
    { name: 'Search', Icon: Search },
    { name: 'Mail', Icon: Mail },
    { name: 'Database', Icon: Database },
    { name: 'Lock', Icon: Lock },
    { name: 'Shield', Icon: Shield },
    { name: 'Globe', Icon: Globe },
    { name: 'Clock', Icon: Clock },
    { name: 'Activity', Icon: Activity },
    { name: 'FileText', Icon: FileText },
    { name: 'Image', Icon: Image },
    { name: 'Video', Icon: Video },
    { name: 'Home', Icon: Home },
    { name: 'Star', Icon: Star },
    { name: 'Heart', Icon: Heart },
    { name: 'Info', Icon: Info },
    { name: 'HelpCircle', Icon: HelpCircle },
    { name: 'Bookmark', Icon: Bookmark },
    { name: 'Calendar', Icon: Calendar },
    { name: 'Camera', Icon: Camera },
    { name: 'Check', Icon: Check },
    { name: 'Circle', Icon: Circle },
    { name: 'Cloud', Icon: Cloud },
    { name: 'Compass', Icon: Compass },
    { name: 'CreditCard', Icon: CreditCard },
    { name: 'Download', Icon: Download },
    { name: 'Edit', Icon: Edit },
    { name: 'Eye', Icon: Eye },
    { name: 'LogOut', Icon: LogOut },
    { name: 'Map', Icon: Map },
    { name: 'Mic', Icon: Mic },
    { name: 'Moon', Icon: Moon },
    { name: 'Sun', Icon: Sun },
    { name: 'Music', Icon: Music },
    { name: 'Phone', Icon: Phone },
    { name: 'Play', Icon: Play },
    { name: 'PlusCircle', Icon: PlusCircle },
    { name: 'ShoppingBag', Icon: ShoppingBag },
    { name: 'Zap', Icon: Zap },
    { name: 'BarChart3', Icon: BarChart3 },
    { name: 'Palette', Icon: Palette },
    { name: 'ClipboardList', Icon: ClipboardList },
    { name: 'User', Icon: User },
    { name: 'Users2', Icon: Users2 },
    { name: 'LayoutGrid', Icon: LayoutGrid },
    { name: 'Clapperboard', Icon: Clapperboard },
    { name: 'Contact', Icon: Contact },
    { name: 'Newspaper', Icon: Newspaper },
    { name: 'PlayCircle', Icon: PlayCircle },
    { name: 'ListChecks', Icon: ListChecks },
    { name: 'MessageSquarePlus', Icon: MessageSquarePlus },
    { name: 'MessageSquareText', Icon: MessageSquareText },
  ];

  const filteredIcons = iconsList.filter(i => 
    i.name.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const getIconComponent = (name: string) => {
    const icon = iconsList.find(i => i.name === name);
    if (icon) return <icon.Icon size={18} />;
    return <HelpCircle size={18} />;
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-primary)' }}>{t('admin_a_carregar_menus', 'A carregar menus...')}</div>;

  return (
    <div className="menu-customizer-layout">
      {/* Icon Picker Modal */}
      {showIconPicker && (
        <div className="custom-modal-overlay">
          <div className="custom-modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{t('admin_escolher_icone', 'Escolher Ícone')}</h3>
              <button className="close-btn" onClick={() => { setShowIconPicker(null); setIconSearch(''); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder={t('admin_pesquisar_icones', 'Pesquisar ícones...')} 
                  value={iconSearch}
                  onChange={e => setIconSearch(e.target.value)}
                />
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: t('admin_repeat_6_1fr', 'repeat(6, 1fr)'), 
                gap: 12,
                maxHeight: 400,
                overflowY: 'auto',
                paddingRight: 5
              }}>
                {filteredIcons.map(icon => (
                  <button 
                    key={icon.name}
                    className="icon-select-btn"
                    title={icon.name}
                    onClick={() => {
                      updateItem(showIconPicker.itemId, 'icon', icon.name);
                      setShowIconPicker(null);
                      setIconSearch('');
                    }}
                  >
                    <icon.Icon size={20} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Editor */}
      <div className="customizer-sidebar">
        <div className="customizer-header">
           <button className="icon-btn" title="Fechar" onClick={() => navigate('/admin/settings')}>
             <X size={20} />
           </button>
           <h2 style={{ fontSize: 16, fontWeight: 600 }}>{t('admin_editor_de_aparencia', 'Editor de aparência')}</h2>
            {view === 'edit' && (
              <button 
                className={`save-btn ${isSaving ? 'loading' : ''}`} 
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? '...' : (hasChanges ? 'Guardar' : 'Guardado')}
              </button>
            )}
        </div>

        <div className="customizer-breadcrumb">
          {view === 'edit' && (
            <button className="back-btn" onClick={() => setView('list')}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
          <div style={{ flex: 1, paddingLeft: view === 'edit' ? 0 : 40 }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{t('admin_a_personalizar', 'A personalizar')}</p>
            <h3 style={{ fontSize: 15, margin: 0, color: 'var(--accent)' }}>
              {view === 'edit' && selectedMenu ? selectedMenu.name : 'Menus'}
            </h3>
          </div>
        </div>

        <div className="customizer-content">
          {view === 'list' ? (
            <div className="menu-selection-list">
              {menus.map(menu => (
                <div 
                  key={menu.id} 
                  className={`menu-list-item ${selectedMenu?.id === menu.id ? 'active' : ''}`}
                  onClick={() => openMenuEditor(menu)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{menu.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{menu.position}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="action-btn delete" 
                      onClick={(e) => deleteMenu(e, menu.id)}
                      title={t('admin_remover_menu', 'Remover Menu')}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}
              
              <button className="add-menu-custom-btn">
                <Plus size={16} /> {t('admin_criar_menu', 'Criar menu')}
              </button>
            </div>
          ) : (
            <div className="menu-items-custom-editor">
              <div className="custom-items-stack">
                {items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{t('admin_este_menu_ainda_nao_tem_itens', 'Este menu ainda não tem itens.')}</p>
                    <button className="btn-secondary" onClick={seedDefaults} style={{ fontSize: 12 }}>
                      {t('admin_importar_itens_padrao', 'Importar itens padrão')}
                    </button>
                  </div>
                )}
                {items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="custom-item-card"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={() => setDraggedItemIndex(null)}
                    style={{ opacity: draggedItemIndex === index ? 0.5 : 1 }}
                  >
                    <div className="item-header" onClick={() => toggleCollapse(item.id)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div 
                          className="drag-handle-sm" 
                          style={{ cursor: 'grab' }} 
                          onClick={(e) => e.stopPropagation()}
                          onDragStart={() => handleDragStart(index)}
                        >
                          <GripVertical size={14} />
                        </div>
                        {collapsedItems.has(item.id) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="del-btn" onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}><X size={14} /></button>
                      </div>
                    </div>
                    {!collapsedItems.has(item.id) && (
                      <div className="item-body">
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div className="field-group" style={{ flex: 1 }}>
                            <label>{t('admin_etiqueta', 'Etiqueta')}</label>
                            <input 
                              type="text" 
                              value={item.label} 
                              onChange={e => updateItem(item.id, 'label', e.target.value)} 
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="field-group" style={{ width: 60 }}>
                            <label>{t('admin_icone', 'Ícone')}</label>
                            <button 
                              className="icon-picker-trigger"
                              onClick={(e) => { e.stopPropagation(); setShowIconPicker({ itemId: item.id }); }}
                            >
                              {getIconComponent(item.icon || '')}
                            </button>
                          </div>
                        </div>
                        <div className="field-group">
                          <label>{t('admin_link_url', 'Link (URL)')}</label>
                          <input 
                            type="text" 
                            value={item.url} 
                            onChange={e => updateItem(item.id, 'url', e.target.value)} 
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button className="add-item-custom-btn" onClick={addItem}>
                <Plus size={16} /> {t('admin_adicionar_item', 'Adicionar item')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="customizer-preview">
        <div className="preview-container">
          <div className="preview-browser-header">
            <div className="browser-dots">
              <span></span><span></span><span></span>
            </div>
            <div className="browser-address">
              http://localhost/antestreias/v2/preview
            </div>
          </div>
          
          <div className="preview-frame-content">
             <div className="mock-navbar-live">
               <div className="mock-logo-live"></div>
               <div className="mock-links-live">
                 {items.map(item => (
                   <span key={item.id}>{item.label}</span>
                 ))}
               </div>
             </div>

             <div className="mock-hero-live">
                <h2>{t('admin_wicked', 'Wicked')}</h2>
                <p>{t('admin_a_historia_nunca_contada_das_bruxas_de_o', 'A história nunca contada das bruxas de Oz.')}</p>
             </div>

             <div className="mock-grid-live">
                {[1,2,3,4,5,6].map(i => <div key={i} className="mock-card-live"></div>)}
             </div>
          </div>
        </div>
      </div>
      <ConfirmModal 
        isOpen={modal.open}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(m => ({ ...m, open: false }))}
      />
    </div>
  );
}
