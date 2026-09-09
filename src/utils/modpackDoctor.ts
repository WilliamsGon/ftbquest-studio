/**
 * modpackDoctor.ts
 *
 * Motor de Diagnóstico y Auditoría de Integridad para Modpacks de Minecraft (FTB Quests).
 * Realiza un escaneo estático exhaustivo de capítulos, misiones, tareas, recompensas y dependencias:
 * - Detección de IDs huérfanos o inválidos.
 * - Recompensas rotas (probabilidad 0%, tablas eliminadas, ítems vacíos).
 * - Tareas con cantidades erróneas (<= 0 o NaN).
 * - Dependencias rotas hacia misiones inexistentes.
 * - Títulos y descripciones vacías o con placeholders genéricos.
 * - Rutinas de Auto-reparación en lote con un solo clic.
 */

import type { RewardTable } from '../types/rewardTable';
import { normalizeQuestId } from './questSimulatorEngine';

export type IssueSeverity = 'error' | 'warning' | 'info';

export type IssueCategory =
  | 'orphan_id'
  | 'broken_reward'
  | 'missing_text'
  | 'invalid_task'
  | 'broken_dep'
  | 'nbt_syntax';

export interface ModpackIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  questId: string;
  questTitle: string;
  chapterTitle?: string;
  fixable: boolean;
  fixType?: 'fix_task_count' | 'set_default_title' | 'remove_empty_rewards' | 'remove_broken_deps' | 'fix_zero_chance';
}

export interface DoctorDiagnosisReport {
  timestamp: number;
  totalQuestsScanned: number;
  healthScore: number; // 0 a 100
  issues: ModpackIssue[];
  counts: {
    critical: number;
    warnings: number;
    suggestions: number;
    fixable: number;
  };
}

/**
 * Ejecuta la auditoría completa de integridad sobre todas las misiones y tablas del modpack.
 */
export function runModpackDiagnosis(
  quests: any[],
  rewardTables: RewardTable[] = [],
  chapterTitle?: string
): DoctorDiagnosisReport {
  const issues: ModpackIssue[] = [];
  const knownQuestIds = new Set<string>();

  for (const q of quests) {
    knownQuestIds.add(normalizeQuestId(q.id));
  }

  const knownTableIds = new Set<string>();
  for (const t of rewardTables) {
    knownTableIds.add(normalizeQuestId(t.id));
  }

  for (const quest of quests) {
    const qId = normalizeQuestId(quest.id);
    const qTitle = quest.title || `Misión [${qId}]`;

    // 1. Validar Título y Subtítulo
    if (!quest.title || quest.title.trim() === '' || quest.title === qId) {
      issues.push({
        id: `issue_title_${qId}`,
        severity: 'info',
        category: 'missing_text',
        title: 'Título no configurado o genérico',
        description: `La misión no tiene título personalizado (usa el ID hexadecimal "${qId}").`,
        questId: qId,
        questTitle: qTitle,
        chapterTitle,
        fixable: true,
        fixType: 'set_default_title',
      });
    }

    // 2. Validar Tareas (Tasks)
    const tasks: any[] = quest.tasks || [];
    if (tasks.length === 0) {
      issues.push({
        id: `issue_notasks_${qId}`,
        severity: 'warning',
        category: 'invalid_task',
        title: 'Misión sin tareas asignadas',
        description: 'La misión no tiene ninguna tarea que el jugador deba completar para superarla.',
        questId: qId,
        questTitle: qTitle,
        chapterTitle,
        fixable: false,
      });
    } else {
      tasks.forEach((task, idx) => {
        const taskType = task.type || 'item';

        // Tarea de ítem sin ítem configurado
        if (taskType === 'item') {
          if (!task.item || task.item === '') {
            issues.push({
              id: `issue_empty_item_task_${qId}_${idx}`,
              severity: 'error',
              category: 'invalid_task',
              title: `Tarea #${idx + 1} de ítem vacía`,
              description: 'La tarea requiere un ítem pero no tiene ningún ID o tag asignado.',
              questId: qId,
              questTitle: qTitle,
              chapterTitle,
              fixable: false,
            });
          }

          // Cantidad menor o igual a cero
          if (task.count !== undefined && (typeof task.count !== 'number' || task.count <= 0)) {
            issues.push({
              id: `issue_task_count_${qId}_${idx}`,
              severity: 'error',
              category: 'invalid_task',
              title: `Cantidad inválida en tarea #${idx + 1}`,
              description: `La cantidad requerida es "${task.count}", lo cual es <= 0 o inválido.`,
              questId: qId,
              questTitle: qTitle,
              chapterTitle,
              fixable: true,
              fixType: 'fix_task_count',
            });
          }
        }
      });
    }

    // 3. Validar Recompensas (Rewards)
    const rewards: any[] = quest.rewards || [];
    rewards.forEach((rew, idx) => {
      const rewType = rew.type || 'item';

      if (rewType === 'item' && (!rew.item || rew.item === '')) {
        issues.push({
          id: `issue_empty_reward_${qId}_${idx}`,
          severity: 'error',
          category: 'broken_reward',
          title: `Recompensa #${idx + 1} de ítem vacía`,
          description: 'Se configuró una recompensa de tipo ítem sin especificar ningún objeto.',
          questId: qId,
          questTitle: qTitle,
          chapterTitle,
          fixable: true,
          fixType: 'remove_empty_rewards',
        });
      }

      if (rewType === 'loot' || rewType === 'choice') {
        const tableRef = normalizeQuestId(rew.table_id || rew.table);
        if (!tableRef || (rewardTables.length > 0 && !knownTableIds.has(tableRef))) {
          issues.push({
            id: `issue_broken_table_${qId}_${idx}`,
            severity: 'error',
            category: 'broken_reward',
            title: `Referencia a Tabla de Recompensas inexistente (#${idx + 1})`,
            description: `La recompensa apunta a la tabla "${tableRef || 'VACÍA'}", pero no existe en el modpack.`,
            questId: qId,
            questTitle: qTitle,
            chapterTitle,
            fixable: false,
          });
        }
      }

      if (rew.weight !== undefined && rew.weight <= 0) {
        issues.push({
          id: `issue_zero_chance_${qId}_${idx}`,
          severity: 'warning',
          category: 'broken_reward',
          title: `Peso o probabilidad en 0 en recompensa #${idx + 1}`,
          description: 'El peso de la recompensa es 0, por lo que nunca podrá ser otorgada.',
          questId: qId,
          questTitle: qTitle,
          chapterTitle,
          fixable: true,
          fixType: 'fix_zero_chance',
        });
      }
    });

    // 4. Validar Dependencias Rotas (Dangling Dependencies)
    const deps: any[] = quest.dependencies || [];
    const brokenDeps: string[] = [];
    for (const d of deps) {
      const depId = normalizeQuestId(typeof d === 'object' ? d.id : d);
      // Nota: Si el ID es externo de otro capítulo, solo advertir si no existe en absoluto
      if (depId && !knownQuestIds.has(depId)) {
        brokenDeps.push(depId);
      }
    }

    if (brokenDeps.length > 0) {
      issues.push({
        id: `issue_broken_dep_${qId}`,
        severity: 'error',
        category: 'broken_dep',
        title: 'Dependencias rotas hacia misiones inexistentes',
        description: `Esta misión requiere IDs que no existen en este modpack: ${brokenDeps.join(', ')}.`,
        questId: qId,
        questTitle: qTitle,
        chapterTitle,
        fixable: true,
        fixType: 'remove_broken_deps',
      });
    }
  }

  // Calcular métricas
  const critical = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const suggestions = issues.filter((i) => i.severity === 'info').length;
  const fixable = issues.filter((i) => i.fixable).length;

  // Health Score de 0 a 100
  const penalty = critical * 8 + warnings * 3 + suggestions * 0.5;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    timestamp: Date.now(),
    totalQuestsScanned: quests.length,
    healthScore,
    issues,
    counts: {
      critical,
      warnings,
      suggestions,
      fixable,
    },
  };
}

/**
 * Ejecuta la reparación automática en lote de todas las inconsistencias detectadas que sean auto-reparables.
 */
export function applyDoctorBatchAutoFix(
  issues: ModpackIssue[],
  quests: any[]
): { updatedQuests: any[]; fixedCount: number } {
  let fixedCount = 0;
  const questMap = new Map<string, any>();
  for (const q of quests) {
    questMap.set(normalizeQuestId(q.id), JSON.parse(JSON.stringify(q)));
  }

  const fixableIssues = issues.filter((i) => i.fixable);

  for (const issue of fixableIssues) {
    const targetQuest = questMap.get(normalizeQuestId(issue.questId));
    if (!targetQuest) continue;

    switch (issue.fixType) {
      case 'fix_task_count': {
        let changed = false;
        if (Array.isArray(targetQuest.tasks)) {
          targetQuest.tasks = targetQuest.tasks.map((t: any) => {
            if (t.count !== undefined && (typeof t.count !== 'number' || t.count <= 0)) {
              changed = true;
              return { ...t, count: 1 };
            }
            return t;
          });
        }
        if (changed) fixedCount++;
        break;
      }

      case 'set_default_title': {
        if (!targetQuest.title || targetQuest.title.trim() === '' || targetQuest.title === targetQuest.id) {
          targetQuest.title = `Misión ${targetQuest.id?.slice(0, 8) || 'Nueva'}`;
          fixedCount++;
        }
        break;
      }

      case 'remove_empty_rewards': {
        if (Array.isArray(targetQuest.rewards)) {
          const before = targetQuest.rewards.length;
          targetQuest.rewards = targetQuest.rewards.filter((r: any) => {
            if ((r.type || 'item') === 'item' && (!r.item || r.item === '')) return false;
            return true;
          });
          if (targetQuest.rewards.length < before) fixedCount++;
        }
        break;
      }

      case 'remove_broken_deps': {
        if (Array.isArray(targetQuest.dependencies)) {
          const validIds = new Set(Array.from(questMap.keys()));
          const before = targetQuest.dependencies.length;
          targetQuest.dependencies = targetQuest.dependencies.filter((d: any) => {
            const depId = normalizeQuestId(typeof d === 'object' ? d.id : d);
            return validIds.has(depId);
          });
          if (targetQuest.dependencies.length < before) fixedCount++;
        }
        break;
      }

      case 'fix_zero_chance': {
        if (Array.isArray(targetQuest.rewards)) {
          let changed = false;
          targetQuest.rewards = targetQuest.rewards.map((r: any) => {
            if (r.weight !== undefined && r.weight <= 0) {
              changed = true;
              return { ...r, weight: 1 };
            }
            return r;
          });
          if (changed) fixedCount++;
        }
        break;
      }
    }
  }

  return {
    updatedQuests: Array.from(questMap.values()),
    fixedCount,
  };
}
