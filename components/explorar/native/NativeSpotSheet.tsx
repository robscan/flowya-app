import { StyleSheet, Text, View } from "react-native";

import { NativeSheetHeader } from "@/components/explorar/native/NativeSheetHeader";
import { NativeSheetShell } from "@/components/explorar/native/NativeSheetShell";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NativeSearchSpot } from "@/lib/explore/native-spot-search";

type NativeSpotSheetProps = {
  spot: NativeSearchSpot | null;
  onClose: () => void;
};

export function NativeSpotSheet({ spot, onClose }: NativeSpotSheetProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? "light"];

  return (
    <NativeSheetShell visible={spot != null} closeLabel="Cerrar lugar" onClose={onClose}>
      {spot ? (
        <>
          <NativeSheetHeader
            title={spot.title}
            subtitle="Lugar del mapa"
            closeLabel="Cerrar lugar"
            onClose={onClose}
          />
        </>
      ) : null}
    </NativeSheetShell>
  );
}

const styles = StyleSheet.create({
});
