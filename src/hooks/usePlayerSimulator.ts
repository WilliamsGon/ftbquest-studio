import { useEffect, useState } from 'react';
import type { RewardTable } from '../types/rewardTable';
import type { SimulatorState } from '../utils/questSimulatorEngine';
import {
completeQuestInSimulator,
computeUnlockedQuests,
createInitialSimulatorState,
} from '../utils/questSimulatorEngine';

type ShowToast = (message: string, type?: string) => void;

/** Modo Jugador y simulador de progresión: misiones completadas, inventario virtual y XP. */
export function usePlayerSimulator(quests: any[], rewardTables: RewardTable[], showToast: ShowToast) {
  const [isPlayerMode, setIsPlayerMode] = useState<boolean>(false);
  const [playerCompletedQuestIds, setPlayerCompletedQuestIds] = useState<Set<string>>(new Set());
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState<boolean>(false);
  const [simulatorState, setSimulatorState] = useState<SimulatorState>(() => createInitialSimulatorState([]));

  // Sincronizar misiones desbloqueadas en el simulador cuando cambia el set de misiones
  useEffect(() => {
    setSimulatorState(prev => ({
      ...prev,
      unlockedQuestIds: computeUnlockedQuests(quests, prev.completedQuestIds)
    }));
  }, [quests]);

  const handleTogglePlayerQuestCompletion = (questId: string) => {
    setSimulatorState(prev => {
      const next = completeQuestInSimulator(questId, prev, quests, rewardTables);
      setPlayerCompletedQuestIds(next.completedQuestIds);
      if (next.completedQuestIds.has(questId.toUpperCase())) {
        showToast('¡Misión completada! Desbloqueando ramas y recibiendo recompensas...', 'success');
      } else {
        showToast('Misión marcada como pendiente (reversión)', 'info');
      }
      return next;
    });
  };

  const handleResetPlayerProgress = () => {
    const next = createInitialSimulatorState(quests);
    setSimulatorState(next);
    setPlayerCompletedQuestIds(next.completedQuestIds);
    showToast('Progreso del simulador reiniciado a cero', 'info');
  };

  const handleCompleteAllPlayerQuests = () => {
    let current = simulatorState;
    for (const q of quests) {
      if (current.unlockedQuestIds.has(String(q.id).toUpperCase())) {
        current = completeQuestInSimulator(String(q.id), current, quests, rewardTables);
      }
    }
    setSimulatorState(current);
    setPlayerCompletedQuestIds(current.completedQuestIds);
    showToast('Misiones desbloqueadas completadas en lote', 'success');
  };

  return {
    isPlayerMode, setIsPlayerMode,
    playerCompletedQuestIds,
    isSimulatorModalOpen, setIsSimulatorModalOpen,
    simulatorState,
    handleTogglePlayerQuestCompletion, handleResetPlayerProgress, handleCompleteAllPlayerQuests,
  };
}
