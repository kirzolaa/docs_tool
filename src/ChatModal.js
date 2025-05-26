import React, { useState, useEffect, useRef } from 'react';
import MarkdownDisplay from 'react-native-markdown-display';
import {
  Modal, 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator, // For loading spinner
  Alert // For error messages
} from 'react-native';

const ChatModal = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([]); // { id: string, text: string, sender: 'user' | 'gemini' }[]
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    // For now, just add user message to local state for UI testing
    setMessages([...messages, { id: Date.now().toString(), text: inputText, sender: 'user' }]);
    setInputText('');
    const currentInputText = inputText;
    setInputText(''); // Clear input immediately
    setIsLoading(true);

    // Prepare chat history for the API
    // The history sent to API should include the new user message
    const updatedMessages = [...messages, { id: Date.now().toString(), text: currentInputText, sender: 'user' }];
    // setMessages(updatedMessages); // Optimistically update UI with user message - already done by the line above this section

    const apiChatHistory = updatedMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    try {
      // Ensure window.electron.sendChatMessage is available (will be set up in preload.js)
      if (window.electronAPI && window.electronAPI.sendChatMessage) {
        const result = await window.electronAPI.sendChatMessage({ 
          userMessage: currentInputText, 
          chatHistory: apiChatHistory.slice(0, -1) // Send history *before* current user message
        });

        if (result && result.text) {
          setMessages(prevMessages => [
            ...prevMessages, 
            { id: Date.now().toString() + '-gemini', text: result.text, sender: 'gemini' }
          ]);
        } else if (result && result.error) {
          console.error('Gemini API Error:', result.error);
          // Display error as a message in chat or use Alert
          setMessages(prevMessages => [
            ...prevMessages,
            { id: Date.now().toString() + '-error', text: `Error: ${result.error}`, sender: 'gemini', isError: true }
          ]);
          // Alert.alert('Chat Error', result.error);
        }
      } else {
        console.error('Chat function sendChatMessage not available on window.electronAPI');
        Alert.alert('Error', 'Chat functionality is not properly configured.');
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessages(prevMessages => [
        ...prevMessages,
        { id: Date.now().toString() + '-error', text: `Error: ${error.message || 'Unknown error'}`, sender: 'gemini', isError: true }
      ]);
    } finally {
      setIsLoading(false);
    }
    // console.log('User message:', currentInputText); // Original console log
  };

  const renderMessage = (message) => (
    <View 
      key={message.id} 
      style={[
        styles.messageBubble,
        message.sender === 'user' ? styles.userMessage : styles.geminiMessage
      ]}
    >
      {message.sender === 'gemini' && !message.isError ? (
        <MarkdownDisplay
          style={{
            body: { ...styles.geminiMessageText, flexShrink: 1 }, // Ensure body can shrink and apply base text style
            paragraph: { marginTop: 0, marginBottom: 0, flexShrink: 1 }, // Remove default paragraph margins and allow shrinking
            text: { ...styles.geminiMessageText, flexShrink: 1 }, // Ensure text within paragraphs also respects shrinking
            code_inline: { 
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', 
              backgroundColor: '#f0f0f0',
              paddingHorizontal: 4,
              paddingVertical: 2,
              borderRadius: 3,
              flexShrink: 1, // Allow inline code to shrink and wrap if necessary
              color: '#333' // Ensure good contrast for inline code
            },
            // Example for code_block if needed later:
            // code_block: { 
            //   backgroundColor: '#f0f0f0', 
            //   padding: 10, 
            //   borderRadius: 4, 
            //   fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', 
            //   color: '#333'
            // },
          }}
        >
          {message.text}
        </MarkdownDisplay>
      ) : (
        <Text style={[
          styles.messageText,
          message.sender === 'gemini' && !message.isError && styles.geminiMessageText, // Should be covered by MarkdownDisplay now
          message.isError && styles.errorMessageText
        ]}>
          {message.text}
        </Text>
      )}
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Chat with Gemini</Text>
              {isLoading && <ActivityIndicator size="small" color="#007bff" style={styles.loadingIndicator} />}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer} 
              contentContainerStyle={styles.messagesContentContainer}
              onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
              onLayout={() => scrollViewRef.current.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 && (
                <Text style={styles.emptyChatText}>No messages yet. Start the conversation!</Text>
              )}
              {messages.map(renderMessage)}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <Button title="Send" onPress={handleSend} disabled={isLoading} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end', // Aligns modal to the bottom
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // Shadow for modal appearing from bottom
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    height: '85%', // Take up most of the screen height
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 10,
  },
  messagesContentContainer: {
    paddingVertical: 10,
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  geminiMessage: {
    backgroundColor: '#e9e9eb',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    color: '#fff', // Default for user messages (on dark blue bubble)
  },
  geminiMessageText: {
    color: '#000', // Black text for Gemini messages (on light gray bubble)
    fontSize: 16, // Ensure consistent font size with user messages
  },
  errorMessageText: {
    color: 'red', // Red text for error messages
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  emptyChatText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120, // Allow multiline but not excessively tall
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
});

export default ChatModal;
