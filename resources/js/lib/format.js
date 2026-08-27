const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
export function toFa(input) {
    return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}
export function toEn(input) {
    return String(input)
        .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
export function formatNumber(input) {
    return toFa(Number(toEn(input)).toLocaleString('en-US'));
}
export function formatPrice(amount) {
    if (amount === null || amount === undefined || amount === 0) {
        return 'رایگان';
    }
    return `${formatNumber(amount)} تومان`;
}
export function formatDuration(minutes) {
    if (!minutes)
        return '—';
    if (minutes < 60)
        return `${formatNumber(minutes)} دقیقه`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${formatNumber(h)} ساعت و ${formatNumber(m)} دقیقه` : `${formatNumber(h)} ساعت`;
}
export function formatDate(date) {
    if (!date)
        return '—';
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}
export function truncate(text, length = 120) {
    if (text.length <= length)
        return text;
    return `${text.slice(0, length).trim()}…`;
}
