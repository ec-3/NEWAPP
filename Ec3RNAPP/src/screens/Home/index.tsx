import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BottomTabBarButtonProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StakingScreen from './Staking/StakingScreen';

import { Image, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Aperture, Database, Globe, Rocket, User, Wallet } from 'phosphor-react-native';
import { CryptoScreen } from 'screens/Home/Crypto';
import { FontMedium } from 'styles/sharedStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_BAR_HEIGHT, deviceWidth } from 'constants/index';
import { ColorMap } from 'styles/color';
import useCheckEmptyAccounts from 'hooks/useCheckEmptyAccounts';
import { FirstScreen } from 'screens/Home/FirstScreen';
import { CrowdloansScreen } from 'screens/Home/Crowdloans';
import { BrowserScreen } from 'screens/Home/Browser';
import { HomeStackParamList } from 'routes/home';
import NFTStackScreen from 'screens/Home/NFT/NFTStackScreen';
import withPageWrapper from 'components/pageWrapper';
import RequestCreateMasterPasswordModal from 'screens/MasterPassword/RequestCreateMasterPasswordModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'stores/index';
import { ActivityIndicator } from 'components/design-system-ui';
import { useSubWalletTheme } from 'hooks/useSubWalletTheme';
import useAppLock from 'hooks/useAppLock';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { WrapperParamList } from 'routes/wrapper';
import { Settings } from 'screens/Settings';
import i18n from 'utils/i18n/i18n';
import { RootStackParamList } from 'routes/index';
import { handleDeeplinkOnFirstOpen } from 'utils/deeplink';
import urlParse from 'url-parse';
import { getProtocol } from 'utils/browser';
import { updateIsDeepLinkConnect } from 'stores/base/Settings';
import queryString from 'querystring';
import { connectWalletConnect } from 'utils/walletConnect';
import { useToast } from 'react-native-toast-notifications';
import { TabBar } from 'react-native-tab-view';

interface tabbarIconColor {
  color: string;
}
const tokenTabbarIcon = ({ color }: tabbarIconColor) => {
  return <Wallet size={24} color={color} weight={'fill'} />;
//   return  <Image 
//   source={ require('./assets/CurrencyDollarSimple.png')}
//   style={{height:60,width:60,resizeMode:'center'}} >
// </Image>;
};
const nftTabbarIcon = ({ color }: tabbarIconColor) => {
  return <Aperture size={24} color={color} weight={'fill'} />;
  // return  <Image 
  //   source={ require('./assets/secondTabImg.png')}
  //   style={{height:60,width:60,resizeMode:'center'}} >
  // </Image>;
};
const crowdloanTabbarIcon = ({ color }: tabbarIconColor) => {
  return <Rocket size={24} color={color} weight={'fill'} />;
  // return  <Image 
  //   source={ require('./assets/mdi_access-point-network.png')}
  //   style={{height:60,width:60,resizeMode:'center'}} >
  // </Image>;
};
const stakingTabbarIcon = ({ color }: tabbarIconColor) => {
  return <Database size={24} color={color} weight={'fill'} />;
};
const browserTabbarIcon = ({ color }: tabbarIconColor) => {
  return <Globe size={24} color={color} weight={'fill'} />;
};
const getSettingsContent = (props: DrawerContentComponentProps) => {
  return <Settings {...props} />;
};
const MainScreen = () => {
  const Tab = createBottomTabNavigator<HomeStackParamList>();
  const insets = useSafeAreaInsets();
  const theme = useSubWalletTheme().swThemes;
  const tabbarButtonStyle = (props: BottomTabBarButtonProps) => {
    let customStyle = {
      flexDirection: 'column',
      // opacity: !props.accessibilityState?.selected ? 0.2 : 1,
    };
    if (props.accessibilityState?.selected) {
      customStyle = {
        ...customStyle,
        // @ts-ignore
        borderTopWidth: 2,
        borderTopColor: 'transparent',
        marginTop: -2,
      };
    }
    // @ts-ignore
    props.style = [[...props.style], customStyle];
    return <TouchableOpacity {...props} activeOpacity={1} />;
  };

  return (
    <Tab.Navigator
      initialRouteName={'Tokens'}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel:false,
        tabBarButton: tabbarButtonStyle,
        tabBarIconStyle: {
          // marginTop: 10,
          height:100,
          width:100,
          // backgroundColor:'yellow',
          // marginBottom: 10,

        },
        // tabBarLabelStyle: {
        //   paddingTop: 2,
        //   paddingBottom: insets.bottom ? insets.bottom - 12 : 8,
        //   fontSize: 10,
        //   lineHeight: 18,
        //   ...FontMedium,
        //   backgroundColor:'blue'
        // },
        tabBarStyle: {
          paddingTop: 0,
          paddingBottom: 16,
          backgroundColor: theme.colorBgSecondary,
          borderTopWidth: 1,
          paddingLeft: 16,
          paddingRight: 16,
          borderTopColor: theme.colorBgBorder,
          height: BOTTOM_BAR_HEIGHT + (insets.bottom ? insets.bottom - 15 : insets.bottom),
        },
        tabBarActiveTintColor: ColorMap.light,
        tabBarInactiveTintColor: '#777777',
      }}>
      <Tab.Screen
        name={'Tokens'}
        component={CryptoScreen}
        options={{
          tabBarLabel: i18n.tabName.tokens,
          tabBarIcon: tokenTabbarIcon,
        }}
      />
      
       <Tab.Screen
        name={'NFTs'}
        component={NFTStackScreen}
        options={{
          // tabBarLabel: i18n.tabName.nfts,
          tabBarLabel: "Device Info",
          tabBarHideOnKeyboard: Platform.OS === 'android',
          tabBarIcon: nftTabbarIcon,
        }}
      />
      <Tab.Screen
        name={'Crowdloans'}
        component={CrowdloansScreen}
        // component={withPageWrapper(CrowdloansScreen, ['crowdloan', 'price', 'chainStore', 'logoMaps'])}
        options={{
          tabBarLabel: "Bluetooth",
          tabBarHideOnKeyboard: Platform.OS === 'android',
          tabBarIcon: crowdloanTabbarIcon,
        }}
      />
      {/* <Tab.Screen
        name={'Staking'}
        component={StakingScreen}
        options={{
          tabBarLabel: i18n.tabName.staking,
          tabBarHideOnKeyboard: Platform.OS === 'android',
          tabBarIcon: stakingTabbarIcon,可以获得设备对应的激励了	85067f20	henry <773542531@qq.com>	2024年3月1日 12:46
          
        }}
      /> */}
      {/* <Tab.Screen
        name={'Browser'}
        component={BrowserScreen}
        options={{
          tabBarLabel: i18n.tabName.browser,
          tabBarIcon: browserTabbarIcon,
        }}
      /> */}
    </Tab.Navigator>
  );
};

const Wrapper = () => {
  const isEmptyAccounts = useCheckEmptyAccounts();
  const Drawer = createDrawerNavigator<WrapperParamList>();
  return (
    <Drawer.Navigator
      drawerContent={getSettingsContent}
      screenOptions={{
        drawerStyle: {
          width: deviceWidth,
        },
        drawerType: 'front',
        swipeEnabled: false,
      }}>
      {isEmptyAccounts && <Drawer.Screen name="FirstScreen" component={FirstScreen} options={{ headerShown: false }} />}
      <Drawer.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
    </Drawer.Navigator>
  );
};
interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}
export const Home = ({ navigation }: Props) => {
  const isEmptyAccounts = useCheckEmptyAccounts();
  const { hasMasterPassword, isReady } = useSelector((state: RootState) => state.accountState);
  const { isLocked } = useAppLock();
  const [isLoading, setLoading] = useState(true);
  const isFirstOpen = useRef(true);
  const toast = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isReady && isLoading) {
      setTimeout(() => setLoading(false), 500);
    }
  }, [isReady, isLoading]);

  useEffect(() => {
    if (isReady && !isLoading) {
      handleDeeplinkOnFirstOpen(navigation);
      isFirstOpen.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isLoading]);



  useEffect(() => {
    if (isReady && !isLoading) {
      if (isFirstOpen.current) {
        return;
      }
      Linking.addEventListener('url', ({ url }) => {
        const urlParsed = new urlParse(url);
        if (getProtocol(url) === 'subwallet') {
          if (urlParsed.hostname === 'wc') {
            dispatch(updateIsDeepLinkConnect(true));
            if (urlParsed.query.startsWith('?requestId')) {
              return;
            }
            const decodedWcUrl = queryString.decode(urlParsed.query.slice(5));
            const finalWcUrl = Object.keys(decodedWcUrl)[0];
            connectWalletConnect(finalWcUrl, toast);
          }
        } else if (getProtocol(url) === 'https') {
          if (urlParsed.pathname.split('/')[1] === 'wc') {
            dispatch(updateIsDeepLinkConnect(true));
            if (urlParsed.query.startsWith('?requestId')) {
              return;
            }
            const decodedWcUrl = queryString.decode(urlParsed.query.slice(5));
            const finalWcUrl = Object.keys(decodedWcUrl)[0];
            connectWalletConnect(finalWcUrl, toast);
          }
        }
      });
      // return () => Linking.removeAllListeners('url');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.indicatorWrapper}>
        <ActivityIndicator indicatorColor="white" size={30} />
      </View>
    );
  }

  return (
    <>
      <Wrapper />
      {!isLocked && <RequestCreateMasterPasswordModal visible={false} />}
    </>
  );
};

const styles = StyleSheet.create({
  indicatorWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
