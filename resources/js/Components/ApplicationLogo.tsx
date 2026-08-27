import type { ImgHTMLAttributes } from 'react';
import BrandLogo from '@/Components/BrandLogo';

export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return <BrandLogo {...props} />;
}
