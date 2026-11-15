/**
 * Buscar y reemplazar masivo sobre misiones e imágenes (títulos, descripciones, tareas,
 * recompensas e iconos). Las funciones devuelven copias y acumulan los contadores en `stats`.
 */
export interface ReplaceFields {
  titles: boolean;
  descriptions: boolean;
  tasks: boolean;
  rewards: boolean;
  icons: boolean;
}

export function createReplacer(searchQuery: string, replaceWith: string, fields: ReplaceFields) {
  const stats = { totalReplacements: 0, modifiedQuestsCount: 0 };

  const replaceInQuest = (q: any) => {
    let isModified = false;
    const qCopy = JSON.parse(JSON.stringify(q));

    // 1. Títulos y Subtítulos
    if (fields.titles) {
      if (typeof qCopy.title === 'string' && qCopy.title.includes(searchQuery)) {
        const count = qCopy.title.split(searchQuery).length - 1;
        qCopy.title = qCopy.title.replaceAll(searchQuery, replaceWith);
        stats.totalReplacements += count;
        isModified = true;
      }
      if (typeof qCopy.subtitle === 'string' && qCopy.subtitle.includes(searchQuery)) {
        const count = qCopy.subtitle.split(searchQuery).length - 1;
        qCopy.subtitle = qCopy.subtitle.replaceAll(searchQuery, replaceWith);
        stats.totalReplacements += count;
        isModified = true;
      }
    }

    // 2. Descripciones
    if (fields.descriptions && Array.isArray(qCopy.description)) {
      qCopy.description = qCopy.description.map((line: any) => {
        if (typeof line === 'string' && line.includes(searchQuery)) {
          const count = line.split(searchQuery).length - 1;
          stats.totalReplacements += count;
          isModified = true;
          return line.replaceAll(searchQuery, replaceWith);
        }
        return line;
      });
    }

    // 3. Tareas
    if (fields.tasks && qCopy.tasks) {
      const taskList = Array.isArray(qCopy.tasks) ? qCopy.tasks : [qCopy.tasks];
      taskList.forEach((t: any) => {
        if (!t) return;
        if (typeof t.item === 'string' && t.item.includes(searchQuery)) {
          const count = t.item.split(searchQuery).length - 1;
          t.item = t.item.replaceAll(searchQuery, replaceWith);
          stats.totalReplacements += count;
          isModified = true;
        }
        if (t.item && typeof t.item === 'object' && typeof t.item.id === 'string' && t.item.id.includes(searchQuery)) {
          const count = t.item.id.split(searchQuery).length - 1;
          t.item.id = t.item.id.replaceAll(searchQuery, replaceWith);
          stats.totalReplacements += count;
          isModified = true;
        }
        if (typeof t.title === 'string' && t.title.includes(searchQuery)) {
          const count = t.title.split(searchQuery).length - 1;
          t.title = t.title.replaceAll(searchQuery, replaceWith);
          stats.totalReplacements += count;
          isModified = true;
        }
      });
    }

    // 4. Recompensas
    if (fields.rewards && qCopy.rewards) {
      const rewardList = Array.isArray(qCopy.rewards) ? qCopy.rewards : [qCopy.rewards];
      rewardList.forEach((r: any) => {
        if (!r) return;
        if (typeof r.item === 'string' && r.item.includes(searchQuery)) {
          const count = r.item.split(searchQuery).length - 1;
          r.item = r.item.replaceAll(searchQuery, replaceWith);
          stats.totalReplacements += count;
          isModified = true;
        }
        if (r.item && typeof r.item === 'object' && typeof r.item.id === 'string' && r.item.id.includes(searchQuery)) {
          const count = r.item.id.split(searchQuery).length - 1;
          r.item.id = r.item.id.replaceAll(searchQuery, replaceWith);
          stats.totalReplacements += count;
          isModified = true;
        }
        if (typeof r.title === 'string' && r.title.includes(searchQuery)) {
          const count = r.title.split(searchQuery).length - 1;
          r.title = r.title.replaceAll(searchQuery, replaceWith);
          stats.totalReplacements += count;
          isModified = true;
        }
        if (typeof r.command === 'string' && r.command.includes(searchQuery)) {
          const count = r.command.split(searchQuery).length - 1;
          r.command = r.command.replaceAll(searchQuery, replaceWith);
          stats.totalReplacements += count;
          isModified = true;
        }
      });
    }

    // 5. Iconos
    if (fields.icons) {
      if (typeof qCopy.icon === 'string' && qCopy.icon.includes(searchQuery)) {
        const count = qCopy.icon.split(searchQuery).length - 1;
        qCopy.icon = qCopy.icon.replaceAll(searchQuery, replaceWith);
        stats.totalReplacements += count;
        isModified = true;
      }
    }

    if (isModified) stats.modifiedQuestsCount++;
    return isModified ? qCopy : q;
  };

  const replaceInImages = (imgList: any[]) => {
    if (!fields.icons) return imgList;
    return imgList.map(img => {
      if (img && typeof img.image === 'string' && img.image.includes(searchQuery)) {
        const count = img.image.split(searchQuery).length - 1;
        stats.totalReplacements += count;
        return { ...img, image: img.image.replaceAll(searchQuery, replaceWith) };
      }
      return img;
    });
  };

  return { replaceInQuest, replaceInImages, stats };
}
