import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    findNodeHandle,
    FlatList,
    Keyboard,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";
import { debounce, PlaceHit, searchPlaces } from "../services/geocoding";

export type PlacePick = { lat: number; lon: number; label: string };

type Props = {
  placeholder?: string;
  onPick: (p: PlacePick) => void;
  initialText?: string;
};

type Anchor = { x: number; y: number; w: number; h: number } | null;

export default function PlaceAutocomplete({ placeholder, onPick, initialText }: Props) {
  const [text, setText] = useState(initialText ?? "");
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState<Anchor>(null);

  const wrapRef = useRef<View>(null);
  
  const measureAnchor = useCallback(() => {
    const node = findNodeHandle(wrapRef.current);
    if (!node) return;
    UIManager.measureInWindow(
      node,
      (x: number, y: number, w: number, h: number) => setAnchor({ x, y, w, h })
    );
  }, []);

  const doSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        try {
          setLoading(true);
          const r = await searchPlaces(q);
          setHits(r);
        } finally {
          setLoading(false);
        }
      }, 450),
    []
  );

  const onChangeText = useCallback(
    (v: string) => {
      setText(v);
      if (v.trim().length >= 2) {
        doSearch(v);
        measureAnchor();
        setVisible(true);
      } else {
        setHits([]);
      }
    },
    [doSearch, measureAnchor]
  );

  const onFocus = useCallback(() => {
    measureAnchor();

    if (text.trim().length >= 2) setVisible(true);
  }, [measureAnchor, text]);

  const select = useCallback(
    (h: PlaceHit) => {
      setText(h.displayName);
      setHits([]);
      setVisible(false);
      Keyboard.dismiss();
      onPick({ lat: h.lat, lon: h.lon, label: h.displayName });
    },
    [onPick]
  );

  const renderItem = ({ item }: { item: PlaceHit }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => select(item)}
      accessibilityRole="button"
    >
      <Text style={styles.itemText} numberOfLines={2}>
        {item.displayName}
      </Text>
    </TouchableOpacity>
  );

  const close = () => {
    setVisible(false);
  };


  const ddTop = (anchor?.y ?? 100) + (anchor?.h ?? 48) + 6;
  const ddLeft = (anchor?.x ?? 16);
  const ddWidth = (anchor?.w ?? 320);

  return (
    <>
      {/* Campo de busca (âncora) */}
      <View ref={wrapRef} collapsable={false} style={styles.wrap}>
        <TextInput
          placeholder={placeholder ?? "Digite um lugar (ex.: Ponta Verde, Maceió)"}
          placeholderTextColor="#9aa4b2"
          value={text}
          onChangeText={onChangeText}
          onFocus={onFocus}
          style={styles.input}
          returnKeyType="search"
        />
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        )}
      </View>

      {/* Dropdown no Modal — sem aninhar VirtualizedList no ScrollView */}
      <Modal visible={visible && hits.length > 0} transparent animationType="fade" onRequestClose={close}>
        {/* overlay clicável para fechar */}
        <Pressable style={styles.overlay} onPress={close} />

        {/* container do dropdown, posicionado por coordenadas do input */}
        <View
          pointerEvents="box-none"
          style={[styles.dropdownContainer, { top: ddTop, left: ddLeft, width: ddWidth }]}
        >
          <View style={styles.dropdown}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={hits}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", zIndex: 1 },
  input: {
    backgroundColor: "#121722",
    color: "#e6edf5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#263042",
    fontSize: 16,
  },
  loading: { position: "absolute", right: 12, top: 12 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  dropdownContainer: {
    position: "absolute",
    maxHeight: 300,
  },
  dropdown: {
    backgroundColor: "#0f141e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263042",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  item: { paddingHorizontal: 12, paddingVertical: 12 },
  itemText: { color: "#d6deea", fontSize: 15 },
});
