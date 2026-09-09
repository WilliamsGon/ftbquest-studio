import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Download, Upload, X, Search, CheckCircle2 } from 'lucide-react';
import type { ChapterTab } from '../types/chapter';
import type { TranslationEntry, I18nStats } from '../types/i18n';
import { 
  extractTranslationEntries, 
  calculateI18nStats, 
  exportLangJson, 
  importLangJson 
} from '../utils/i18nManager';

interface TranslationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: ChapterTab[];
  onApplyTranslationsToModpack: (entries: TranslationEntry[]) => void;
}

export const TranslationManagerModal: React.FC<TranslationManagerModalProps> = ({
  isOpen,
  onClose,
  chapters,
  onApplyTranslationsToModpack
}) => {
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Extraer todas las cadenas al abrir
      setEntries(extractTranslationEntries(chapters));
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, chapters, onClose]);

  const stats: I18nStats = useMemo(() => {
    return calculateI18nStats(entries);
  }, [entries]);

  if (!isOpen) return null;

  const filteredEntries = entries.filter((e) => {
    if (selectedChapterId !== 'all' && e.chapterId !== selectedChapterId) return false;
    if (filterPendingOnly && e.en && e.en.trim().length > 0) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      e.key.toLowerCase().includes(q) ||
      e.es.toLowerCase().includes(q) ||
      e.en.toLowerCase().includes(q) ||
      e.chapterTitle.toLowerCase().includes(q) ||
      (e.questTitle && e.questTitle.toLowerCase().includes(q))
    );
  });

  const handleUpdateEntry = (indexInFiltered: number, lang: 'es' | 'en', val: string) => {
    const targetEntry = filteredEntries[indexInFiltered];
    if (!targetEntry) return;

    setEntries(prev => prev.map(item => {
      if (item.key === targetEntry.key) {
        return { ...item, [lang]: val };
      }
      return item;
    }));
  };

  const handleDownloadJson = (lang: 'es' | 'en') => {
    const jsonStr = exportLangJson(entries, lang);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lang === 'en' ? 'en_us' : 'es_es'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isEnglish = file.name.toLowerCase().includes('en_us') || file.name.toLowerCase().includes('en');
    const targetLang = isEnglish ? 'en' : 'es';

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const updated = importLangJson(content, entries, targetLang);
        setEntries(updated);
        alert(`Traducciones importadas exitosamente desde ${file.name} para idioma ${targetLang.toUpperCase()}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyToModpack = () => {
    if (confirm('¿Convertir los textos del modpack a claves {clave} y guardar las traducciones? Esto permitirá que el modpack cargue desde en_us.json y es_es.json.')) {
      onApplyTranslationsToModpack(entries);
      onClose();
    }
  };

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '96%',
          maxWidth: '1150px',
          height: '86vh',
          maxHeight: '860px',
          backgroundColor: '#1b1e24',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e0e0e0'
        }}
      >
        {/* Cabecera */}
        <div 
          style={{
            padding: '16px 20px',
            backgroundColor: '#16181d',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Globe size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#f3f4f6' }}>
                Gestor de Traducciones e Internacionalización (I18n)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                Traduce tu modpack en paralelo (Español ⇄ Inglés) y genera archivos de idioma para CurseForge / KubeJS
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel de Estadísticas y Progreso */}
        <div 
          style={{
            padding: '12px 20px',
            backgroundColor: '#191b22',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                <span style={{ color: '#9ca3af' }}>Progreso de Traducción al Inglés:</span>
                <span style={{ fontWeight: 700, color: stats.completionPercentage >= 100 ? '#10b981' : '#38bdf8' }}>
                  {stats.completionPercentage}% ({stats.translatedEnCount}/{stats.totalEntries} textos)
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#13151a', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{
                    width: `${stats.completionPercentage}%`,
                    backgroundColor: stats.completionPercentage >= 100 ? '#10b981' : '#38bdf8',
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleDownloadJson('es')}
              style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Descargar archivo es_es.json"
            >
              <Download size={13} /> es_es.json
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleDownloadJson('en')}
              style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Descargar archivo en_us.json"
            >
              <Download size={13} /> en_us.json
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json"
              onChange={handleImportJsonFile}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Importar archivo JSON de idioma"
            >
              <Upload size={13} /> Cargar JSON
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApplyToModpack}
              style={{ fontSize: '0.75rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Reemplaza los textos en los archivos de misiones por claves {clave}"
            >
              <CheckCircle2 size={13} /> Convertir a Claves I18n
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div 
          style={{
            padding: '10px 20px',
            backgroundColor: '#181a20',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text"
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por clave o texto en español/inglés..."
              style={{ paddingLeft: '34px', width: '100%', fontSize: '0.82rem' }}
            />
          </div>

          <select
            className="input-field"
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            style={{ width: '220px', fontSize: '0.8rem' }}
          >
            <option value="all">Todos los capítulos ({chapters.length})</option>
            {chapters.map(ch => (
              <option key={ch.id} value={ch.id}>{ch.title || ch.filename}</option>
            ))}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#9ca3af', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input 
              type="checkbox"
              checked={filterPendingOnly}
              onChange={(e) => setFilterPendingOnly(e.target.checked)}
            />
            <span>Solo textos pendientes ({stats.pendingEnCount})</span>
          </label>
        </div>

        {/* Tabla Bilingüe Paralela */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, backgroundColor: '#1b1e24', zIndex: 2, borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#9ca3af', width: '26%' }}>Contexto & Clave I18n</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#e5e7eb', width: '37%' }}>🇪🇸 Español (es_es)</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', color: '#38bdf8', width: '37%' }}>🇬🇧 Inglés (en_us)</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    No se encontraron textos con los filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr 
                    key={entry.key}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                    }}
                  >
                    {/* Contexto y Clave */}
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '2px' }}>
                        <strong>{entry.chapterTitle}</strong>
                        {entry.questTitle && <span> ➔ {entry.questTitle}</span>}
                        <span style={{ marginLeft: '6px', color: '#6b7280' }}>({entry.fieldType})</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#60a5fa', wordBreak: 'break-all' }}>
                        {entry.key}
                      </div>
                    </td>

                    {/* Español */}
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>
                      <textarea
                        className="input-field"
                        rows={entry.fieldType === 'description' ? 2 : 1}
                        value={entry.es}
                        onChange={(e) => handleUpdateEntry(idx, 'es', e.target.value)}
                        style={{ width: '100%', fontSize: '0.8rem', resize: 'vertical' }}
                        placeholder="Texto en español..."
                      />
                    </td>

                    {/* Inglés */}
                    <td style={{ padding: '8px', verticalAlign: 'top' }}>
                      <textarea
                        className="input-field"
                        rows={entry.fieldType === 'description' ? 2 : 1}
                        value={entry.en}
                        onChange={(e) => handleUpdateEntry(idx, 'en', e.target.value)}
                        style={{ 
                          width: '100%', 
                          fontSize: '0.8rem', 
                          resize: 'vertical',
                          borderColor: entry.en ? 'rgba(56, 189, 248, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                        }}
                        placeholder="English translation..."
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pie */}
        <div 
          style={{
            padding: '12px 20px',
            backgroundColor: '#16181d',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: '#9ca3af'
          }}
        >
          <span>Mostrando {filteredEntries.length} de {entries.length} cadenas traducibles del modpack.</span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '5px 14px', fontSize: '0.78rem' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
