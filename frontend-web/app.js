import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '/LoginScreen';
import RegisterScreen from '/RegisterScreen';
import DashboardScreen from '/DashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!token ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} setToken={setToken} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="Dashboard">
            {(props) => <DashboardScreen {...props} token={token} setToken={setToken} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
