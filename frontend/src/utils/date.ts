export const formatDate = (iso: string) => new Intl.DateTimeFormat('ru-RU').format(new Date(iso));
