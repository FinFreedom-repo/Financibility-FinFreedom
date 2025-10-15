import React, { useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import MobileDebtPlanning from './MobileDebtPlanning';

interface ResponsiveDebtPlanningProps {
  onNavigate?: (screen: string) => void;
}

const ResponsiveDebtPlanning: React.FC<ResponsiveDebtPlanningProps> = ({ onNavigate }) => {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // For mobile-first approach, always render the mobile component
  // In a real implementation, you might want to conditionally render
  // different components based on screen size
  const isMobile = screenData.width < 768;

  return (
    <View style={{ flex: 1 }}>
      <MobileDebtPlanning onNavigate={onNavigate} />
    </View>
  );
};

export default ResponsiveDebtPlanning;









