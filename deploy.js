#!/usr/bin/env node
/**
 * Скрипт деплоя на сервер через PM2
 * Использование: node deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

// Конфигурация
const CONFIG = {
  host: '89.111.152.185',
  user: 'root',
  password: 'KjuuLb8H3eoN9PrX',
  remotePath: '/root/infkege',
  backupPath: '/root/infkege_backup',
  localPath: 'site/infkege',
  appName: 'infkege',
  port: 3000,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function run(cmd, options = {}) {
  const safeCmd = cmd.replace(CONFIG.password, '***');
  console.log(`\n> ${safeCmd}\n`);
  try {
    return execSync(cmd, { stdio: 'inherit', encoding: 'utf8', shell: 'powershell.exe', ...options });
  } catch (e) {
    if (!options.ignoreError) throw e;
  }
}

function sshCmd(command) {
  const escaped = command.replace(/"/g, '\\"');
  return `echo y | plink -batch -pw "${CONFIG.password}" ${CONFIG.user}@${CONFIG.host} "${escaped}"`;
}

function scpCmd(localFile, remotePath) {
  return `echo y | pscp -batch -pw "${CONFIG.password}" "${localFile}" ${CONFIG.user}@${CONFIG.host}:${remotePath}`;
}

async function checkPutty() {
  try {
    execSync('plink -V', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Деплой infkege на сервер (PM2)\n');

  const hasPutty = await checkPutty();
  if (!hasPutty) {
    console.log('⚠️  Нужен PuTTY (plink, pscp)');
    console.log('Установи: winget install PuTTY.PuTTY\n');
    rl.close();
    return;
  }

  console.log(`Сервер: ${CONFIG.user}@${CONFIG.host}`);
  console.log(`Приложение: ${CONFIG.appName}`);
  console.log(`Путь: ${CONFIG.remotePath}`);
  console.log(`Порт: ${CONFIG.port}\n`);

  const action = await ask(
    'Выбери действие:\n' +
    '1. Полный деплой (бэкап + загрузка + build + pm2 restart)\n' +
    '2. Только загрузить файлы (без build/restart)\n' +
    '3. Только build + restart\n' +
    '4. Перезапустить PM2\n' +
    '5. Посмотреть логи\n' +
    '6. Статус PM2\n' +
    '7. Остановить приложение\n' +
    '8. Откатить на бэкап\n' +
    '\nВведи номер: '
  );

  switch (action) {
    case '1': {
      await fullDeploy();
      break;
    }
    case '2': {
      await uploadFiles();
      console.log('\n✅ Файлы загружены! Запусти build вручную или выбери пункт 3.');
      break;
    }
    case '3': {
      await buildAndRestart();
      break;
    }
    case '4': {
      console.log('\n🔄 Перезапускаю PM2...');
      run(sshCmd(`pm2 restart ${CONFIG.appName}`), { ignoreError: true });
      console.log('\n✅ Перезапущен!');
      break;
    }
    case '5': {
      console.log('\n📋 Логи (последние 100 строк):');
      run(sshCmd(`pm2 logs ${CONFIG.appName} --lines 100 --nostream`), { ignoreError: true });
      break;
    }
    case '6': {
      console.log('\n📊 Статус PM2:');
      run(sshCmd('pm2 status'), { ignoreError: true });
      break;
    }
    case '7': {
      console.log('\n⏹️ Останавливаю...');
      run(sshCmd(`pm2 stop ${CONFIG.appName}`), { ignoreError: true });
      console.log('\n✅ Остановлен!');
      break;
    }
    case '8': {
      await rollback();
      break;
    }
    default:
      console.log('Неверный выбор');
  }

  rl.close();
}

async function uploadFiles() {
  // Создаём бэкап на сервере
  console.log('\n💾 Создаю бэкап на сервере...');
  run(sshCmd(`rm -rf ${CONFIG.backupPath} && cp -r ${CONFIG.remotePath} ${CONFIG.backupPath} 2>/dev/null || echo "Нет предыдущей версии"`), { ignoreError: true });

  // Создаём архив локально (исключаем node_modules, .next)
  console.log('\n📦 Создаю архив...');
  if (fs.existsSync('deploy.zip')) fs.unlinkSync('deploy.zip');
  
  run(`Get-ChildItem '${CONFIG.localPath}' -Exclude node_modules,.next | Compress-Archive -DestinationPath deploy.zip -Force`);

  // Загружаем на сервер
  console.log('\n📤 Загружаю на сервер...');
  run(scpCmd('deploy.zip', '/root/'));

  // Распаковываем
  console.log('\n📂 Распаковываю...');
  run(sshCmd(`cd /root && rm -rf ${CONFIG.remotePath}_new && mkdir -p ${CONFIG.remotePath}_new`));
  run(sshCmd(`cd ${CONFIG.remotePath}_new && unzip -o /root/deploy.zip`), { ignoreError: true });
  run(sshCmd(`cp -r ${CONFIG.remotePath}/node_modules ${CONFIG.remotePath}_new/ 2>/dev/null || true`), { ignoreError: true });
  run(sshCmd(`rm -rf ${CONFIG.remotePath} && mv ${CONFIG.remotePath}_new ${CONFIG.remotePath}`));
  run(sshCmd(`rm /root/deploy.zip`), { ignoreError: true });

  // Удаляем локальный архив
  if (fs.existsSync('deploy.zip')) fs.unlinkSync('deploy.zip');
}

async function buildAndRestart() {
  console.log('\n📦 Устанавливаю зависимости...');
  run(sshCmd(`cd ${CONFIG.remotePath} && pnpm install`));

  console.log('\n🔨 Собираю приложение...');
  run(sshCmd(`cd ${CONFIG.remotePath} && pnpm build`));

  console.log('\n🚀 Запускаю/перезапускаю PM2...');
  // Проверяем есть ли процесс, если нет - создаём
  run(sshCmd(`cd ${CONFIG.remotePath} && pm2 describe ${CONFIG.appName} > /dev/null 2>&1 && pm2 restart ${CONFIG.appName} || pm2 start pnpm --name '${CONFIG.appName}' -- start && pm2 save`), { ignoreError: true });

  console.log(`\n✅ Готово! Сайт: http://${CONFIG.host}:${CONFIG.port}`);
}

async function fullDeploy() {
  await uploadFiles();
  await buildAndRestart();
}

async function rollback() {
  console.log('\n⏪ Откатываю на бэкап...');
  run(sshCmd(`
    if [ -d "${CONFIG.backupPath}" ]; then
      rm -rf ${CONFIG.remotePath} &&
      cp -r ${CONFIG.backupPath} ${CONFIG.remotePath} &&
      cd ${CONFIG.remotePath} &&
      pm2 restart ${CONFIG.appName} &&
      echo "Откат выполнен!"
    else
      echo "Бэкап не найден!"
    fi
  `), { ignoreError: true });
}

main().catch((e) => {
  console.error('❌ Ошибка:', e.message);
  rl.close();
  process.exit(1);
});
