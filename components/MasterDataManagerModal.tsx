import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Package,
  Truck,
  Building,
  Save,
  Database,
} from 'lucide-react';
import {
  MasterMaterial,
  MasterSupplier,
  MasterClientProject,
  saveStoredMaterials,
  saveStoredSuppliers,
  saveStoredClientProjects,
} from '@/lib/masterData';

interface MasterDataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MasterMaterial[];
  suppliers: MasterSupplier[];
  clientProjects: MasterClientProject[];
  onUpdateMaterials: (mats: MasterMaterial[]) => void;
  onUpdateSuppliers: (sups: MasterSupplier[]) => void;
  onUpdateClientProjects: (cps: MasterClientProject[]) => void;
}

export const MasterDataManagerModal: React.FC<MasterDataManagerModalProps> = ({
  isOpen,
  onClose,
  materials,
  suppliers,
  clientProjects,
  onUpdateMaterials,
  onUpdateSuppliers,
  onUpdateClientProjects,
}) => {
  const [activeTab, setActiveTab] = useState<'materials' | 'suppliers' | 'clients'>('suppliers');

  // Supplier form state
  const [newSupplierName, setNewSupplierName] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierName, setEditingSupplierName] = useState('');

  // Material form state
  const [newMaterialDesc, setNewMaterialDesc] = useState('');
  const [newMaterialPrice, setNewMaterialPrice] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingMaterialDesc, setEditingMaterialDesc] = useState('');
  const [editingMaterialPrice, setEditingMaterialPrice] = useState('');

  // Client project form state
  const [newClientName, setNewClientName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCode, setNewProjectCode] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingClientName, setEditingClientName] = useState('');
  const [editingProjectName, setEditingProjectName] = useState('');

  if (!isOpen) return null;

  // Supplier Actions
  const handleAddSupplier = () => {
    if (!newSupplierName.trim()) return;
    const updated = [
      ...suppliers,
      { id: `sup-${Date.now()}`, name: newSupplierName.trim() },
    ];
    onUpdateSuppliers(updated);
    saveStoredSuppliers(updated);
    setNewSupplierName('');
  };

  const handleSaveEditSupplier = (id: string) => {
    const updated = suppliers.map((s) =>
      s.id === id ? { ...s, name: editingSupplierName.trim() } : s
    );
    onUpdateSuppliers(updated);
    saveStoredSuppliers(updated);
    setEditingSupplierId(null);
  };

  const handleDeleteSupplier = (id: string) => {
    const updated = suppliers.filter((s) => s.id !== id);
    onUpdateSuppliers(updated);
    saveStoredSuppliers(updated);
  };

  // Material Actions
  const handleAddMaterial = () => {
    if (!newMaterialDesc.trim()) return;
    const updated = [
      ...materials,
      {
        id: `mat-${Date.now()}`,
        description: newMaterialDesc.trim(),
        defaultUnitPrice: Number(newMaterialPrice) || 0,
      },
    ];
    onUpdateMaterials(updated);
    saveStoredMaterials(updated);
    setNewMaterialDesc('');
    setNewMaterialPrice('');
  };

  const handleSaveEditMaterial = (id: string) => {
    const updated = materials.map((m) =>
      m.id === id
        ? {
            ...m,
            description: editingMaterialDesc.trim(),
            defaultUnitPrice: Number(editingMaterialPrice) || 0,
          }
        : m
    );
    onUpdateMaterials(updated);
    saveStoredMaterials(updated);
    setEditingMaterialId(null);
  };

  const handleDeleteMaterial = (id: string) => {
    const updated = materials.filter((m) => m.id !== id);
    onUpdateMaterials(updated);
    saveStoredMaterials(updated);
  };

  // Client/Project Actions
  const handleAddClientProject = () => {
    if (!newClientName.trim()) return;
    const updated = [
      ...clientProjects,
      {
        id: `cp-${Date.now()}`,
        clientName: newClientName.trim(),
        projectName: newProjectName.trim() || newClientName.trim(),
        projectCode: newProjectCode.trim() || `AZ-${Math.floor(100 + Math.random() * 900)}`,
      },
    ];
    onUpdateClientProjects(updated);
    saveStoredClientProjects(updated);
    setNewClientName('');
    setNewProjectName('');
    setNewProjectCode('');
  };

  const handleSaveEditClientProject = (id: string) => {
    const updated = clientProjects.map((cp) =>
      cp.id === id
        ? {
            ...cp,
            clientName: editingClientName.trim(),
            projectName: editingProjectName.trim(),
          }
        : cp
    );
    onUpdateClientProjects(updated);
    saveStoredClientProjects(updated);
    setEditingClientId(null);
  };

  const handleDeleteClientProject = (id: string) => {
    const updated = clientProjects.filter((cp) => cp.id !== id);
    onUpdateClientProjects(updated);
    saveStoredClientProjects(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] z-10 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0A1322] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#C8A96A]/10 border border-[#C8A96A]/30 rounded-lg text-[#C8A96A]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Master Data Manager</h3>
              <p className="text-xs text-slate-400">
                Manage dropdown lists for materials, suppliers, and client projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'suppliers'
                ? 'border-[#C8A96A] text-[#C8A96A]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Suppliers ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'materials'
                ? 'border-[#C8A96A] text-[#C8A96A]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Material Catalog ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'clients'
                ? 'border-[#C8A96A] text-[#C8A96A]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Clients &amp; Projects ({clientProjects.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* TAB A: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              {/* Add New Supplier Inline */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                <input
                  type="text"
                  placeholder="Enter new supplier name (e.g. Al Bateen Materials)..."
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSupplier()}
                  className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-xs focus:outline-none px-2"
                />
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  className="px-3 py-1.5 bg-[#C8A96A] hover:bg-[#d8bc7d] text-slate-950 font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Supplier</span>
                </button>
              </div>

              {/* Suppliers List */}
              <div className="space-y-1.5 divide-y divide-slate-800/60">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2 px-2 hover:bg-slate-800/40 rounded-lg group"
                  >
                    {editingSupplierId === s.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingSupplierName}
                          onChange={(e) => setEditingSupplierName(e.target.value)}
                          className="flex-1 bg-slate-950 border border-[#C8A96A] rounded px-2 py-1 text-slate-100 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEditSupplier(s.id)}
                          className="p-1 rounded bg-emerald-700 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingSupplierId(null)}
                          className="p-1 rounded bg-slate-800 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-slate-200">{s.name}</span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditingSupplierId(s.id);
                              setEditingSupplierName(s.name);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Edit supplier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                            title="Delete supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB B: MATERIAL CATALOG */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              {/* Add New Material Inline */}
              <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl items-center">
                <input
                  type="text"
                  placeholder="Material description (e.g. MS PIPE 60.3mm)..."
                  value={newMaterialDesc}
                  onChange={(e) => setNewMaterialDesc(e.target.value)}
                  className="col-span-7 bg-transparent border-none text-slate-100 placeholder-slate-500 text-xs focus:outline-none px-2"
                />
                <input
                  type="number"
                  placeholder="Unit Price (AED)..."
                  value={newMaterialPrice}
                  onChange={(e) => setNewMaterialPrice(e.target.value)}
                  className="col-span-3 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="col-span-2 py-1.5 bg-[#C8A96A] hover:bg-[#d8bc7d] text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Materials List */}
              <div className="space-y-1.5 divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2 px-2 hover:bg-slate-800/40 rounded-lg group"
                  >
                    {editingMaterialId === m.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingMaterialDesc}
                          onChange={(e) => setEditingMaterialDesc(e.target.value)}
                          className="flex-1 bg-slate-950 border border-[#C8A96A] rounded px-2 py-1 text-slate-100 text-xs focus:outline-none"
                        />
                        <input
                          type="number"
                          value={editingMaterialPrice}
                          onChange={(e) => setEditingMaterialPrice(e.target.value)}
                          className="w-24 bg-slate-950 border border-[#C8A96A] rounded px-2 py-1 text-slate-100 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEditMaterial(m.id)}
                          className="p-1 rounded bg-emerald-700 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingMaterialId(null)}
                          className="p-1 rounded bg-slate-800 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">{m.description}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold">
                            AED {m.defaultUnitPrice}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditingMaterialId(m.id);
                              setEditingMaterialDesc(m.description);
                              setEditingMaterialPrice(String(m.defaultUnitPrice));
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Edit material"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                            title="Delete material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB C: CLIENTS & PROJECTS */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              {/* Add New Client Project Inline */}
              <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl items-center">
                <input
                  type="text"
                  placeholder="Client Name..."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="col-span-5 bg-transparent border-none text-slate-100 placeholder-slate-500 text-xs focus:outline-none px-2"
                />
                <input
                  type="text"
                  placeholder="Project Name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="col-span-5 bg-transparent border-none text-slate-100 placeholder-slate-500 text-xs focus:outline-none px-2"
                />
                <button
                  type="button"
                  onClick={handleAddClientProject}
                  className="col-span-2 py-1.5 bg-[#C8A96A] hover:bg-[#d8bc7d] text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Clients List */}
              <div className="space-y-1.5 divide-y divide-slate-800/60 max-h-96 overflow-y-auto pr-1">
                {clientProjects.map((cp) => (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between py-2 px-2 hover:bg-slate-800/40 rounded-lg group"
                  >
                    {editingClientId === cp.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingClientName}
                          onChange={(e) => setEditingClientName(e.target.value)}
                          className="flex-1 bg-slate-950 border border-[#C8A96A] rounded px-2 py-1 text-slate-100 text-xs focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          className="flex-1 bg-slate-950 border border-[#C8A96A] rounded px-2 py-1 text-slate-100 text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEditClientProject(cp.id)}
                          className="p-1 rounded bg-emerald-700 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingClientId(null)}
                          className="p-1 rounded bg-slate-800 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-bold text-white mr-2">{cp.clientName}</span>
                          <span className="text-slate-400">• {cp.projectName}</span>
                          {cp.projectCode && (
                            <span className="ml-2 font-mono text-[10px] text-slate-500">
                              [{cp.projectCode}]
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditingClientId(cp.id);
                              setEditingClientName(cp.clientName);
                              setEditingProjectName(cp.projectName);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClientProject(cp.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Synced locally &amp; to Supabase tables</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
