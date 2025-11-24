export function extractError(err: any): string {
  if (err?.response?.data) {
    const data = err.response.data;

    if (typeof data.detail === 'string') {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail[0]?.msg || 'Ошибка';
    }

    if (typeof data.message === 'string') {
      return data.message;
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Неизвестная ошибка';
}
