import { Text, View } from 'react-native';
import tw from 'twrnc';

export default function Index() {
    return (
        <View style={tw`flex-1 items-center justify-center`}>
            <Text style={tw`text-white text-4xl font-bold`}>Brea</Text>
            <Text style={tw`text-slate-400 text-lg mt-2`}>AI Dating Liaison</Text>
        </View>
    );
}
