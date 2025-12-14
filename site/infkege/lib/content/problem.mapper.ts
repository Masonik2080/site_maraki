// lib/content/problem.mapper.ts
// Maps database problems to TaskDTO
import type { TaskDTO, TaskType, TaskChoice, RawDbProblem } from './types';

export function mapDbProblemToTask(dbProblem: RawDbProblem): TaskDTO {
  const { content: contentRaw, answer: answerRaw } = dbProblem;
  
  let questionText = "Текст задачи отсутствует";
  let codeTemplate = "";
  let description = "";
  let points = 1;
  
  // Parse content
  if (typeof contentRaw === 'string') {
    questionText = contentRaw.startsWith('"') && contentRaw.endsWith('"') 
      ? contentRaw.slice(1, -1) 
      : contentRaw;
    questionText = questionText.replace(/\\"/g, '"');
  } else if (contentRaw && typeof contentRaw === 'object') {
    questionText = contentRaw.text || contentRaw.question || contentRaw.body || "Текст задачи отсутствует";
    codeTemplate = contentRaw.codeTemplate || "";
    description = contentRaw.description || "";
    points = contentRaw.points || 1;
  }
  
  // Parse answer
  let type: TaskType = 'input';
  let choices: TaskChoice[] | undefined;
  let correctAnswer: string | undefined;
  
  if (typeof answerRaw === 'string') {
    correctAnswer = answerRaw.replace(/"/g, "");
  } else if (answerRaw && typeof answerRaw === 'object') {
    if (Array.isArray(answerRaw.choices) && answerRaw.choices.length > 0) {
      type = 'choice';
      choices = answerRaw.choices;
    } else {
      correctAnswer = answerRaw.value || answerRaw.correct || String(answerRaw);
    }
  }
  
  if (codeTemplate) type = 'code';
  
  return {
    id: dbProblem.id,
    title: dbProblem.internal_id ? `Задача ${dbProblem.internal_id}` : "Задача",
    description,
    taskType: type,
    question: questionText,
    points,
    choices,
    correctAnswer,
    codeTemplates: type === 'code' ? { python: codeTemplate } : undefined,
    solution: dbProblem.solution_content 
      ? { text: "Решение", explanation: dbProblem.solution_content } 
      : undefined,
    category: dbProblem.problem_categories?.name || "Общее"
  };
}
