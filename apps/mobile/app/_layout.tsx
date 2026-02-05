import { Slot } from 'expo-router';
import { View } from 'react-native';
import tw from 'twrnc';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { socketService } from '../src/services/socket';

export default function RootLayout() {
    useEffect(() => {
        socketService.connect();
        return () => socketService.disconnect();
    }, []);

    return (
        <AuthProvider>
            <View style={tw`flex-1 bg-slate-900`}>
                <Slot />
                <StatusBar style="light" />
            </View>
        </AuthProvider>
    );
}
