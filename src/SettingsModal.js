import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';

const SettingsModal = ({ visible, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [currentApiKeyStatus, setCurrentApiKeyStatus] = useState('Checking...');

  useEffect(() => {
    if (visible) {
      const fetchApiKey = async () => {
        try {
          if (window.electronAPI && typeof window.electronAPI.getGeminiApiKey === 'function') {
            const existingKey = await window.electronAPI.getGeminiApiKey();
            if (existingKey) {
              setApiKey(existingKey);
              setCurrentApiKeyStatus('Key is set (hidden for security)');
            } else {
              setCurrentApiKeyStatus('No API key set.');
              setApiKey(''); // Ensure input is clear if no key
            }
          } else {
            setCurrentApiKeyStatus('API access not available.');
            Alert.alert('Error', 'Cannot access API key functions.');
          }
        } catch (error) {
          console.error('SettingsModal: Error fetching API key:', error);
          setCurrentApiKeyStatus('Error fetching key.');
          Alert.alert('Error', 'Could not fetch API key.');
        }
      };
      fetchApiKey();
    }
  }, [visible]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Input Required', 'Please enter an API key or clear the existing one.');
      return;
    }
    try {
      if (window.electronAPI && typeof window.electronAPI.setGeminiApiKey === 'function') {
        const result = await window.electronAPI.setGeminiApiKey(apiKey);
        if (result && result.success) {
          setCurrentApiKeyStatus('Key is set (hidden for security)'); // Update status
          Alert.alert('Success', 'API Key saved successfully.');
          onClose(); // Close modal on successful save
        } else {
          Alert.alert('Error', `Failed to save API Key: ${result.error || 'Unknown error'}`);
        }
      } else {
        Alert.alert('Error', 'Cannot access API key functions to save.');
      }
    } catch (error) {
      console.error('SettingsModal: Error saving API key:', error);
      Alert.alert('Error', 'Could not save API key.');
    }
  };

  const handleClearKey = async () => {
    try {
      if (window.electronAPI && typeof window.electronAPI.clearGeminiApiKey === 'function') {
        const result = await window.electronAPI.clearGeminiApiKey();
        if (result && result.success) {
          Alert.alert('Success', 'API Key cleared successfully.');
          setApiKey('');
          setCurrentApiKeyStatus('No API key set.');
        } else {
          Alert.alert('Error', `Failed to clear API Key: ${result.error || 'Unknown error'}`);
        }
      } else {
        Alert.alert('Error', 'Cannot access API key functions to clear.');
      }
    } catch (error) {
      console.error('SettingsModal: Error clearing API key:', error);
      Alert.alert('Error', 'Could not clear API key.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Gemini API Key Settings</Text>
          
          <Text style={styles.statusText}>Current Status: {currentApiKeyStatus}</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your Gemini API Key"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={true} // Hide the API key input
          />
          <View style={styles.buttonContainer}>
            <Button title="Save Key" onPress={handleSave} />
            <Button title="Clear Key" onPress={handleClearKey} color="#ff6347" />
            <Button title="Cancel" onPress={onClose} color="#888" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimmed background
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%', // Modal width
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 15,
    color: '#555',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 12,
    borderRadius: 5,
    width: '100%', // Input width
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});

export default SettingsModal;
