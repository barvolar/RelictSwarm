function balPanelHTML(){
 const r=bal&&S?balReport():balLast;
 const t=r?.result?.seconds??r?.timeline?.at(-1)?.t??0;
 return `<div class="bal-tools"><strong>◈ АНАЛИТИКА БАЛАНСА</strong><p>${r?`Записано ${formatTime(t)} · урон боссам ${Math.round(r.totals.damageToBoss).toLocaleString('ru')} · пик врагов ${r.totals.peakEnemies} · получено ударов ${r.totals.receivedHits}`:'Пока нет данных. Запусти забег, статистика соберётся автоматически.'}</p><button type="button" class="btn primary" id="balExport" ${r?'':'disabled'}>↓ СКАЧАТЬ ОТЧЁТ БАЛАНСА</button><p class="tiny">Отчёт хранится на этом устройстве, пока не начнётся новый забег. Отчёт хранится локально. При разрешённой онлайн-аналитике анонимные данные также передаются на сервер.</p><textarea id="balReportText" hidden readonly aria-label="Отчёт баланса для копирования"></textarea></div>`;
}
