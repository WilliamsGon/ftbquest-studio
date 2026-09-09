/**
 * CommandGeneratorModal.tsx
 *
 * Diálogo modal para Generador de Comandos y Scripts de Prueba (KubeJS Tester).
 * Ofrece:
 * - Comandos de consola de Minecraft listos para copiar con 1 clic (/ftbquests complete/reset).
 * - Generador de comandos /give para todos los materiales requeridos por el capítulo.
 * - Exportador de scripts KubeJS (ServerEvents) para pruebas automatizadas en Minecraft.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Terminal, Copy, Check, FileCode, Download, 
  PackageCheck, Play, RotateCcw, Box
} from 'lucide-react';
import { 
  getCompleteQuestCommand, 
  getResetQuestCommand, 
  getCompleteChapterCommands, 
  getGiveRequiredItemsCommands, 
  generateKubeJsTestScript 
} from '../utils/commandGenerator';
import { normalizeQuestId } from '../utils/questSimulatorEngine';

interface CommandGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuest?: any | null;
  chapterTitle?: string;
  quests: any[];
}

export const CommandGeneratorModal: React.FC<CommandGeneratorModalProps> = ({
  isOpen,
  onClose,
  selectedQuest,
  chapterTitle = 'Capítulo',
  quests,
}) => {
  const [activeTab, setActiveTab] = useState<'commands' | 'kubejs' | 'give_items'>('commands');
  const [playerTarget, setPlayerTarget] = useState<string>('@p');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const qId = selectedQuest ? normalizeQuestId(selectedQuest.id) : '';
  const qTitle = selectedQuest?.title || (qId ? `Misión [${qId}]` : 'Sin misión seleccionada');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const completeQuestCmd = qId ? getCompleteQuestCommand(qId, playerTarget) : '';
  const resetQuestCmd = qId ? getResetQuestCommand(qId, playerTarget) : '';
  const chapterCmds = getCompleteChapterCommands(quests, playerTarget);
  const giveCmds = getGiveRequiredItemsCommands(quests, playerTarget);
  const kubeJsScript = generateKubeJsTestScript(chapterTitle, quests);

  const downloadKubeJsScript = () => {
    const blob = new Blob([kubeJsScript], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ftb_tester_${chapterTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.js`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100200,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '940px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          background: 'var(--surface-color, #181825)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(137, 180, 250, 0.15)',
                border: '1px solid rgba(137, 180, 250, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#89b4fa',
              }}
            >
              <Terminal size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#cdd6f4', fontWeight: 600 }}>
                Generador de Comandos & KubeJS Tester
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #a6adc8)' }}>
                Comandos de consola rápidos para probar misiones y scripts automatizados de KubeJS
              </span>
            </div>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            title="Cerrar (Esc)"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px',
              color: '#cdd6f4',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Configuración de Objetivo (@p, @s, etc.) */}
        <div
          style={{
            padding: '12px 22px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#a6adc8' }}>Jugador Objetivo:</span>
            <input
              type="text"
              className="input-field"
              value={playerTarget}
              onChange={(e) => setPlayerTarget(e.target.value)}
              placeholder="@p, @s, o TuUsuario"
              style={{ width: '130px', padding: '4px 10px', fontSize: '0.8rem' }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              {['@p', '@s', '@a'].map((tag) => (
                <button
                  key={tag}
                  className={`btn ${playerTarget === tag ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPlayerTarget(tag)}
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {selectedQuest ? (
            <div style={{ fontSize: '0.78rem', color: '#cdd6f4' }}>
              Misión activa: <strong style={{ color: '#89b4fa' }}>{qTitle}</strong> ({qId})
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#a6adc8', fontStyle: 'italic' }}>
              (Selecciona una misión en el lienzo para ver sus comandos directos)
            </div>
          )}
        </div>

        {/* Pestañas */}
        <div
          style={{
            display: 'flex',
            padding: '0 22px',
            background: 'rgba(0, 0, 0, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            gap: '8px',
          }}
        >
          <button
            onClick={() => setActiveTab('commands')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'commands' ? '2px solid #89b4fa' : '2px solid transparent',
              color: activeTab === 'commands' ? '#89b4fa' : '#a6adc8',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Terminal size={15} /> Comandos de Consola FTB
          </button>

          <button
            onClick={() => setActiveTab('kubejs')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'kubejs' ? '2px solid #89b4fa' : '2px solid transparent',
              color: activeTab === 'kubejs' ? '#89b4fa' : '#a6adc8',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileCode size={15} /> Script para KubeJS
          </button>

          <button
            onClick={() => setActiveTab('give_items')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'give_items' ? '2px solid #89b4fa' : '2px solid transparent',
              color: activeTab === 'give_items' ? '#89b4fa' : '#a6adc8',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Box size={15} /> Entregar Materiales ({giveCmds.length} ítems)
          </button>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {/* PESTAÑA: COMANDOS FTB */}
          {activeTab === 'commands' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Comando 1: Completar Misión Seleccionada */}
              {selectedQuest && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Play size={16} style={{ color: '#a6e3a1' }} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cdd6f4' }}>
                        Completar misión seleccionada ({qTitle})
                      </span>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => copyToClipboard(completeQuestCmd, 'comp_quest')}
                      style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {copiedKey === 'comp_quest' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedKey === 'comp_quest' ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <code
                    style={{
                      display: 'block',
                      background: '#11111b',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: '#a6e3a1',
                      fontFamily: 'Consolas, monospace',
                      fontSize: '0.85rem',
                      overflowX: 'auto',
                    }}
                  >
                    {completeQuestCmd}
                  </code>
                </div>
              )}

              {/* Comando 2: Reiniciar Misión Seleccionada */}
              {selectedQuest && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RotateCcw size={16} style={{ color: '#f9e2af' }} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cdd6f4' }}>
                        Reiniciar progreso de la misión seleccionada
                      </span>
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={() => copyToClipboard(resetQuestCmd, 'reset_quest')}
                      style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {copiedKey === 'reset_quest' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedKey === 'reset_quest' ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>

                  <code
                    style={{
                      display: 'block',
                      background: '#11111b',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: '#f9e2af',
                      fontFamily: 'Consolas, monospace',
                      fontSize: '0.85rem',
                      overflowX: 'auto',
                    }}
                  >
                    {resetQuestCmd}
                  </code>
                </div>
              )}

              {/* Comando 3: Completar Todo el Capítulo */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PackageCheck size={16} style={{ color: '#89b4fa' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cdd6f4' }}>
                      Completar todo el capítulo ({quests.length} misiones)
                    </span>
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => copyToClipboard(chapterCmds.join('\n'), 'all_chapter')}
                    style={{ padding: '5px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedKey === 'all_chapter' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey === 'all_chapter' ? '¡Copiado!' : 'Copiar Todos'}
                  </button>
                </div>

                <div
                  style={{
                    maxHeight: '130px',
                    overflowY: 'auto',
                    background: '#11111b',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontFamily: 'Consolas, monospace',
                    fontSize: '0.78rem',
                    color: '#89b4fa',
                    lineHeight: '1.5',
                  }}
                >
                  {chapterCmds.slice(0, 5).map((cmd, i) => (
                    <div key={i}>{cmd}</div>
                  ))}
                  {chapterCmds.length > 5 && (
                    <div style={{ opacity: 0.6 }}>... y {chapterCmds.length - 5} comandos más</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: KUBEJS SCRIPT */}
          {activeTab === 'kubejs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#a6adc8' }}>
                  Guarda este archivo en <code>kubejs/server_scripts/</code> para habilitar comandos de prueba rápidos en tu servidor.
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => copyToClipboard(kubeJsScript, 'kubejs_script')}
                    style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedKey === 'kubejs_script' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey === 'kubejs_script' ? '¡Copiado!' : 'Copiar Script'}
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={downloadKubeJsScript}
                    style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Descargar .js
                  </button>
                </div>
              </div>

              <pre
                style={{
                  background: '#11111b',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  color: '#a6e3a1',
                  fontFamily: 'Consolas, monospace',
                  fontSize: '0.82rem',
                  lineHeight: '1.5',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {kubeJsScript}
              </pre>
            </div>
          )}

          {/* PESTAÑA: ENTREGAR MATERIALES */}
          {activeTab === 'give_items' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#a6adc8' }}>
                  Comandos <code>/give</code> para obtener en el inventario todos los materiales necesarios para las tareas del capítulo:
                </span>

                <button
                  className="btn btn-primary"
                  onClick={() => copyToClipboard(giveCmds.join('\n'), 'give_all')}
                  style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedKey === 'give_all' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey === 'give_all' ? '¡Copiados!' : 'Copiar Todos los /give'}
                </button>
              </div>

              <div
                style={{
                  maxHeight: '320px',
                  overflowY: 'auto',
                  background: '#11111b',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  fontFamily: 'Consolas, monospace',
                  fontSize: '0.82rem',
                  color: '#f9e2af',
                  lineHeight: '1.6',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {giveCmds.length === 0 ? (
                  <span style={{ opacity: 0.5 }}>(No hay tareas de ítem en este capítulo)</span>
                ) : (
                  giveCmds.map((cmd, idx) => <div key={idx}>{cmd}</div>)
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 18px', fontSize: '0.82rem' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
