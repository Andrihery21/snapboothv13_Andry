import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, Image as ImageIcon, Link } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/notifications';
import { useScreenConfig } from './screens/ScreenConfigProvider';

const normalizeBgList = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined).map(String);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item !== null && item !== undefined).map(String);
      }
    } catch (error) {
      const splitValues = value.split(',').map((item) => item.trim()).filter(Boolean);
      return splitValues.map(String);
    }
  }

  return [];
};

const formatBgListForSave = (list) => {
  const numericList = list.map((item) => Number(item));
  const hasInvalid = numericList.some((item) => Number.isNaN(item));
  return hasInvalid ? list : numericList;
};

const AdminBackgrounds = () => {
  const { config } = useScreenConfig();
  const [loading, setLoading] = useState(true);
  const [bgList, setBgList] = useState([]);
  const [allBackgrounds, setAllBackgrounds] = useState([]);
  const [newBackgroundUrl, setNewBackgroundUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const assignedBackgrounds = useMemo(() => {
    const idSet = new Set(bgList.map(String));
    return allBackgrounds.filter((bg) => idSet.has(String(bg.id)));
  }, [bgList, allBackgrounds]);

  const loadBackgrounds = async () => {
    if (!config?.id) return;
    try {
      setLoading(true);
      const { data: screenRow, error: screenError } = await supabase
        .from('screens')
        .select('bg_list')
        .eq('id', config.id)
        .single();

      if (screenError) throw screenError;

      const { data: backgrounds, error: backgroundError } = await supabase
        .from('background_image')
        .select('id, image_preview_url')
        .order('id', { ascending: true });

      if (backgroundError) throw backgroundError;

      setBgList(normalizeBgList(screenRow?.bg_list));
      setAllBackgrounds(backgrounds || []);
    } catch (error) {
      console.error('Erreur lors du chargement des backgrounds:', error);
      notify.error('Impossible de charger les backgrounds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackgrounds();
  }, [config?.id]);

  const updateBgList = async (nextList) => {
    if (!config?.id) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('screens')
        .update({ bg_list: formatBgListForSave(nextList) })
        .eq('id', config.id);
      if (error) throw error;
      setBgList(nextList);
      notify.success('Backgrounds mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des backgrounds:', error);
      notify.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackground = async () => {
    if (!newBackgroundUrl.trim()) return;
    try {
      setSaving(true);
      const { data: inserted, error } = await supabase
        .from('background_image')
        .insert({ image_preview_url: newBackgroundUrl.trim() })
        .select('id, image_preview_url')
        .single();

      if (error) throw error;

      const nextList = [...bgList.map(String), String(inserted.id)];
      const uniqueList = Array.from(new Set(nextList));

      const { error: updateError } = await supabase
        .from('screens')
        .update({ bg_list: formatBgListForSave(uniqueList) })
        .eq('id', config.id);

      if (updateError) throw updateError;

      setAllBackgrounds((prev) => [...prev, inserted]);
      setBgList(uniqueList);
      setNewBackgroundUrl('');
      notify.success('Background ajouté');
    } catch (error) {
      console.error('Erreur lors de la création du background:', error);
      notify.error('Impossible d\'ajouter le background');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBackground = async (id) => {
    const nextList = bgList.map(String).filter((bgId) => String(bgId) !== String(id));
    await updateBgList(nextList);
  };

  const handleDeleteBackground = async (id) => {
    const confirmed = window.confirm('Supprimer ce background définitivement ?');
    if (!confirmed) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('background_image')
        .delete()
        .eq('id', id);
      if (error) throw error;

      const nextList = bgList.map(String).filter((bgId) => String(bgId) !== String(id));
      const { error: updateError } = await supabase
        .from('screens')
        .update({ bg_list: formatBgListForSave(nextList) })
        .eq('id', config.id);
      if (updateError) throw updateError;

      setBgList(nextList);
      setAllBackgrounds((prev) => prev.filter((bg) => String(bg.id) !== String(id)));
      notify.success('Background supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du background:', error);
      notify.error('Impossible de supprimer le background');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Gestion des backgrounds</h3>
          <p className="text-sm text-gray-500">Associez des backgrounds à l'écran sélectionné.</p>
        </div>
        <button
          type="button"
          onClick={loadBackgrounds}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <RefreshCw size={16} /> Rafraîchir
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Créer un background (URL)</h4>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Link size={16} className="text-gray-500" />
              <input
                type="url"
                value={newBackgroundUrl}
                onChange={(e) => setNewBackgroundUrl(e.target.value)}
                placeholder="https://.../image.jpg"
                className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateBackground}
              disabled={!newBackgroundUrl.trim() || saving}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <ImageIcon size={16} /> Créer & Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Backgrounds liés à cet écran</h4>
          <span className="text-xs text-gray-500">{assignedBackgrounds.length} élément(s)</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <RefreshCw size={16} className="animate-spin" /> Chargement...
          </div>
        ) : assignedBackgrounds.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun background associé pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedBackgrounds.map((bg) => (
              <div key={bg.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="h-36 bg-gray-200 flex items-center justify-center">
                  <img
                    src={bg.image_preview_url}
                    alt={`Background ${bg.id}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">#{bg.id}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveBackground(bg.id)}
                      disabled={saving}
                      className="text-xs px-2 py-1 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200"
                    >
                      Retirer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBackground(bg.id)}
                      disabled={saving}
                      className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBackgrounds;
