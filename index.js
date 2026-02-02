import { AppRegistry, Platform } from 'react-native';
import App from './App';

const appName = 'LinkBank'; // Matching app.json "name"

if (Platform.OS === 'web') {
  require('./global.css');
}

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'web') {
  AppRegistry.runApplication(appName, {
    initialProps: {},
    rootTag: document.getElementById('root'),
  });
}
