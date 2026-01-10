import React, { useEffect, useState } from 'react';
import { Button, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getDb } from '../db/schema';

export default function InspectorScreen() {
  const [query, setQuery] = useState('SELECT * FROM markets');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const db = await getDb();
      const result = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      setTables(result.map(r => r.name));
    } catch (e: any) {
      console.error(e);
    }
  };

  const runQuery = async () => {
    setError(null);
    setResults([]);
    try {
      const db = await getDb();
      // Simple heuristic: if it starts with SELECT, use getAllAsync, else runAsync
      const trimmed = query.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
          const res = await db.getAllAsync(query);
          setResults(res);
      } else {
          const res = await db.runAsync(query);
          setResults([{ changes: res.changes, lastInsertRowId: res.lastInsertRowId }]);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>DB Inspector</Text>

      <View style={styles.tableList}>
          <Text style={styles.subHeader}>Tables:</Text>
          <ScrollView horizontal style={styles.badgeContainer}>
              {tables.map(t => (
                  <Text key={t} onPress={() => setQuery(`SELECT * FROM ${t} LIMIT 10`)} style={styles.badge}>{t}</Text>
              ))}
          </ScrollView>
      </View>

      <TextInput
        style={styles.input}
        multiline
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />
      <Button title="Run SQL" onPress={runQuery} />

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(_, i) => i.toString()}
        ListEmptyComponent={<Text style={styles.empty}>No results</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.json}>{JSON.stringify(item, null, 2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeader: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  tableList: {
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center'
  },
  badgeContainer: {
      flexGrow: 0,
  },
  badge: {
      backgroundColor: '#eee',
      padding: 5,
      borderRadius: 5,
      marginRight: 5,
      borderWidth: 1,
      borderColor: '#ddd'
  },
  input: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    fontFamily: 'Courier',
    fontSize: 14,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
  empty: {
    marginTop: 20,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center'
  },
  row: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  json: {
      fontFamily: 'Courier',
      fontSize: 12
  }
});
