"use client";

import React, { useState } from "react";
import { 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  RotateCcw,
  ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AnswerItemDTO } from "@/lib/data";

interface AnswersBlockProps {
  title?: string;
  items?: AnswerItemDTO[];
}

export function AnswersBlock({ title, items }: AnswersBlockProps) {
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-12 w-full max-w-4xl mx-auto">
      {title && (
        <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-[--color-border-main]">
          <div className="bg-[--color-action]/10 p-1.5 rounded-md text-[--color-action]">
             <ListChecks size={18} />
          </div>
          <h3 className="text-base font-semibold text-[--color-text-primary] uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      
      {/* Контейнер списка - делаем единый блок с разделителями для аккуратности */}
      <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-xl shadow-sm overflow-hidden divide-y divide-[--color-border-main]">
        {items.map((item) => (
          <AnswerRow 
            key={item.id || item.number} 
            item={item} 
            forceShowAnswer={showAllAnswers}
          />
        ))}
      </div>

      {/* Футер с кнопкой */}
      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllAnswers(!showAllAnswers)}
          className="text-[--color-text-secondary] hover:text-[--color-action] text-xs font-medium h-8 px-3"
        >
          {showAllAnswers ? (
            <>
              <EyeOff size={14} className="mr-1.5" /> Скрыть ответы
            </>
          ) : (
            <>
              <Eye size={14} className="mr-1.5" /> Показать все ответы
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// --- Строка одного ответа ---

function AnswerRow({ item, forceShowAnswer }: { item: AnswerItemDTO; forceShowAnswer: boolean }) {
  const [userAnswer, setUserAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [isSolutionOpen, setIsSolutionOpen] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Нормализация (убираем пробелы, запятые, регистр) для гибкой проверки
  const normalize = (val: string) => val.replace(/[\s,]/g, "").toLowerCase();

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;

    // Собираем все варианты ответа в один массив строк
    const flatAnswers = item.correctAnswers.flat();
    
    // 1. Проверяем точное совпадение с любым из вариантов (нормализованное)
    const isMatch = flatAnswers.some(ans => normalize(ans) === normalize(userAnswer));
    
    // 2. Проверяем склейку (для заданий где два числа: "30 40")
    const joinedCorrect = normalize(flatAnswers.join(""));
    const isJoinedMatch = normalize(userAnswer) === joinedCorrect;

    if (isMatch || isJoinedMatch) {
      setStatus("correct");
      setIsSolutionOpen(false); // Закрываем подсказку если решил
    } else {
      setStatus("incorrect");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") checkAnswer();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
    // Сбрасываем статус при изменении ввода
    if (status !== "idle") {
      setStatus("idle");
    }
  };
  
  const resetAnswer = () => {
    setStatus("idle");
    setUserAnswer("");
    setIsSolutionOpen(false);
    // Фокусируем поле ввода
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Показываем ответ, если нажата глобальная кнопка ИЛИ пользователь открыл сам
  const showAnswerBlock = forceShowAnswer || isSolutionOpen;

  // Форматирование правильного ответа для вывода
  const formatCorrectAnswer = (answers: string[][]) => {
    // Если простой ответ
    if (answers.length === 1 && answers[0].length === 1) {
      return <span className="font-mono text-base font-semibold text-[--color-text-primary] bg-[--color-page-bg] px-3 py-1.5 rounded-md border border-[--color-border-main] inline-block">{answers[0][0]}</span>;
    }
    // Если сложный (таблица/несколько строк)
    return (
      <div className="flex flex-col gap-1.5">
        {answers.map((row, idx) => (
          <div key={idx} className="flex gap-1.5 flex-wrap">
            {row.map((cell, cIdx) => (
               <span key={cIdx} className="font-mono text-sm font-semibold bg-[--color-page-bg] text-[--color-text-primary] px-2.5 py-1 rounded-md border border-[--color-border-main]">
                 {cell}
               </span>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn(
      "group bg-[--color-bg-secondary] transition-all duration-200",
      status === "correct" && "bg-emerald-500/5",
      status === "incorrect" && "bg-red-500/5"
    )}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3">
        
        {/* 1. НОМЕР */}
        <div className="flex sm:block items-center gap-2 sm:w-10 flex-shrink-0">
           <div className={cn(
             "w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold border transition-all",
             status === "correct" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
             status === "incorrect" ? "bg-red-50 border-red-200 text-red-700" :
             "bg-[--color-zinc-50] border-[--color-border-main] text-[--color-text-primary]"
           )}>
             {item.number}
           </div>
           
           {/* Статус на мобильных */}
           {status === "correct" && (
             <span className="text-emerald-600 text-xs font-semibold sm:hidden">Верно!</span>
           )}
           {status === "incorrect" && (
             <span className="text-red-600 text-xs font-semibold sm:hidden">Неверно</span>
           )}
        </div>

        {/* 2. ПОЛЕ ВВОДА */}
        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ваш ответ" 
            value={userAnswer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={status === "correct" || forceShowAnswer}
            className={cn(
              "w-full h-9 px-3 text-sm transition-all rounded-md border outline-none",
              "bg-[--color-page-bg] text-[--color-text-primary]",
              "placeholder:text-[--color-text-secondary]",
              status === "correct" 
                ? "border-emerald-300 text-emerald-700 bg-emerald-50/50" 
                : status === "incorrect" 
                  ? "border-red-300 text-red-700 bg-red-50/50"
                  : "border-[--color-border-main] focus:border-[--color-action] focus:ring-1 focus:ring-[--color-action]/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        </div>

        {/* 3. КНОПКИ */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* Кнопка ПРОВЕРИТЬ */}
          {status !== "correct" && !forceShowAnswer && (
            <Button
              size="sm"
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className={cn(
                "h-9 px-4 text-xs font-semibold transition-all flex-1 sm:flex-none",
                status === "incorrect" 
                  ? "bg-orange-600 hover:bg-orange-700 text-white" 
                  : "bg-[--color-action] hover:bg-[--color-action-hover] text-[--color-action-text]"
              )}
            >
              {status === "incorrect" ? "Еще раз" : "Проверить"}
            </Button>
          )}

          {/* Статус ВЕРНО */}
          {status === "correct" && !forceShowAnswer && (
             <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200">
                  <Check size={14} strokeWidth={2.5} className="text-emerald-600" />
                  <span className="text-emerald-700 text-xs font-semibold">Верно</span>
                </div>
                <button 
                  onClick={resetAnswer}
                  className="p-2 text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-zinc-50] rounded-md transition-all"
                  title="Решить заново"
                >
                  <RotateCcw size={14} />
                </button>
             </div>
          )}

          {/* Кнопка ПОДСКАЗКА */}
          {status !== "correct" && !forceShowAnswer && (
             <button
               onClick={() => setIsSolutionOpen(!isSolutionOpen)}
               className={cn(
                 "h-9 px-3 flex items-center gap-1.5 rounded-md border transition-all text-xs font-medium",
                 isSolutionOpen 
                    ? "bg-[--color-action]/10 border-[--color-action]/50 text-[--color-action]"
                    : "bg-[--color-page-bg] border-[--color-border-main] text-[--color-text-secondary] hover:text-[--color-action] hover:border-[--color-action]/50"
               )}
               title={isSolutionOpen ? "Скрыть ответ" : "Показать ответ"}
             >
               {isSolutionOpen ? <EyeOff size={14} /> : <Eye size={14} />}
               <span className="hidden sm:inline">{isSolutionOpen ? "Скрыть" : "Подсказка"}</span>
             </button>
          )}

        </div>
      </div>

      {/* БЛОК С ПРАВИЛЬНЫМ ОТВЕТОМ */}
      {showAnswerBlock && (
        <div className="border-t border-[--color-border-main] px-3 py-3 bg-[--color-zinc-50] animate-in slide-in-from-top-2 duration-200">
           <div className="flex items-start gap-2.5">
              <div className="bg-emerald-500/15 p-1.5 rounded-md flex-shrink-0">
                <Check size={16} className="text-emerald-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-[--color-text-secondary] mb-1.5">Правильный ответ:</div>
                <div className="text-sm">
                  {formatCorrectAnswer(item.correctAnswers)}
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}