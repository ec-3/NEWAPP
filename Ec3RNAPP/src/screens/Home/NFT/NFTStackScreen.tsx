import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import NftCollectionList from 'screens/Home/NFT/Collection/NftCollectionList';
import NftItemList from 'screens/Home/NFT/Item/NftItemList';
import NftDetail from 'screens/Home/NFT/Detail/NftDetail';
import { RootNavigationProps, RootStackParamList } from 'routes/index';
import { EmptyList } from 'components/EmptyList';
// import { Image } from 'phosphor-react-native';
import withPageWrapper from 'components/pageWrapper';
import i18n from 'utils/i18n/i18n';
import { downloadData, showReward, getReward, mining } from 'messaging/index';
import { Text, View } from 'react-native-animatable';
import { ActivityIndicator, Image, Button, TouchableOpacity,Dimensions,  Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ToggleItem } from 'components/ToggleItem';
import { SubScreenContainer } from 'components/SubScreenContainer';
import { useSubWalletTheme } from 'hooks/useSubWalletTheme';
import { dev } from '@polkadot/types/interfaces/definitions';
import { mmkvStore } from 'utils/storage';
import { BLE_DEVICE_DID_ADDR_KEY, BLE_DEVICE_INIT_TIME_KEY, DEVICE_DATA_PREFIX } from 'constants/index';

export type NFTStackParamList = {
  CollectionList: undefined;
  Collection: { collectionId: string };
  NftDetail: { collectionId: string; nftId: string };
};
export type NavigationProps = NativeStackScreenProps<NFTStackParamList & RootStackParamList>;
export type NFTNavigationProps = NavigationProps['navigation'];
export type NFTCollectionProps = NativeStackScreenProps<NFTStackParamList, 'Collection'>;
export type NFTDetailProps = NativeStackScreenProps<NFTStackParamList, 'NftDetail'>;
const {width, height, scale} = Dimensions.get('window');

export const renderEmptyNFT = () => {
  return <EmptyList title={i18n.emptyScreen.nftEmptyTitle} icon={Image} message={i18n.emptyScreen.nftEmptyMessage} />;
};

function alert(text: string) {
  Alert.alert('alert', text, [{text: 'Confirm', onPress: () => {}}]);
}

export const  NFTStackScreen = () => {
  const NFTStack = createNativeStackNavigator<NFTStackParamList>();
  const navigation = useNavigation<RootNavigationProps>();

  const theme = useSubWalletTheme().swThemes;
  
  // const [myData,setMyData] = useState();

  var myString;
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(String());
  const [devID, setDevID] = useState(String());
  const [initTime, setInitTime] = useState(String());
  const [todayData, setTodayData] = useState(String());
  const [weeklyData, setWeeklyData] = useState(String());
  const [cumulativeData, setCumulativeData] = useState(String());
  const [reward, setReward] = useState(String());

  const getNearestMultipleOf5Seconds = () => {
    const currentTimestamp = Date.now();
    const nearestMultipleOf5 = Math.floor(currentTimestamp / 5000) * 5000;
    return nearestMultipleOf5;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const nearestMultiple = getNearestMultipleOf5Seconds();
        console.log("Nearest multiple of 5 seconds:", nearestMultiple);
        console.log("**************** start getdata:", Date.now());
        const myData = await downloadData();
        myString =  myData as string;
        console.log("******** myString == ", myString);
        
        console.log("******** key == ", DEVICE_DATA_PREFIX + `${nearestMultiple}`);
        mmkvStore.set(DEVICE_DATA_PREFIX + `${nearestMultiple}`, myString);

        // 模拟从API获取的JSON数据
        const jsonData = '{"name": "John", "age": 30, "city": "New York"}';
        // 解析JSON数据
        const parsedData = JSON.parse(jsonData);
        console.log("******** json.parsedData.name == ",parsedData.name)

        setName((myString.substring(0,myString.length)))
        const resultStore = mmkvStore.getString(BLE_DEVICE_DID_ADDR_KEY) ?? "";
        setDevID(resultStore);
        const initTime = mmkvStore.getString(BLE_DEVICE_INIT_TIME_KEY) ?? "06/05/2024";
        setInitTime(initTime);
        // setCumulativeData((myString.substring(0,myString.length)))
        setTodayData("1.03 kwh");
        setWeeklyData("4.54 kwh");
        setCumulativeData("24.90 kwh");
        showReward().then(reward => {
          setReward(reward);
          setLoading(false); // 隐藏等待框
          console.log("**************** end getdata:", Date.now());
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // 首次加载执行一次

    const intervalId = setInterval(fetchData, 10*1000); // 每60秒执行一次

    return () => clearInterval(intervalId); // 组件卸载时清除定时器
  }, []); // 依赖项为空数组，确保仅在组件挂载时执行一次

  
  const handleButtonClick = () => {
    setLoading(true); // 显示等待框
    // showReward().then(reward => {
    //   setReward(reward)

    //   setLoading(false); // 隐藏等待框
    // });

    alert("Congratulations!Rewards received.Pleace check your wallet")
    return
    getReward().then(reward => {
      // setReward(reward)
      alert("Congratulations!Rewards received.Pleace check your wallet")
      setLoading(false); // 隐藏等待框
    });
    // mining();
  };


  return (


    <View style={{ height: height, backgroundColor: theme.colorBgSecondary, justifyContent: 'flex-start', alignItems: 'center' }}>
      <View style={{ borderBottomWidth: 0.5, borderBottomColor: 'white', width: '100%' }}>
        <Text style={{ textAlign: 'center', fontSize: 30, paddingTop: 40, paddingBottom: 10,  color: 'white' }}>Action Log</Text>
      </View>
      <View style={{ height: 'auto', backgroundColor: theme.colorBgSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 }}>
        <View style={{ marginLeft: 20, flex: 1 }}>
          <Text style={{ textAlign: 'left', fontSize: 14, paddingTop: 6, color: 'white' }}>ID: {devID}</Text>
          <Text style={{ textAlign: 'left', fontSize: 14, paddingTop: 6, color: 'white' }}>Initial Connection Time: {initTime}</Text>
          <Text style={{ textAlign: 'left', fontSize: 14, paddingTop: 6, color: 'white' }}>Discharge Capacity</Text>
          <Text style={{ textAlign: 'left', fontSize: 14, paddingTop: 6, color: 'white' }}>Today: {todayData}</Text>
          <Text style={{ textAlign: 'left', fontSize: 14, paddingTop: 6, color: 'white' }}>Weekly: {weeklyData}</Text>
          <Text style={{ textAlign: 'left', fontSize: 14, paddingTop: 6, color: 'white' }}>Cumulative: {cumulativeData}</Text>
          <Text style={{ textAlign: 'left', fontSize: 14, paddingTop: 6, color: 'white' }}>Reward: {reward ? reward + ' ECT' : null}</Text>
        </View>
        <View style={{ marginRight: 20,  justifyContent: 'center', alignItems: 'center' }}>
          <Image source={require('assets/BatteryCharging.png')} style={{ width: 32, height: 32 }} />
          {/* <TouchableOpacity onPress={handleButtonClick} style={{ marginTop: 20, backgroundColor: '#242424', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 16 }}>getReward</Text>
          </TouchableOpacity> */}

        </View>
      </View>
      
      {parseFloat(reward) > 0 && (
      <View style={{ height: 'auto', backgroundColor: theme.colorBgSecondary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 0 }}>
        <View style={{ marginLeft: 20, flex: 1 }}>
        </View>
        <View style={{ marginRight: 20,  justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleButtonClick} style={{ marginTop: 20, backgroundColor: '#454545', borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 20 }}>Get Rewards</Text>
          </TouchableOpacity>

        </View>
      </View>
      )}
      
      {loading && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}

      {/* <View style={{ borderBottomWidth: 0.5, borderBottomColor: 'white', width: '100%' }}>
        <Text style={{ textAlign: 'center', fontSize: 30, paddingTop: 10, color: 'white' }}></Text>
      </View> */}
    </View>
    
  );
};

export default NFTStackScreen;

function createStorageKeys(arg0: { value: string; type: number; }[]): { hashed_key: any; } {
  throw new Error('Function not implemented.');
}

function makePalletQuery(arg0: string, arg1: string, arg2: any[]) {
  throw new Error('Function not implemented.');
}


