export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function normalizeTableData(data: any[]): any[] {
  return data.map(row => {
    const normalizedRow = { ...row };
    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'string') {
        normalizedRow[key] = row[key].trim();
      }
    });
    return normalizedRow;
  });
} 