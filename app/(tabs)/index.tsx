import { StyleSheet, Text, View } from 'react-native';

export default function MapScreenPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map available on web.</Text>
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
