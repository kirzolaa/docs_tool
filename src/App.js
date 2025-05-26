import React, { useState } from 'react';
import SettingsModal from './SettingsModal'; // Import the modal
import ChatModal from './ChatModal'; // Import the Chat modal
import { View, Text, TextInput, Button, StyleSheet, FlatList, SafeAreaView, Platform, TouchableOpacity } from 'react-native';

const App = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results

    try {
      console.log(`App.js: Calling window.electronAPI.search with query: "${query}"`);
      // Check if the electronAPI is available (it should be in Electron environment)
      if (window.electronAPI && typeof window.electronAPI.search === 'function') {
        const searchResults = await window.electronAPI.search(query);
        console.log('App.js: Received results:', searchResults);

        if (searchResults && searchResults.error) {
          setError(`Search Error: ${searchResults.details || searchResults.error}`);
          setResults([]);
        } else if (Array.isArray(searchResults)) {
          setResults(searchResults);
        } else {
          setError('Received unexpected search result format.');
          setResults([]);
        }
      } else {
        console.error('electronAPI or electronAPI.search is not available on window object.');
        setError('Search functionality is not available. Are you running in Electron?');
      }
    } catch (e) {
      console.error('App.js: Error during search:', e);
      setError(`An unexpected error occurred: ${e.message}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isHtml = item.fileName && (item.fileName.toLowerCase().endsWith('.html') || item.fileName.toLowerCase().endsWith('.htm'));

    if (isHtml) {
      return (
        <TouchableOpacity 
          onPress={() => {
            if (window.electronAPI && typeof window.electronAPI.openExternalPath === 'function') {
              console.log(`App.js: Requesting to open HTML file: ${item.path}`);
              window.electronAPI.openExternalPath(item.path);
            } else {
              setError(`Cannot open ${item.path}: API not available for external path.`);
            }
          }}
          style={styles.item}
        >
          <Text style={[styles.itemText, styles.htmlLink]}>{item.fileName} (Click to open)</Text>
          <Text style={styles.itemPathText}>{item.relativePath}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        onPress={() => {
          if (window.electronAPI && typeof window.electronAPI.openExternalPath === 'function') {
            window.electronAPI.openExternalPath(item.path);
          } else {
            setError(`Cannot open ${item.path}: API not available for external path.`);
          }
        }}
      >
        <View style={styles.item}>
          <Text style={styles.itemText}>{item.fileName}</Text>
          <Text style={styles.itemPathText}>{item.relativePath}</Text>
          {/* Indicate file type or if it's clickable, if desired */}
          <Text style={styles.clickableHintText}>(Click to open)</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.titleHeader}>
          <Text style={styles.title}>Document Search</Text>
          <TouchableOpacity onPress={() => setIsSettingsModalVisible(true)} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter search term..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch} // Allows searching by pressing Enter/Return
        />
        <Button title={isLoading ? "Searching..." : "Search"} onPress={handleSearch} disabled={isLoading} />
      </View>

      <View style={styles.guidesSection}>
        <Button 
          title="Open PDF Guide"
          onPress={() => {
            if (window.electronAPI && typeof window.electronAPI.openExternalPath === 'function') {
              window.electronAPI.openExternalPath('../doc/guide/guide.pdf');
            } else {
              setError('Cannot open PDF guide: API not available.');
            }
          }}
        />
        <Button 
          title="Open HTML Docs"
          onPress={() => {
            if (window.electronAPI && typeof window.electronAPI.openExternalPath === 'function') {
              window.electronAPI.openExternalPath('../doc/index.html');
            } else {
              setError('Cannot open HTML docs: API not available for external path.');
            }
          }}
        />
      </View>

      <View style={styles.chatButtonContainer}>
        <Button 
          title="Chat with Gemini"
          onPress={() => setIsChatModalVisible(true)}
          // Add disabled logic later if API key not set
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading && !results.length && !error && <Text style={styles.loadingText}>Loading results...</Text>}
      
      {!isLoading && !results.length && !error && query && (
         <Text style={styles.infoText}>No results found for "{query}".</Text>
      )}

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.path + index} // Ensure unique keys
        style={styles.list}
      />

      <SettingsModal 
        visible={isSettingsModalVisible} 
        onClose={() => setIsSettingsModalVisible(false)} 
      />

      <ChatModal 
        visible={isChatModalVisible} 
        onClose={() => setIsChatModalVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 20 : 10, // More padding for web view
    backgroundColor: '#f4f4f8',
  },
  searchSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android shadow
  },
  guidesSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    // marginBottom: 15, // Moved to titleHeader
    color: '#333',
    flex: 1, // Allow title to take available space if settings icon is large
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15, // Matches original title marginBottom
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24, // Adjust size as needed
    color: '#333',
  },
  chatButtonContainer: {
    marginVertical: 15,
    alignItems: 'center', // Center the button
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  itemPathText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  errorContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#ffdddd',
    borderColor: '#ffaaaa',
    borderWidth: 1,
    borderRadius: 5,
  },
  errorText: {
    color: '#d8000c',
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  htmlLink: {
    color: '#007bff', // A typical link color
    textDecorationLine: 'underline',
  }
  // Consider adding specific styles for the guide buttons if needed, 
  // e.g., styles.guideButton, styles.guideButtonText
});

export default App;
