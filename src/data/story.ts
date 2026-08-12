export type GamePhase = "scanner" | "portal" | "travel" | "lab" | "analysis" | "final";

export type Achievement = {
  title: string;
  detail: string;
};

export type ProfileStat = {
  label: string;
  value: string;
};

export type ScannerLine = {
  text: string;
  status?: "error";
};

export type RichTextSegment = {
  text: string;
  strong?: boolean;
};

export type FinalDialogEntry = {
  speaker: "Рик" | "Морти";
  intro?: string;
  body?: RichTextSegment[];
  aside?: string;
  heading?: string;
  items?: Array<{
    icon: string;
    label: string;
    value?: string;
  }>;
  announcement?: string;
};

export type PhotoSlot = {
  id: string;
  label: string;
  positionClass: string;
  src?: string;
};

export const birthdayConfig = {
  celebrantName: "Roman Borzov",
  age: 30,
  birthDate: "14.08.1996",
  scannerButton: "Открыть портал",
  portalPrompt: "Войти в разлом",
  labTitle: "Секретная гаражная лаборатория",
  computerPrompt: "Запустить анализ",
  finalHeadlineLead: "Добро пожаловать в",
  finalHeadline: "30-й сезон жизни!",
  finalGreeting: "С днем рождения!"
};

export const scannerLines: ScannerLine[] = [
  { text: "Подключение к мультивселенной..." },
  { text: "Поиск игрока..." },
  { text: "Ошибка: найден Джерри.", status: "error" },
  { text: "Ошибка исправлена." },
  { text: "Загрузка сохранения..." },
  { text: "Проверка достижений..." },
  { text: "Сканирование уровня..." },
  { text: "Обнаружен редкий экземпляр." },
  { text: "Подтверждён 30 Level." },
  { text: "Отчёт готов." }
];

export const profileStats: ProfileStat[] = [
  { label: "Имя", value: birthdayConfig.celebrantName },
  { label: "Возраст", value: `${birthdayConfig.age}` },
  { label: "Дата рождения", value: birthdayConfig.birthDate },
  { label: "Статус", value: "30 уровень жизни успешно достигнут" },
  { label: "Уровень", value: "легендарный взрослый режим" },
  { label: "Редкость экземпляра", value: "0.00030% - Легендарный (Mythic)" },
  { label: "Совместимость", value: "99.9% с хаосом, юмором и приключениями" }
];

export const decorativePhotos: PhotoSlot[] = [
  { id: "memory-01", label: "Memory 01", positionClass: "photo-wall-a", src: "/assets/memories/memory-01.png" },
  { id: "memory-02", label: "Memory 02", positionClass: "photo-wall-b", src: "/assets/memories/memory-02.png" },
  { id: "memory-03", label: "Memory 03", positionClass: "photo-wall-c", src: "/assets/memories/memory-03.png" },
  { id: "memory-04", label: "Memory 04", positionClass: "photo-wall-d", src: "/assets/memories/memory-04.png" },
  { id: "memory-05", label: "Memory 05", positionClass: "photo-door-a", src: "/assets/memories/memory-05.png" },
  { id: "memory-06", label: "Memory 06", positionClass: "photo-door-b", src: "/assets/memories/memory-06.png" },
  { id: "memory-07", label: "Memory 07", positionClass: "photo-side-a", src: "/assets/memories/memory-07.png" },
  { id: "memory-08", label: "Memory 08", positionClass: "photo-side-b", src: "/assets/memories/memory-08.png" }
];

export const achievements: Achievement[] = [
  {
    title: "🎉 Разблокирован 30-й сезон",
    detail: "Поздравляем! Новый контент успешно загружен."
  },
  {
    title: "💀 Выжил после двадцатых",
    detail: "Это редкое достижение. Даже лаборатория удивлена."
  },
  {
    title: "😎 Харизма MAX LVL",
    detail: "Пассивный бонус: до уровня блек гей)"
  },
  {
    title: "🎯 Сарказм прокачан",
    detail: "Критический урон по скучным разговорам."
  },
  {
    title: "☕️ Режим \"Взрослый\"",
    detail: "Разблокированы счета, кофе и неожиданные расходы."
  },
  {
    title: "🌌 Исследователь мультивселенной",
    detail: "Находит приключения даже без активного квеста."
  },
  {
    title: "⭐️ Главный герой",
    detail: "Камера всегда следует именно за ним. Остальные — NPC."
  }
];

export const labReadouts = [
  "portal residue: 87%",
  "life season: 30",
  "sarcasm core: overclocked",
  "stability: questionable",
  "birthday anomaly: confirmed"
];

export const finalDialog: FinalDialogEntry[] = [
  {
    speaker: "Рик",
    intro: "Брр... Сканирование завершено.",
    body: [
      { text: "Экземпляр успешно пережил " },
      { text: "29 сезонов", strong: true },
      { text: ", не уничтожил мультивселенную и каким-то чудом сохранил чувство юмора." }
    ]
  },
  {
    speaker: "Морти",
    body: [{ text: "То есть тревогу отменяем?" }],
    aside: "Мне уже почти понравилось паниковать..."
  },
  {
    speaker: "Рик",
    heading: "Диагностика завершена",
    items: [
      { icon: "✔", label: "Харизма", value: "MAX" },
      { icon: "✔", label: "Сарказм", value: "MAX" },
      { icon: "✔", label: "Удача", value: "нестабильна" },
      { icon: "✔", label: "Новый сезон", value: "разблокирован" }
    ]
  },
  {
    speaker: "Морти",
    body: [{ text: "Значит..." }],
    announcement: "🎉 LEVEL UP!"
  },
  {
    speaker: "Рик",
    heading: "Желаем в новом сезоне:",
    items: [
      { icon: "💰", label: "Легендарного лута" },
      { icon: "❤️", label: "Полную шкалу здоровья" },
      { icon: "🤝", label: "Верных союзников" },
      { icon: "🎮", label: "Эпических квестов" },
      { icon: "✨", label: "И минимум багов в реальной жизни." }
    ]
  }
];
