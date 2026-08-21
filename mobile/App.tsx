import React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Loading } from './src/components';
import { colors } from './src/theme';
import type { RootStackNavigation, RootStackParamList } from './src/navigation/types';

import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CoursesScreen } from './src/screens/CoursesScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { CourseDetailScreen } from './src/screens/CourseDetailScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';

// Prepare the app for right-to-left Persian layout.
I18nManager.allowRTL(true);

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function LoginRoute() {
    const navigation = useNavigation<RootStackNavigation>();
    return <LoginScreen onGoRegister={() => navigation.navigate('Register')} />;
}

function RegisterRoute() {
    const navigation = useNavigation<RootStackNavigation>();
    return <RegisterScreen onGoLogin={() => navigation.goBack()} />;
}

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.muted,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'خانه',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Courses"
                component={CoursesScreen}
                options={{
                    title: 'دورهها',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'school' : 'school-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Shop"
                component={ShopScreen}
                options={{
                    title: 'فروشگاه',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: 'پنل من',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: 'پروفایل',
                    tabBarIcon: ({ color, size, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

function RootNavigator() {
    const { token, loading } = useAuth();

    if (loading) {
        return <Loading label="در حال آمادهسازی…" />;
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text, fontWeight: '700' },
                headerTintColor: colors.primary,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.bg },
            }}
        >
            {token ? (
                <>
                    <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
                    <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'دوره' }} />
                    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'محصول' }} />
                    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'تنظیمات' }} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Login" component={LoginRoute} options={{ headerShown: false }} />
                    <Stack.Screen name="Register" component={RegisterRoute} options={{ headerShown: false }} />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <View style={styles.root}>
            <SafeAreaProvider>
                <AuthProvider>
                    <NavigationContainer>
                        <StatusBar style="dark" />
                        <RootNavigator />
                    </NavigationContainer>
                </AuthProvider>
            </SafeAreaProvider>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.bg,
        // Force right-to-left layout for the Persian interface.
        direction: 'rtl',
    },
    tabBar: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        height: 64,
        paddingBottom: 8,
        paddingTop: 6,
    },
    tabLabel: { fontSize: 11, fontWeight: '600' },
});
