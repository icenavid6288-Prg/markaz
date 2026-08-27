export interface InstructorPayload {
    id: number;
    specialty?: string | null;
    bio?: string | null;
    experience_years?: number | null;
    user?: { name?: string | null; avatar?: string | null };
}

export interface LessonPayload {
    id: number;
    title: string;
    type: string;
    duration_minutes?: number | null;
    is_free: boolean;
    slug: string;
}

export interface ModulePayload {
    id: number;
    title: string;
    lessons: LessonPayload[];
}

export interface CoursePayload {
    id: number;
    title: string;
    subtitle?: string | null;
    slug: string;
    description?: string | null;
    thumbnail?: string | null;
    level?: string | null;
    price: number;
    discount_price?: number | null;
    duration_minutes?: number | null;
    students_count?: number;
    rating_avg?: number;
    certificate_enabled?: boolean;
    instructor?: InstructorPayload | null;
    category?: string | null;
    curriculum?: ModulePayload[];
    enrollment?: {
        id: number;
        status: string;
        progress_percent: number;
    } | null;
}

export interface ProductPayload {
    id: number;
    type: string;
    title: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    price: number;
    discount_price?: number | null;
    author?: string | null;
    pages?: number | null;
    publisher?: string | null;
    isbn?: string | null;
    preview_url?: string | null;
    is_featured?: boolean;
}

export interface UserPayload {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    bio?: string | null;
}

export interface EnrollmentPayload {
    id: number;
    status: string;
    progress_percent: number;
    enrolled_at?: string | null;
    completed_at?: string | null;
    course: CoursePayload | null;
}

export interface OrderPayload {
    id: number;
    order_number: string;
    total: number;
    status: string;
    created_at?: string | null;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

export interface HomeData {
    site: { name: string; slogan: string };
    featured_courses: CoursePayload[];
    latest_courses: CoursePayload[];
    latest_products: ProductPayload[];
}

export interface DashboardData {
    user: UserPayload;
    enrollments: EnrollmentPayload[];
    orders: OrderPayload[];
}

export interface AuthData {
    user: UserPayload;
    token: string;
}
