import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { celebrate } from '@/lib/celebrate';
import type { PageProps } from '@/types';

/**
 * کانفتی جشن: هر زمان پیام موفقیت (flash.success) از سرور برسد — مثلاً
 * بعد از ارسال فرم مشاوره، رزرو جلسه یا ثبت‌نام — جشن گرفته می‌شود.
 */
export default function CelebrateFlash() {
    const { flash } = usePage<PageProps>().props;
    const lastMessage = useRef<string | null>(null);

    useEffect(() => {
        if (flash?.success) {
            if (flash.success !== lastMessage.current) {
                lastMessage.current = flash.success;
                celebrate();
            }
        } else {
            lastMessage.current = null;
        }
    }, [flash?.success]);

    return null;
}
