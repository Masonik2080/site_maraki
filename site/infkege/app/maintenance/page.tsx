"use client";

import { useEffect, useState } from "react";
import { Wrench, Clock } from "lucide-react";

export default function MaintenancePage() {
  const [message, setMessage] = useState("Сайт временно недоступен. Ведутся технические работы.");

  useEffect(() => {
    // Загружаем кастомное сообщение из настроек
    fetch("/api/admin/settings/general")
      .then((r) => r.json())
      .then((data) => {
        if (data?.maintenanceMessage) {
          setMessage(data.maintenanceMessage);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[--color-page-bg] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <Wrench className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-[--color-text-primary] mb-3">
          Техническое обслуживание
        </h1>
        
        <p className="text-[--color-text-secondary] mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-[--color-text-secondary]">
          <Clock className="w-4 h-4" />
          <span>Скоро вернёмся</span>
        </div>
        
        <div className="mt-8 pt-6 border-t border-[--color-border-main]">
          <p className="text-xs text-[--color-text-secondary]">
            Если у вас срочный вопрос, напишите на{" "}
            <a 
              href="mailto:support@infkege.ru" 
              className="text-[--color-action] hover:underline"
            >
              support@infkege.ru
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
