# Деплой

## Прод: https://remote-mentor.ru

Сервер `37.220.86.196`, Ubuntu 24.04, nginx 1.24. Корень сайта —
`/var/www/remote-landing`, конфиг — `/etc/nginx/sites-available/remote-landing`.

Доступ по SSH-ключу `~/.ssh/remote_mentor_deploy` (ed25519, без пароля на
ключе). Публичная часть лежит в `/root/.ssh/authorized_keys` на сервере
вторым ключом; первый — старый деплой-ключ из репозитория заказчика.

### Выкатить

```bash
npm run build
tar czf - -C dist . | ssh -i ~/.ssh/remote_mentor_deploy root@37.220.86.196 \
  'rm -rf /var/www/remote-landing && mkdir -p /var/www/remote-landing \
   && tar xzf - -C /var/www/remote-landing \
   && chown -R www-data:www-data /var/www/remote-landing'
```

`rsync` на сервере нет, поэтому заливка идёт tar-потоком через ssh.
Каталог сносится целиком: так с прода уходят файлы, которых больше нет в
сборке (от старой версии там оставались `styles.css`, `script.js`,
`linkedin-typing/` и даже `.claude/launch.json`).

### Откатиться

Бэкапы прошлых версий лежат на сервере в `/root/backup-remote-landing-*.tar.gz`.

```bash
ssh -i ~/.ssh/remote_mentor_deploy root@37.220.86.196 \
  'rm -rf /var/www/remote-landing && mkdir -p /var/www/remote-landing \
   && tar xzf /root/backup-remote-landing-2026-08-28-1406.tar.gz -C /var/www/remote-landing'
```

Тот бэкап — исходный лендинг до редизайна.

## Стенд: https://vassert32.github.io/remote-landing/

Собирается автоматически при пуше в ветку `redesign`
(`.github/workflows/pages-stage.yml`). Живёт в подпапке, поэтому сборке
передаются `DEPLOY_SITE` и `DEPLOY_BASE` — см. комментарий в
`astro.config.mjs` про ведущий слэш и Git Bash.

## Домен и адреса

`astro.config.mjs` по умолчанию собирает под `https://remote-mentor.ru`:
от этого значения считаются canonical, og:url и hreflang. Переопределяется
переменной `DEPLOY_SITE` — так стенд не ворует у прода поисковый вес.

## Что на сервере стоит починить

Не сделано, ждёт решения заказчика:

- **404 отдаёт 200.** В nginx стоит `try_files $uri $uri/ /index.html` —
  SPA-фолбэк. Любой битый адрес возвращает главную с кодом 200, поисковик
  индексирует мусор. Нужна страница `404.astro` и `try_files ... =404`
  с `error_page 404 /404.html`.
- **Кэш ассетов 1 час.** У файлов в `_astro/` хэш в имени, им можно
  `expires 1y` + `immutable`. Сейчас браузер перезапрашивает их каждый час.
- **Диск.** После чистки apt-кэша свободно 770 МБ из 4.9 ГБ (было 195 МБ).
  Журналы systemd занимают ещё ~380 МБ — при нужде ужимаются
  `journalctl --vacuum-size=100M`.
- **`/viz`** — служебный пробник визуализаций, уехал на прод вместе со
  сборкой. Ниоткуда не слинкован, но при желании убирается из сборки.
- **Пароль root** от сервера засветился в переписке — сменить.
