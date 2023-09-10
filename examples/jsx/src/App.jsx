import React, { useEffect } from 'react';
import NavigationProvider from '@/components/NavigationProvider'
import RouteProvider from '@/components/RouteProvider'
import init from '@/plugins/registerMicroApps'

function App() {
  useEffect(() => {
    init()
  }, [])

  return (
    <NavigationProvider>
      <RouteProvider />
    </NavigationProvider>
  );
}

export default App;
