import { StyleSheet, Text, View } from 'react-native';

export default function MapScreenV0Placeholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mapa v0 disponible en web.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    color: '#333',
    fontSize: 16,
  },
});
