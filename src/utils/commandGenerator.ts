/**
 * commandGenerator.ts
 *
 * Generador de comandos de consola de Minecraft y scripts KubeJS para pruebas de FTB Quests.
 * Permite:
 * - Generar comandos directos para /ftbquests (completar/reiniciar misiones y capítulos).
 * - Generar comandos /give para todos los ítems requeridos en las tareas del capítulo.
 * - Generar scripts para KubeJS Server Events que registran comandos de prueba rápidos.
 */

import { normalizeQuestId } from './questSimulatorEngine';

/**
 * Genera el comando para completar una misión específica en el cliente/servidor.
 */
export function getCompleteQuestCommand(questId: string, playerTarget: string = '@p'): string {
  const qId = normalizeQuestId(questId);
  return `/ftbquests change_progress ${playerTarget} complete ${qId}`;
}

/**
 * Genera el comando para reiniciar una misión específica.
 */
export function getResetQuestCommand(questId: string, playerTarget: string = '@p'): string {
  const qId = normalizeQuestId(questId);
  return `/ftbquests change_progress ${playerTarget} reset ${qId}`;
}

/**
 * Genera comandos en lote para completar todo un capítulo.
 */
export function getCompleteChapterCommands(quests: any[], playerTarget: string = '@p'): string[] {
  return quests.map((q) => getCompleteQuestCommand(q.id, playerTarget));
}

/**
 * Genera comandos /give de Minecraft para todos los materiales necesarios en las tareas del capítulo.
 */
export function getGiveRequiredItemsCommands(quests: any[], playerTarget: string = '@p'): string[] {
  const itemMap = new Map<string, number>();

  for (const quest of quests) {
    const tasks: any[] = quest.tasks || [];
    for (const task of tasks) {
      if ((task.type || 'item') === 'item' && task.item) {
        const itemId = typeof task.item === 'string' ? task.item : task.item?.id;
        if (itemId && !itemId.startsWith('#')) {
          const count = typeof task.count === 'number' && task.count > 0 ? task.count : 1;
          itemMap.set(itemId, (itemMap.get(itemId) || 0) + count);
        }
      }
    }
  }

  return Array.from(itemMap.entries()).map(([item, count]) => {
    return `/give ${playerTarget} ${item} ${count}`;
  });
}

/**
 * Genera un script KubeJS completo para registrar comandos de testeo en el servidor.
 */
export function generateKubeJsTestScript(chapterTitle: string, quests: any[]): string {
  const questIds = quests.map((q) => normalizeQuestId(q.id)).filter(Boolean);
  const jsonIds = JSON.stringify(questIds, null, 2);

  return `// KubeJS Server Script - FTB Quests Auto-Tester
// Generado automáticamente por FTB Quest Studio
// Colocar este archivo en: kubejs/server_scripts/ftb_tester_${chapterTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.js

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event;

  // Comando 1: Completar todo el capítulo "${chapterTitle}"
  event.register(
    Commands.literal('test_complete_chapter')
      .requires(s => s.hasPermission(2))
      .executes(ctx => {
        const player = ctx.source.player;
        if (!player) return 0;
        
        const questIds = ${jsonIds};

        questIds.forEach(id => {
          player.server.runCommandSilent(\`ftbquests change_progress \${player.username} complete \${id}\`);
        });

        player.tell(Text.green('✔ ¡Capítulo "${chapterTitle}" completado con éxito! (' + questIds.length + ' misiones)'));
        return 1;
      })
  );

  // Comando 2: Reiniciar todo el capítulo "${chapterTitle}"
  event.register(
    Commands.literal('test_reset_chapter')
      .requires(s => s.hasPermission(2))
      .executes(ctx => {
        const player = ctx.source.player;
        if (!player) return 0;
        
        const questIds = ${jsonIds};

        questIds.forEach(id => {
          player.server.runCommandSilent(\`ftbquests change_progress \${player.username} reset \${id}\`);
        });

        player.tell(Text.yellow('↺ ¡Capítulo "${chapterTitle}" reiniciado a cero!'));
        return 1;
      })
  );
});
`;
}
