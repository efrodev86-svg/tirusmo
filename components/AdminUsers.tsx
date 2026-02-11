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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: DEFAULT_PASSWORD, full_name: '', user_type: 'cliente' as 'cliente' | 'partner' | 'admin' });
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: createForm.email.trim(),
        password: createForm.password,
        options: { data: { full_name: createForm.full_name.trim() || undefined, user_type: createForm.user_type } },
      });
      if (signUpErr) {
        setError(signUpErr.message);
        return;
      }
      await supabase.auth.signOut();
      setShowCreateModal(false);
      setCreateForm({ email: '', password: DEFAULT_PASSWORD, full_name: '', user_type: 'cliente' });
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

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

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
            <div className="flex items-center gap-4 w-full md:w-auto">
                 {/* Search Bar */}
                <div className="relative flex-1 md:w-80">
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
                        {filtered.map((user) => (
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
                <span className="text-xs text-gray-400 font-medium">Mostrando {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}</span>
                <div className="flex gap-2">
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 rounded bg-primary text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-200">1</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white text-gray-600 text-xs font-medium flex items-center justify-center hover:bg-gray-50">2</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white text-gray-600 text-xs font-medium flex items-center justify-center hover:bg-gray-50">3</button>
                    <button className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                </div>
            </div>
            </>
            )}

            {/* Modal Nuevo Usuario */}
            {showCreateModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 p-6">
                  <h3 className="text-lg font-bold text-[#111827] mb-4">Nuevo Usuario</h3>
                  <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Correo</label>
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña temporal</label>
                      <input
                        type="text"
                        required
                        minLength={6}
                        value={createForm.password}
                        onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nombre completo</label>
                      <input
                        type="text"
                        value={createForm.full_name}
                        onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Rol</label>
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
                      <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600">
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