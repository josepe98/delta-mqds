export function formatMQDs(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function formatMiles(value: number): string {
  return value.toLocaleString();
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function getMonthName(monthNum: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNum - 1] || '';
}
