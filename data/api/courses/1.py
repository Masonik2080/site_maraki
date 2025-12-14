import json
import re
import os
from datetime import datetime

# --- КОНФИГУРАЦИЯ ---
INPUT_FILE = r'C:\Users\1\Desktop 2\data\api\courses\sbornik_readable_export.txt'
OUTPUT_FILE = r'C:\Users\1\Desktop 2\data\api\courses\sbornik_data.json'

def parse_answers(text_block):
    """Парсит блок ответов"""
    answers_map = {}
    if not text_block: return answers_map

    # Разбиваем по заголовкам ">>> Вариант X"
    parts = re.split(r'>>> Вариант\s+(\d+)', text_block)
    
    # parts[0] - мусор, parts[1] - номер, parts[2] - контент, parts[3] - номер...
    for i in range(1, len(parts), 2):
        var_num = int(parts[i])
        content = parts[i+1]
        
        tasks = []
        current_task = None
        
        for line in content.strip().split('\n'):
            line = line.strip()
            if not line or line.startswith('---'): continue
            
            # Поиск строки "Задание №1: ответ"
            match = re.match(r'Задание\s*№(\d+):\s*(.*)', line)
            if match:
                if current_task: tasks.append(current_task)
                current_task = {
                    "task": int(match.group(1)),
                    "value": match.group(2).strip(),
                    "is_multiline": False
                }
            elif current_task:
                # Многострочный ответ
                if current_task["value"]:
                    current_task["value"] += "\n" + line
                else:
                    current_task["value"] = line
                current_task["is_multiline"] = True
        
        if current_task: tasks.append(current_task)
        answers_map[var_num] = tasks
        
    return answers_map

def parse_sbornik(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        full_text = f.read()

    # 1. Разделяем основную часть и ответы
    split_marker = 'КЛЮЧИ И ОТВЕТЫ КО ВСЕМ ВАРИАНТАМ'
    if split_marker in full_text:
        main_content, answers_text = full_text.split(split_marker)
    else:
        main_content, answers_text = full_text, ""

    answers_db = parse_answers(answers_text)

    # 2. Поиск вариантов (Новая логика)
    # Ищем заголовки "ВАРИАНТ X" окруженные хешами
    # Используем finditer чтобы найти позиции начал блоков
    variant_headers = list(re.finditer(r'#{10,}\s*\nВАРИАНТ\s+(\d+)\s*\n#{10,}', main_content))
    
    variants_json = []
    
    for i, match in enumerate(variant_headers):
        var_num = int(match.group(1))
        start_pos = match.end() # Текст начинается сразу после заголовка
        
        # Конец текущего блока - это начало следующего заголовка или конец текста
        end_pos = variant_headers[i+1].start() if i + 1 < len(variant_headers) else len(main_content)
        
        # Извлекаем текст конкретного варианта
        block_text = main_content[start_pos:end_pos]
        
        variant_obj = {
            "id": f"var-{var_num:02d}",
            "number": var_num,
            "title": f"Вариант {var_num}",
            "slug": f"variant-{var_num}",
            "materials": {
                "main_document": {},
                "attachments": []
            },
            "solutions": [],
            "answers": answers_db.get(var_num, [])
        }

        # --- Материалы ---
        # PDF
        pdf_match = re.search(r'\[PDF Файл\]:\s*(.*?)\nСсылка:\s*(.*)', block_text)
        if pdf_match:
            fname = pdf_match.group(1).strip()
            if not fname or fname.lower() == "pdf файл": fname = f"variant_{var_num}.pdf"
            if not fname.endswith('.pdf'): fname += ".pdf"
            
            variant_obj["materials"]["main_document"] = {
                "type": "pdf",
                "filename": fname,
                "url": pdf_match.group(2).strip()
            }
            
        # ZIP
        zip_matches = re.finditer(r'->\s*(.*?)\s*\((.*?)\)', block_text)
        for zm in zip_matches:
            variant_obj["materials"]["attachments"].append({
                "type": "zip",
                "label": "Материалы к варианту",
                "filename": zm.group(1).strip(),
                "url": zm.group(2).strip()
            })

        # --- Решения: Видео ---
        video_matches = re.finditer(r'\[Видеоразбор\]:\s*Задание\s*№?(\d+).*?\nСсылка:\s*(.*)', block_text)
        for vm in video_matches:
            variant_obj["solutions"].append({
                "task_number": int(vm.group(1)),
                "type": "video",
                "content": {
                    "provider": "rutube",
                    "url": vm.group(2).strip(),
                    "title": f"Видеоразбор задания №{vm.group(1)}"
                }
            })

        # --- Решения: Код ---
        # Регулярка для кода (захватывает текст между пунктирами)
        code_matches = re.finditer(r'\[Код решения \((.*?)\)\]:\s*\n-{10,}\n(.*?)\n-{10,}', block_text, re.DOTALL)
        
        for cm in code_matches:
            lang_raw = cm.group(1).lower()
            code_body = cm.group(2).strip()
            
            # Эвристика номера задания по содержимому кода
            task_guess = 0
            if '24.txt' in code_body or 'replace' in code_body: task_guess = 24
            elif '26.txt' in code_body: task_guess = 26
            elif '27' in code_body: task_guess = 27
            elif 'import re' in code_body: task_guess = 24 # RegExp чаще всего в 24
            
            # Если не угадали, пытаемся понять по контексту (в файле сначала идет 24, потом 26)
            # Но для безопасности оставим 0, если совсем непонятно, или 26 как fallback
            if task_guess == 0: task_guess = 26 

            variant_obj["solutions"].append({
                "task_number": task_guess,
                "type": "code",
                "content": {
                    "language": "python" if "python" in lang_raw else "text",
                    "title": f"Код решения ({cm.group(1)})",
                    "snippet": code_body
                }
            })

        # Сортировка решений
        variant_obj["solutions"].sort(key=lambda x: x["task_number"])
        
        variants_json.append(variant_obj)

    return variants_json

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Ошибка: Файл не найден: {INPUT_FILE}")
        return

    print("Парсинг v2.0...")
    variants = parse_sbornik(INPUT_FILE)
    
    final_json = {
        "meta": {
            "version": "2.0",
            "generated_at": datetime.now().isoformat(),
            "total_variants": len(variants),
            "title": "Сборник вариантов ЕГЭ (Информатика)"
        },
        "variants": variants
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_json, f, ensure_ascii=False, indent=2)
        
    print(f"Готово! Обработано вариантов: {len(variants)}")
    # Проверка на пустоту (для дебага)
    if variants and not variants[0]['solutions'] and not variants[0]['materials']['attachments']:
        print("ВНИМАНИЕ: Первый вариант пуст! Проверь входной файл.")
    else:
        print("Проверка пройдена: данные в вариантах найдены.")

if __name__ == "__main__":
    main()