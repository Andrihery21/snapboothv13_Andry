import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useScreenConfig } from '../admin/screens/ScreenConfigProvider';
import { notify } from '../../lib/notifications';

const BackgroundSelectionFromList = ({ onSelectBackground, onCancel, image, screenKey }) => {
  const { config, screenId } = useScreenConfig();
  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeSparkleId, setActiveSparkleId] = useState(null);

  // Charger les backgrounds liés à l'écran courant
  useEffect(() => {
    const loadScreenBackgrounds = async () => {
      console.log('[BackgroundSelectionFromList] useEffect start, config:', config, 'screenKey prop:', screenKey, 'provider screenId:', screenId);

      let screenRow = null;

      // Si on a un config avec id, privilégier la lecture par id
      if (config?.id) {
        try {
          setLoading(true);
          console.log('[BackgroundSelectionFromList] chargement des backgrounds pour screen id:', config.id);
          const { data, error } = await supabase
            .from('screens')
            .select('bg_list, screen_key, id')
            .eq('id', config.id)
            .single();
          console.log('[BackgroundSelectionFromList] supabase screens response (by id):', { data, error });
          if (error) throw error;
          screenRow = data;
        } catch (err) {
          console.error('[BackgroundSelectionFromList] Erreur lecture screens par id:', err);
          // continuer avec fallbacks
        }
      }

      // Si pas de result, essayer fallback: d'abord screenKey prop, puis provider screenId
      if (!screenRow) {
        // Préférer screenKey (ex: 'kiosk_1') s'il est fourni
        if (screenKey) {
          try {
            console.log('[BackgroundSelectionFromList] Fallback: recherche screens par screen_key =', screenKey);
            const { data, error } = await supabase
              .from('screens')
              .select('bg_list, screen_key, id')
              .eq('screen_key', screenKey)
              .single();
            console.log('[BackgroundSelectionFromList] supabase screens response (by screen_key):', { data, error });
            if (error) throw error;
            screenRow = data;
          } catch (err) {
            console.error('[BackgroundSelectionFromList] Erreur fallback screen_key:', err);
          }
        }

        // Si toujours rien, essayer screenId (provider) — correspond souvent à l'UUID
        if (!screenRow && screenId) {
          try {
            console.log('[BackgroundSelectionFromList] Fallback: recherche screens par id/screen_key avec screenId =', screenId);
            const { data, error } = await supabase
              .from('screens')
              .select('bg_list, screen_key, id')
              .or(`id.eq.${screenId},screen_key.eq.${screenId}`)
              .single();
            console.log('[BackgroundSelectionFromList] supabase screens response (by screenId):', { data, error });
            if (error) throw error;
            screenRow = data;
          } catch (err) {
            console.error('[BackgroundSelectionFromList] Erreur fallback screenId:', err);
          }
        }
      }

      // Si toujours rien, on termine proprement
      if (!screenRow) {
        setBackgrounds([]);
        setLoading(false);
        return;
      }

      try {
        // Normaliser la liste (array, JSON string, CSV)
        let bgList = [];
        console.log('[BackgroundSelectionFromList] screenRow.bg_list raw:', screenRow?.bg_list);
        if (Array.isArray(screenRow?.bg_list)) {
          bgList = screenRow.bg_list;
        } else if (typeof screenRow?.bg_list === 'string') {
          try {
            const parsed = JSON.parse(screenRow.bg_list);
            if (Array.isArray(parsed)) bgList = parsed;
            else {
              // fallback: comma-separated string inside quotes
              bgList = screenRow.bg_list.split(',').map(s => s.trim()).filter(Boolean);
            }
          } catch (e) {
            // split by comma as a last resort
            bgList = screenRow.bg_list.split(',').map(s => s.trim()).filter(Boolean);
          }
        }

        // Convertir les IDs en nombres (background_image.id est un int)
        const bgIds = (bgList || []).map((v) => {
          // v peut être "1" ou 1
          const n = Number(v);
          return Number.isNaN(n) ? null : n;
        }).filter(Boolean);

        console.log('[BackgroundSelectionFromList] normalized bgList:', bgList, 'bgIds:', bgIds);

        if (bgIds.length === 0) {
          setBackgrounds([]);
          setLoading(false);
          return;
        }

        // Récupérer les détails des backgrounds
        const { data: bgData, error: bgError } = await supabase
          .from('background_image')
          .select('id, image_preview_url')
          .in('id', bgIds);
        console.log('[BackgroundSelectionFromList] supabase background_image response:', { bgData, bgError });

        if (bgError) throw bgError;

        // Conserver l'ordre d'origine (bg_list) et normaliser la shape en ajoutant `url` pour compatibilité
        const ordered = bgList
          .map(id => bgData?.find(bg => String(bg.id) === String(id)))
          .filter(Boolean)
          .map(bg => ({ ...bg, url: bg.image_preview_url }));

        setBackgrounds(ordered);
      } catch (error) {
        console.error('Erreur chargement backgrounds écran:', error);
        notify.error('Impossible de charger les backgrounds');
      } finally {
        setLoading(false);
      }
    };

    loadScreenBackgrounds();
  }, [config?.id, screenKey, screenId]);

  const handleSelect = (bg) => {
    setActiveSparkleId(bg.id);
    setTimeout(() => {
      onSelectBackground(bg);
    }, 450);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm">
      <style>{`
        @keyframes sparkleBurst {
          0% { transform: scale(0.2); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes sparkleFloat {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(-12px) scale(1.1); opacity: 0; }
        }
      `}</style>
      <div className="bg-gray-900 p-6 rounded-2xl max-w-5xl w-full mx-4 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Choisissez un background</h2>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mr-3" />
            <span className="text-gray-300">Chargement des backgrounds...</span>
          </div>
        ) : backgrounds.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Aucun background associé à cet écran.</p>
            <p className="text-gray-500 text-sm mt-2">Veuillez contacter un administrateur pour ajouter des backgrounds.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleSelect(bg)}
                className="relative group overflow-hidden rounded-xl border border-white/10 hover:border-yellow-300/80 transition-all focus:outline-none"
              >
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <img
                    src={bg.image_preview_url}
                    alt={`Background ${bg.id}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-2 left-3 text-left">
                  <p className="text-white text-sm font-semibold tracking-wide">#{bg.id}</p>
                </div>
                {activeSparkleId === bg.id && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border border-yellow-200/60 rounded-xl" style={{ animation: 'sparkleBurst 0.45s ease-out' }} />
                    {[...Array(6)].map((_, i) => (
                      <span
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-yellow-200 shadow-[0_0_12px_rgba(255,236,153,0.9)]"
                        style={{
                          top: `${20 + i * 8}%`,
                          left: `${15 + i * 12}%`,
                          animation: `sparkleFloat 0.45s ease-out ${i * 0.03}s`
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundSelectionFromList;
