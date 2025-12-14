import os
import sys

# --- НАСТРОЙКИ ---
OUTPUT_FILE = "_PROJECT_FULL_CONTEXT.txt"
SCRIPT_NAME = os.path.basename(__file__)
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. ПАПКИ, которые мы пропускаем целиком
IGNORE_DIRS = {
    '.git', '__pycache__', 'node_modules', 'venv', 
    '.idea', '.vscode', 'dist', 'build', 
    '.next', 'coverage', '.vercel', '.swf'
}

# 2. КОНКРЕТНЫЕ ФАЙЛЫ, которые мы пропускаем
IGNORE_FILES = {
    OUTPUT_FILE, SCRIPT_NAME, 
    '.DS_Store', 'Thumbs.db',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', # <-- ГЛАВНЫЕ ВРАГИ
    '.npmrc', '.env', '.env.local'
}

# 3. РАСШИРЕНИЯ ФАЙЛОВ, которые мы пропускаем (картинки, шрифты, бинарники)
IGNORE_EXTENSIONS = {
    # Картинки и иконки (жрут много токенов, смысла для кода нет)
    '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.avif',
    # Шрифты
    '.ttf', '.woff', '.woff2', '.eot', '.otf',
    # Видео/Аудио
    '.mp4', '.mp3', '.wav', '.mov',
    # Бинарники и архивы
    '.exe', '.dll', '.so', '.dylib', '.zip', '.tar', '.gz', '.7z', '.rar',
    # Базы данных и логи
    '.db', '.sqlite', '.log',
    # PDF и документы
    '.pdf', '.doc', '.docx'
}

def should_ignore(name):
    """Проверяет, нужно ли игнорировать файл/папку по имени или расширению"""
    # Проверка по точному имени
    if name in IGNORE_FILES or name in IGNORE_DIRS:
        return True
    # Проверка по расширению
    _, ext = os.path.splitext(name)
    if ext.lower() in IGNORE_EXTENSIONS:
        return True
    return False

def generate_tree(dir_path, prefix=""):
    tree_str = ""
    try:
        items = os.listdir(dir_path)
        # Сортируем: папки сверху, потом файлы. Фильтруем игнорируемые.
        filtered_items = sorted(
            [i for i in items if not should_ignore(i)],
            key=lambda x: (not os.path.isdir(os.path.join(dir_path, x)), x.lower())
        )
        
        pointers = [("├── " if i < len(filtered_items) - 1 else "└── ") for i in range(len(filtered_items))]

        for pointer, item in zip(pointers, filtered_items):
            path = os.path.join(dir_path, item)
            tree_str += f"{prefix}{pointer}{item}\n"
            
            if os.path.isdir(path):
                extension = "│   " if pointer == "├── " else "    "
                tree_str += generate_tree(path, prefix=prefix + extension)
    except PermissionError:
        pass
    return tree_str

def collect_files_content(root_dir):
    content_output = ""
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Фильтруем папки "на лету", чтобы os.walk не заходил внутрь игнорируемых
        dirnames[:] = [d for d in dirnames if not should_ignore(d)]
        
        for filename in filenames:
            if should_ignore(filename):
                continue
            
            file_path = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(file_path, root_dir)
            
            # Определяем язык для markdown подсветки
            ext = os.path.splitext(filename)[1].replace('.', '')
            if not ext: ext = "text"
            
            # Формируем блок
            content_output += "\n" + "="*50 + "\n"
            content_output += f"FILE PATH: {rel_path}\n"
            content_output += "="*50 + "\n"
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Если файл пустой или слишком огромный (на всякий случай)
                    if not content.strip():
                        content_output += "[EMPTY FILE]\n"
                    else:
                        content_output += f"```{ext}\n{content}\n```\n"
            except (UnicodeDecodeError, PermissionError):
                content_output += f"[BINARY OR NON-UTF8 FILE SKIPPED]\n"
            except Exception as e:
                content_output += f"[ERROR READING FILE: {e}]\n"

    return content_output

def main():
    print(f"РАБОТАЕМ В ПАПКЕ: {ROOT_DIR}")
    
    if "system32" in ROOT_DIR.lower():
        print("ОШИБКА: Скрипт запущен в системной папке. Перемести его в корень проекта.")
        return

    tree = "# PROJECT STRUCTURE\n\n```\n.\n" + generate_tree(ROOT_DIR) + "```\n\n"
    content = "# FILE CONTENTS\n" + collect_files_content(ROOT_DIR)
    
    output_path = os.path.join(ROOT_DIR, OUTPUT_FILE)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(tree + content)
        
    print(f"ГОТОВО! Файл сохранен: {OUTPUT_FILE}")
    print("Теперь он чистый: без lock-файлов, картинок и node_modules.")

if __name__ == "__main__":
    main()