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
Служебная страница `/viz` в прод не уезжает: её вырезает `tools/strip-dev-pages.mjs`,
подшитый в `npm run build`.
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

## Конфиг nginx

Актуальная копия лежит в репозитории: `deploy/nginx/remote-landing.conf`.
Правится там, потом уезжает на сервер:

```bash
cat deploy/nginx/remote-landing.conf | ssh -i ~/.ssh/remote_mentor_deploy \
  root@37.220.86.196 'cat > /etc/nginx/sites-available/remote-landing \
   && nginx -t && systemctl reload nginx'
```

`nginx -t` в цепочке обязателен: без него битый конфиг положит живой сайт.
Бэкапы прошлых конфигов — `/root/nginx-remote-landing-*.bak`.

Что в нём сделано и почему:

| Было | Стало |
|---|---|
| Любой битый адрес — главная с кодом **200** | честный **404** и своя страница в стиле сайта |
| gzip жал только html (умолчание nginx) | список `gzip_types`: css с 13.7 КБ ужался до **4.2 КБ** |
| HTTP/1.1 | **HTTP/2** (проверять только с сервера: локальный curl идёт через прокси и покажет 1.1) |
| www отдавал дубль сайта | **301 на апекс**, оба имени в сертификате |
| Кэш ассетов 1 час | **год + immutable** для `_astro/` (хэш в имени), сутки для картинок, `no-cache` для html |
| Заголовков безопасности не было | `X-Content-Type-Options`, `Referrer-Policy` |

**Грабля nginx:** `add_header` не наследуется, если во вложенном `location`
есть свой `add_header` — он молча сбрасывает все родительские. Поэтому
заголовки безопасности повторены в каждом блоке, а не заданы один раз
на уровне сервера. Первый заход я на это и наступил.

## Осталось

- **Диск.** После чистки apt-кэша свободно 770 МБ из 4.9 ГБ (было 195 МБ).
  Журналы systemd занимают ещё ~380 МБ — при нужде ужимаются
  `journalctl --vacuum-size=100M`.
- **HSTS** не включён намеренно: браузеры запоминают его надолго, и если
  сертификат когда-нибудь протухнет, сайт станет недоступен совсем.
  Включать осознанно, когда появится автопродление.
- **Пароль root** от сервера засветился в переписке — сменить. Доступ
  по ключу настроен и от пароля не зависит.
