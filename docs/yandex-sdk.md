# Яндекс Игры: тестовая SDK-сборка

В репозитории одна игровая логика, но две сборки:

- `dist/index.html`: обычная игра для GitHub Pages, без загрузки SDK Яндекса.
- `dist/yandex/index.html`: версия для загрузки **архивом** в Консоль Яндекс Игр. Содержимое папки `dist/yandex` кладётся **в корень ZIP**, не в дополнительную подпапку.

## Где взять ZIP

При push в `develop` GitHub Actions выполняет `npm test`, затем публикует артефакт **RelictSwarm-Yandex-test** (внутри `RelictSwarm-Yandex-test.zip`). Скачать в Actions → Build and verify modular game → последний успешный запуск → Artifacts. Для локальной сборки:

```bash
npm test
cd dist/yandex
zip -r ../../RelictSwarm-Yandex-test.zip .
```

## Что подключено

- Официальный `<script src="/sdk.js"></script>` **до** `YaGames.init()`, только в Yandex-сборке.
- `ysdk.features.LoadingAPI.ready()` после построения интерактивного меню.
- `ysdk.features.GameplayAPI.start()/stop()` согласно режиму игры и видимости вкладки.
- `game_api_pause/game_api_resume`: останавливают игру и приостанавливают Web Audio; автопауза снимается только если её вызвала платформа.
- Язык читается при старте из `ysdk.environment.i18n.lang`. Сейчас игровой интерфейс переведён только на русский, он остаётся резервным языком.

## Что пока не подключено

- Rewarded video за переброс карточек (следующий этап).
- Полноэкранная реклама между забегами.
- Облачные сохранения пользователя и другие платформенные возможности.

**Не добавляйте сюда скачанный `sdk.js` и не заменяйте относительный путь внешней ссылкой.**

## Как проверить

1. Создать черновик игры в [Консоли Яндекс Игр](https://games.yandex.ru/console).
2. Загрузить ZIP из артефакта, проверить что в его корне есть `index.html`, `telemetry-client.js`, `telemetry-config.js`.
3. Открыть черновик с debug-панелью (`?debug-mode=16`). Индикатор Game Ready должен позеленеть после появления интерактивного меню.
4. Начать забег, открыть улучшения, поставить паузу, открыть и закрыть рекламное/системное окно, вернуться в игру; проверить Gameplay start/stop и отключение звука.
5. Протестировать на ПК и телефоне. Не путать успешно пройденные unit-тесты с фактической проверкой SDK в черновике.

Официальные руководства:
- https://yandex.ru/dev/games/doc/ru/sdk/sdk-about
- https://yandex.ru/dev/games/doc/ru/sdk/sdk-game-events
- https://yandex.ru/dev/games/doc/ru/sdk/sdk-events
- https://yandex.ru/dev/games/doc/ru/sdk/sdk-adv
