import React from 'react';
import ReactDOM from 'react-dom/client'; // Use createRoot
import App from './App';
import { AppRegistry } from 'react-native';

// Register the app component for react-native-web
AppRegistry.registerComponent('App', () => App);

// Find the root DOM element
const rootElement = document.getElementById('react-app-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element with ID "react-app-root"');
}
