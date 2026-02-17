import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminUsersProps {
  onEditUser?: (id: string) => void;
  refreshKey?: number;
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  date: string;
  status: string;
  img: string;
  is_active: boolean;
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function userTypeToRole(userType: string): string {
  if (userType === 'admin') return 'Admin';
  if (userType === 'partner') return 'Partner';
  return 'Cliente';
}

const DEFAULT_PASSWORD = 'TempPass2025!';

export const AdminUsers: React.FC<AdminUsersProps> = ({ onEditUser, refreshKey = 0 }) => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: DEFAULT_PASSWORD, first_name: '', last_name: '', user_type: 'cliente' as 'cliente' | 'partner' | 'admin' });
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, email, full_name, user_type, created_at, deleted_at, is_active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setUsers([]);
    } else if (data) {
      setUsers(
        data.map((p) => ({
          id: p.id,
          name: p.full_name || p.email || '—',
          email: p.email,
          role: userTypeToRole(p.user_type || 'cliente'),
          date: formatDate(p.created_at || ''),
          status: p.is_active !== false ? 'Activo' : 'Inactivo',
          img: `https://ui-avatars.com/api/?name=${encodeURIComponent((p.full_name || p.email || 'U').replace(/\s+/g, '+'))}&background=random`,
          is_active: p.is_active !== false,
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, profileFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormErrors({});
    const err: Record<string, string> = {};
    if (!createForm.email.trim()) err.email = 'Campo obligatorio';
    if (!createForm.password.trim()) err.password = 'Campo obligatorio';
    else if (createForm.password.length < 6) err.password = 'Mínimo 6 caracteres';
    if (!createForm.first_name.trim()) err.first_name = 'Campo obligatorio';
    if (!createForm.last_name.trim()) err.last_name = 'Campo obligatorio';
    if (Object.keys(err).length > 0) {
      setCreateFormErrors(err);
      return;
    }
    setCreateLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Debes tener sesión iniciada como admin.');
        return;
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!anonKey) {
        setError('Configuración incompleta (VITE_SUPABASE_ANON_KEY).');
        return;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({
          access_token: session.access_token,
          email: createForm.email.trim(),
          password: createForm.password,
          full_name: [createForm.first_name.trim(), createForm.last_name.trim()].filter(Boolean).join(' ') || null,
          last_name: createForm.last_name.trim() || null,
          user_type: createForm.user_type,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }
      setShowCreateModal(false);
      setCreateForm({ email: '', password: DEFAULT_PASSWORD, first_name: '', last_name: '', user_type: 'cliente' });
      setCreateFormErrors({});
      setCurrentPage(1);
      await new Promise((r) => setTimeout(r, 300));
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (user: UserRow) => {
    setTogglingId(user.id);
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !u.is_active, status: u.is_active ? 'Inactivo' : 'Activo' } : u
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteTarget.id);
      if (updateErr) {
        setError(updateErr.message);
        return;
      }
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleteLoading(false);
    }
  };

  const profileFilterToRole: Record<string, string> = {
    admin: 'Admin',
    cliente: 'Cliente',
    partner: 'Partner',
  };

  const filtered = users.filter((u) => {
    const matchesSearch = !search.trim() ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesProfile = !profileFilter || u.role === profileFilterToRole[profileFilter];
    return matchesSearch && matchesProfile;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedUsers = filtered.slice(start, start + pageSize);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(e.target.value) as 5 | 10 | 20 | 50;
    setPageSize(value);
    setCurrentPage(1);
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'Admin': return 'bg-blue-100 text-blue-700';
      case 'Partner': return 'bg-purple-100 text-purple-700';
      case 'Cliente': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-[#111827]">Gestión de Usuarios</h1>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                 {/* Filtro por perfil */}
                <select
                  value={profileFilter}
                  onChange={(e) => setProfileFilter(e.target.value)}
                  className="px-4 py-2.5 bg-gray-100 border-none rounded-full text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">Todos los perfiles</option>
                  <option value="admin">Admin</option>
                  <option value="cliente">Usuario</option>
                  <option value="partner">Partner</option>
                </select>
                 {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px] md:w-80">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar usuario..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-600" 
                    />
                </div>
                <button className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors relative shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[22px] filled">notifications</span>
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border border-gray-200 shrink-0">
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-[#111827]">Listado de Usuarios</h2>
                    <p className="text-sm text-gray-500">Administra los accesos y roles de la plataforma</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Nuevo Usuario
                </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            {loading ? (
              <div className="p-12 text-center text-gray-500">Cargando usuarios...</div>
            ) : (
            <>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] text-gray-400 uppercase font-bold border-b border-gray-100 bg-gray-50/30">
                            <th className="py-4 pl-6">Nombre</th>
                            <th className="py-4">Email</th>
                            <th className="py-4">Rol</th>
                            <th className="py-4">Fecha de Registro</th>
                            <th className="py-4">Estado</th>
                            <th className="py-4 text-center pr-6">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {paginatedUsers.map((user) => (
                            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <img src={user.img} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <p className="font-bold text-[#111827]">{user.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">ID: {user.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-gray-600">{user.email}</td>
                                <td className="py-4">
                                    <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-4 text-gray-600">{user.date}</td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleActive(user)}
                                          disabled={togglingId === user.id}
                                          className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                          role="switch"
                                          aria-checked={user.is_active}
                                          style={{
                                            backgroundColor: user.is_active ? 'var(--color-primary, #2b7cee)' : '#d1d5db',
                                          }}
                                        >
                                          <span
                                            className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition"
                                            style={{ translate: user.is_active ? 'translateX(1.25rem)' : 'translateX(0.125rem)' }}
                                          />
                                        </button>
                                        <span className={`text-xs font-bold ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                          {user.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 text-center pr-6">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => onEditUser?.(user.id)}
                                            className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(user)}
                                            className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                          >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                          </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 gap-4 bg-gray-50/30">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium">
                        Mostrando {totalFiltered === 0 ? 0 : start + 1}-{Math.min(start + pageSize, totalFiltered)} de {totalFiltered} usuario{totalFiltered !== 1 ? 's' : ''}
                    </span>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Por página:</span>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium bg-white focus:ring-1 focus:ring-primary focus:border-primary"
                        >
                            {PAGE_SIZE_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .reduce<number[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push(-1);
                            acc.push(p);
                            return acc;
                        }, [])
                        .map((p, idx) =>
                            p === -1 ? (
                                <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-400 text-xs">…</span>
                            ) : (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setCurrentPage(p)}
                                    className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                                        p === safePage
                                            ? 'bg-primary text-white shadow-md shadow-blue-200'
                                            : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {p}
                                </button>
                            )
                        )}
                    <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                </div>
            </div>
            </>
            )}

            {/* Modal Nuevo Usuario */}
            {showCreateModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setCreateFormErrors({}); }} />
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6">
                  <h3 className="text-lg font-bold text-[#111827] mb-4">Nuevo Usuario</h3>
                  <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                    {Object.keys(createFormErrors).length > 0 && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        Por favor completa todos los campos obligatorios.
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Correo <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => { setCreateForm((f) => ({ ...f, email: e.target.value })); setCreateFormErrors((e2) => ({ ...e2, email: '' })); }}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm ${createFormErrors.email ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                      />
                      {createFormErrors.email && <p className="text-xs text-red-600 mt-0.5">{createFormErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña temporal <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        minLength={6}
                        value={createForm.password}
                        onChange={(e) => { setCreateForm((f) => ({ ...f, password: e.target.value })); setCreateFormErrors((e2) => ({ ...e2, password: '' })); }}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm ${createFormErrors.password ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                      />
                      {createFormErrors.password && <p className="text-xs text-red-600 mt-0.5">{createFormErrors.password}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={createForm.first_name}
                        onChange={(e) => { setCreateForm((f) => ({ ...f, first_name: e.target.value })); setCreateFormErrors((e2) => ({ ...e2, first_name: '' })); }}
                        placeholder="Ej. María"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm ${createFormErrors.first_name ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                      />
                      {createFormErrors.first_name && <p className="text-xs text-red-600 mt-0.5">{createFormErrors.first_name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={createForm.last_name}
                        onChange={(e) => { setCreateForm((f) => ({ ...f, last_name: e.target.value })); setCreateFormErrors((e2) => ({ ...e2, last_name: '' })); }}
                        placeholder="Ej. García López"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm ${createFormErrors.last_name ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                      />
                      {createFormErrors.last_name && <p className="text-xs text-red-600 mt-0.5">{createFormErrors.last_name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Rol <span className="text-red-500">*</span></label>
                      <select
                        value={createForm.user_type}
                        onChange={(e) => setCreateForm((f) => ({ ...f, user_type: e.target.value as 'cliente' | 'partner' | 'admin' }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="cliente">Cliente</option>
                        <option value="partner">Partner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => { setShowCreateModal(false); setCreateFormErrors({}); }} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600">
                        Cancelar
                      </button>
                      <button type="submit" disabled={createLoading} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-60">
                        {createLoading ? 'Creando...' : 'Crear'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Confirmar Eliminar */}
            {deleteTarget && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !deleteLoading && setDeleteTarget(null)} />
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center">
                  <h3 className="text-lg font-bold text-[#111827] mb-2">¿Eliminar usuario?</h3>
                  <p className="text-sm text-gray-500 mb-4">{deleteTarget.name} ({deleteTarget.email})</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600">
                      Cancelar
                    </button>
                    <button type="button" onClick={handleConfirmDelete} disabled={deleteLoading} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold disabled:opacity-60">
                      {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
    </div>
  );
};