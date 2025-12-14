"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/lib/data";

interface TaskBlockProps {
  task: TaskDTO;
}

export function TaskBlock({ task }: TaskBlockProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [showSolution, setShowSolution] = useState(false);

  const checkAnswer = () => {
    let isCorrect = false;
    
    if (task.taskType === "choice") {
      const correctOption = task.choices?.find(c => c.isCorrect);
      // Сравниваем ID выбранного с ID правильного
      isCorrect = correctOption?.id === selectedChoice;
    } else if (task.taskType === "input") {
      // Сравниваем строки, убираем пробелы
      isCorrect = inputValue.trim().toLowerCase() === task.correctAnswer?.trim().toLowerCase();
    } else if (task.taskType === "code") {
      // Для задач с кодом пока просто засчитываем выполнение по нажатию
      isCorrect = true; 
    }
    
    setStatus(isCorrect ? "correct" : "incorrect");
  };

  return (
    <Card className="border border-border-main overflow-hidden mb-10 shadow-sm">
      {/* Шапка задачи: Баллы, Категория, ID */}
      <div className="bg-zinc-50/50 border-b border-border-main px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <span className="bg-action text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
             {task.points} БАЛ.
           </span>
           <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
             {task.category || "Общая задача"}
           </span>
        </div>
        <div className="text-[10px] text-text-secondary font-mono opacity-50">
          ID: {task.id.slice(0, 8)}...
        </div>
      </div>

      <div className="p-6">
        {/* 
            ОСНОВНОЙ БЛОК ВОПРОСА 
            Класс .rich-text-content определен в globals.css и исправляет отступы, 
            шрифты и картинки из базы данных.
        */}
        <div 
          className="rich-text-content mb-8"
          dangerouslySetInnerHTML={{ __html: task.question }} 
        />
        
        {/* ВАРИАНТЫ ОТВЕТА (ЕСЛИ ТЕСТ) */}
        {task.taskType === "choice" && task.choices && (
          <div className="space-y-3 max-w-2xl">
            {task.choices.map((choice) => (
              <div 
                key={choice.id}
                onClick={() => status !== 'correct' && setSelectedChoice(choice.id)}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden",
                  // Стили для выбранного состояния
                  selectedChoice === choice.id 
                    ? "border-action ring-1 ring-action bg-action/5" 
                    : "border-border-main hover:bg-zinc-50",
                  // Стили для правильного/неправильного после проверки
                  status === 'correct' && choice.isCorrect && "bg-emerald-50 border-emerald-500 ring-emerald-500 text-emerald-900",
                  status === 'incorrect' && selectedChoice === choice.id && "bg-red-50 border-red-500 text-red-900"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  selectedChoice === choice.id ? "border-action bg-action" : "border-zinc-300",
                  status === 'correct' && choice.isCorrect && "border-emerald-500 bg-emerald-500",
                  status === 'incorrect' && selectedChoice === choice.id && "border-red-500 bg-red-500"
                )}>
                  {selectedChoice === choice.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-sm font-medium">{choice.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* ПОЛЕ ВВОДА (ЕСЛИ КРАТКИЙ ОТВЕТ) */}
        {task.taskType === "input" && (
          <div className="mt-4 max-w-sm">
            <input 
              type="text"
              placeholder="Введите ответ..."
              className={cn(
                "w-full p-3 border rounded-md outline-none transition-colors font-medium",
                status === 'correct' 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900" 
                  : status === 'incorrect'
                    ? "border-red-500 bg-red-50 text-red-900 focus:border-red-500"
                    : "border-border-main focus:border-action focus:ring-2 focus:ring-action/10"
              )}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (status === 'incorrect') setStatus('idle'); // Сброс ошибки при вводе
              }}
              disabled={status === 'correct'}
            />
          </div>
        )}

        {/* БЛОК КОДА (ЕСЛИ ЗАДАЧА НА КОД) */}
        {task.taskType === "code" && (
          <div className="mt-4">
             <div className="bg-[#1e1e1e] text-zinc-100 p-4 rounded-md font-mono text-sm overflow-x-auto border border-zinc-800">
               <div className="text-xs text-zinc-500 mb-2 select-none">// Python Template</div>
               <pre>{task.codeTemplates?.python || "# Напишите ваше решение здесь"}</pre>
             </div>
          </div>
        )}

        {/* ФУТЕР: КНОПКИ И СТАТУСЫ */}
        <div className="mt-8 pt-6 border-t border-border-main flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
            
            <Button 
                variant="ghost" 
                onClick={() => setShowSolution(!showSolution)}
                className="text-text-secondary hover:text-action self-start sm:self-auto pl-0 sm:pl-4"
            >
                {showSolution ? "Скрыть решение" : "Показать решение"}
                {showSolution ? <ChevronUp size={16} className="ml-2"/> : <ChevronDown size={16} className="ml-2"/>}
            </Button>

            <div className="flex items-center gap-4 self-end sm:self-auto">
                {status === 'correct' && (
                    <span className="text-emerald-600 font-bold flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-1">
                        <CheckCircle2 size={18} /> Верно
                    </span>
                )}
                {status === 'incorrect' && (
                    <span className="text-red-600 font-bold flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-1">
                        <XCircle size={18} /> Неверно
                    </span>
                )}
                
                <Button 
                  onClick={checkAnswer} 
                  disabled={status === 'correct' || (task.taskType === 'input' && !inputValue) || (task.taskType === 'choice' && !selectedChoice)}
                  className={cn(
                    status === 'correct' ? "bg-emerald-600 hover:bg-emerald-700" : ""
                  )}
                >
                    {status === 'correct' ? "Решено" : "Проверить"}
                </Button>
            </div>
        </div>

        {/* БЛОК С РЕШЕНИЕМ */}
        {showSolution && task.solution && (
            <div className="mt-6 p-5 bg-zinc-50 border border-border-main rounded-lg animate-in fade-in slide-in-from-top-2">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-text-primary">
                    <HelpCircle size={16} className="text-action" /> Пояснение
                </h4>
                
                {/* Рендерим решение тоже как HTML, на случай картинок или формул */}
                <div 
                  className="rich-text-content text-sm text-text-secondary"
                  dangerouslySetInnerHTML={{ __html: task.solution.explanation }}
                />

                <div className="mt-4 pt-3 border-t border-border-main/50 text-sm">
                    <span className="font-medium text-text-primary">Правильный ответ: </span>
                    <span className="font-mono bg-zinc-200 px-2 py-0.5 rounded text-text-primary ml-2">
                      {task.correctAnswer || (task.choices?.find(c => c.isCorrect)?.text) || "См. пояснение"}
                    </span>
                </div>
            </div>
        )}
      </div>
    </Card>
  );
}