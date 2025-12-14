// lib/content/sbornik.mapper.ts
// Maps sbornik JSON format to CourseDTO
import type {
  CourseDTO,
  LessonDTO,
  LessonBlockDTO,
  SectionDTO,
  FileDTO,
  AnswerItemDTO,
  RawSbornikJson,
} from './types';

// Escape HTML entities
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

export function mapSbornikToCourse(json: RawSbornikJson, filename: string): CourseDTO {
  const { meta, variants, intro: introData, global_resources: resourcesData = [] } = json;
  
  const introLessons: LessonDTO[] = [];
  
  // Intro materials
  if (introData?.materials?.length) {
    const introBlocks: LessonBlockDTO[] = [
      { type: 'text', content: `<h1 class="text-3xl font-bold mb-6">${introData.title || 'Введение'}</h1>` }
    ];
    
    for (const mat of introData.materials) {
      let contentHtml = "";
      if (mat.title) contentHtml += `<h3 class="text-xl font-semibold mt-6 mb-3">${mat.title}</h3>`;
      if (mat.content) contentHtml += `<div class="text-base leading-7">${escapeHtml(mat.content)}</div>`;
      introBlocks.push({ type: 'text', content: contentHtml });
    }
    
    introLessons.push({ 
      id: 'lesson-intro-main', 
      title: 'О сборнике', 
      order: 1, 
      contentBlocks: introBlocks 
    });
  }
  
  // Global resources
  if (resourcesData.length > 0) {
    const resBlocks: LessonBlockDTO[] = [
      { 
        type: 'text', 
        content: `<h2 class="text-2xl font-bold mb-4">Материалы и ответы</h2><p>Здесь собраны общие файлы ответов ко всем вариантам.</p>` 
      }
    ];
    
    for (const res of resourcesData) {
      if (res.type === 'pdf' && res.url) {
        resBlocks.push({ type: 'divider' });
        resBlocks.push({ type: 'pdf-viewer', title: res.title, fileUrl: res.url });
      } else if (res.type === 'placeholder') {
        resBlocks.push({ 
          type: 'text', 
          content: `<div class="bg-zinc-50 border border-border-main rounded-lg p-4 mt-4">
            <h4 class="font-bold text-text-primary">${res.title}</h4>
            <p class="text-sm text-text-secondary mt-1 italic">${res.description || 'Файл еще не загружен.'}</p>
          </div>` 
        });
      }
    }
    
    introLessons.push({ 
      id: 'lesson-intro-resources', 
      title: 'Ответы и файлы', 
      order: 2, 
      contentBlocks: resBlocks 
    });
  }

  // Variant lessons
  const variantLessons: LessonDTO[] = variants.map((v, index) => {
    const blocks: LessonBlockDTO[] = [];
    
    // Main document
    if (v.materials?.main_document?.url) {
      blocks.push({ 
        type: 'pdf-viewer', 
        title: v.materials.main_document.filename || `Условие варианта №${v.number}`, 
        fileUrl: v.materials.main_document.url 
      });
    }
    
    // Attachments
    if (v.materials?.attachments?.length) {
      const files: FileDTO[] = v.materials.attachments.map(att => ({ 
        name: att.filename, 
        url: att.url, 
        size: 0 
      }));
      blocks.push({ type: 'files', files });
    }
    
    // Answers
    if (v.answers?.length) {
      blocks.push({ type: 'divider' });
      
      const items: AnswerItemDTO[] = v.answers.map(ans => {
        const rawValue = String(ans.value);
        let correctAnswers: string[][];
        
        if (ans.is_multiline || rawValue.includes('\n')) {
          correctAnswers = rawValue.split('\n').map(row => 
            row.split(',').map(cell => cell.trim())
          );
        } else {
          correctAnswers = rawValue.includes(',') 
            ? [rawValue.split(',').map(s => s.trim())] 
            : [[rawValue.trim()]];
        }
        
        return { 
          id: `ans-${v.id}-${ans.task}`, 
          number: String(ans.task), 
          correctAnswers 
        };
      });
      
      blocks.push({ type: 'answers', title: 'Ответы для самопроверки', items });
    }
    
    // Solutions
    if (v.solutions?.length) {
      blocks.push({ type: 'divider' });
      blocks.push({ type: 'text', content: '<h2 class="text-xl font-bold">Разбор заданий</h2>' });
      
      const sortedSolutions = [...v.solutions].sort((a, b) => a.task_number - b.task_number);
      
      for (const sol of sortedSolutions) {
        blocks.push({ 
          type: 'text', 
          content: `<p class="font-medium text-lg mt-8 mb-2 flex items-center gap-2">
            <span class="bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-sm">№${sol.task_number}</span>
          </p>` 
        });
        
        if (sol.type === 'video' && sol.content?.provider === 'rutube') {
          blocks.push({ type: 'rutube', embedUrl: sol.content.url, title: sol.content.title });
        } else if (sol.type === 'code') {
          blocks.push({ 
            type: 'code', 
            title: sol.content.title || 'Код решения (Python)', 
            content: sol.content.snippet 
          });
        }
      }
    }
    
    return { 
      id: v.id || v.slug || `variant-${index}`, 
      title: v.title, 
      order: v.number || index + 1, 
      contentBlocks: blocks 
    };
  });

  // Build sections
  const sections: SectionDTO[] = [];
  
  if (introLessons.length > 0) {
    sections.push({ 
      id: 'sec-intro', 
      title: 'Введение', 
      order: 0, 
      modules: [{ id: 'mod-intro', title: 'Информация', order: 0, lessons: introLessons }] 
    });
  }
  
  if (variantLessons.length > 0) {
    sections.push({ 
      id: 'sec-variants', 
      title: 'Варианты ЕГЭ', 
      order: 1, 
      modules: [{ id: 'mod-variants', title: 'Варианты', order: 1, lessons: variantLessons }] 
    });
  }

  const slug = filename.replace('.json', '');
  
  return {
    id: meta.id || slug,
    slug,
    title: meta.title || "Сборник вариантов",
    description: `Версия сборника: ${meta.version}. Всего вариантов: ${meta.total_variants}`,
    price: 0,
    subtitle: "Сборник ЕГЭ",
    iconName: "BookOpen",
    modules: sections.flatMap(s => s.modules), 
    sections
  };
}
