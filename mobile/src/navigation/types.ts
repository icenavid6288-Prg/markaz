import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Tabs: undefined;
    CourseDetail: { slug: string };
    ProductDetail: { slug: string };
    Settings: undefined;
    Login: undefined;
    Register: undefined;
};

export type TabsParamList = {
    Home: undefined;
    Courses: undefined;
    Shop: undefined;
    Dashboard: undefined;
    ProfileTab: undefined;
};

export type RootStackNavigation = NativeStackNavigationProp<RootStackParamList>;
export type TabsNavigation = BottomTabNavigationProp<TabsParamList>;
export type TabStackNavigation = CompositeNavigationProp<TabsNavigation, RootStackNavigation>;
