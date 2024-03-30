import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import i18n from 'utils/i18n/i18n';
import { ListRenderItemInfo, View ,Dimensions,  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { CrowdloanItem } from 'screens/Home/Crowdloans/CrowdloanItem';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import BleModule from '../bleManager/BleModule';


import BleProtocol from '../bleManager/BleProtocol';
import Characteristic from '../bleManager/Characteristic';

import Header from '../bleManager/Header';
import {BleEventType, BleState} from '../bleManager/type';

import {
  BleManagerDidUpdateStateEvent,
  Peripheral,
} from 'react-native-ble-manager';

import { RocketLaunch, TextAlignCenter } from 'phosphor-react-native';
import useGetCrowdloanList from 'hooks/screen/Home/Crowdloans/useGetCrowdloanList';
import { FlatListScreen } from 'components/FlatListScreen';
import { EmptyList } from 'components/EmptyList';
import { useSubWalletTheme } from 'hooks/useSubWalletTheme';
import { setAdjustPan } from 'rn-android-keyboard-adjust';
import { useIsFocused } from '@react-navigation/native';
import { CrowdloanItemType } from 'types/index';
import { color } from 'react-native-reanimated';
import { TextInput } from 'react-native-gesture-handler';
import { text } from '@fortawesome/fontawesome-svg-core';
import { mmkvStore } from 'utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { BLE_DEVICE_DID_ADDR_KEY, BLE_DEVICE_INIT_TIME_KEY } from 'constants/index';



const bleModule = new BleModule();
const bleProtocol = new BleProtocol();



const renderItem = ({ item }: ListRenderItemInfo<CrowdloanItemType>) => {
  return <CrowdloanItem item={item} />;
};
const {width, height, scale} = Dimensions.get('window');

const renderListEmptyComponent = () => {
  return (
    <EmptyList
      title={i18n.emptyScreen.crowdloanEmptyTitle}
      icon={RocketLaunch}
      message={i18n.emptyScreen.crowdloanEmptyMessage}
    />
  );
};

enum FilterValue {
  POLKADOT_PARACHAIN = 'Polkadot parachain',
  KUSAMA_PARACHAIN = 'Kusama parachain',
  WINNER = 'completed',
  FAIL = 'failed',
}

const SERVICE_UUID = '55E405D2-AF9F-A98F-E54A-7DFE43535355';
const WRITE_CHARACTERISTIC_UUID = '16962447-C623-61BA-D94B-4D1E43535349';
const NOTIFY_CHARACTERISTIC_UUID = 'B39B7234-BEEC-D4A8-F443-418843535349';

export const CrowdloansScreen = () => {
  const theme = useSubWalletTheme().swThemes;

  const items: CrowdloanItemType[] = useGetCrowdloanList();
  // const [isRefresh, refresh] = useRefresh();
  const isFocused = useIsFocused();
  const defaultFilterOpts = [
    { label: i18n.filterOptions.polkadotParachain, value: FilterValue.POLKADOT_PARACHAIN },
    { label: i18n.filterOptions.kusamaParachain, value: FilterValue.KUSAMA_PARACHAIN },
    { label: i18n.filterOptions.win, value: FilterValue.WINNER },
    { label: i18n.filterOptions.fail, value: FilterValue.FAIL },
  ];
  const crowdloanData = useMemo(() => {
    const result = items.sort(
      // @ts-ignore
      (firstItem, secondItem) => secondItem.convertedContribute - firstItem.convertedContribute,
    );

    return result;
  }, [items]);


  const [currConnectItemName, setCurrConnectItemName] = useState('');
  // 蓝牙是否连接
  const [isConnected, setIsConnected] = useState(false);
  // 正在扫描中
  const [scaning, setScaning] = useState(false);
  // 蓝牙是否正在监听
  const [isMonitoring, setIsMonitoring] = useState(false);
  // 当前正在连接的蓝牙id
  const [connectingId, setConnectingId] = useState('');
  // 写数据
  const [writeData, setWriteData] = useState('');
  // 接收到的数据
  const [receiveData, setReceiveData] = useState('');
  // 读取的数据
  const [readData, setReadData] = useState('');
  // 输入的内容
  const [inputText, setInputText] = useState('');

  const [inputTextPassWord, setInputTextPassWord] = useState('');

  // 扫描的蓝牙列表
  const [data, setData] = useState<Peripheral[]>([]);

  /** 蓝牙接收的数据缓存 */
  const bleReceiveData = useRef<any[]>([]);
  /** 使用Map类型保存搜索到的蓝牙设备，确保列表不显示重复的设备 */
  const deviceMap = useRef(new Map<string, Peripheral>());


  useEffect(()=>{
    if(!isConnected) {
      bleModule.start();
    }
  },[])



  useEffect(() => {
    const updateStateListener = bleModule.addListener(
      BleEventType.BleManagerDidUpdateState,
      handleUpdateState,
    );
    const stopScanListener = bleModule.addListener(
      BleEventType.BleManagerStopScan,
      handleStopScan,
    );
    const discoverPeripheralListener = bleModule.addListener(
      BleEventType.BleManagerDiscoverPeripheral,
      handleDiscoverPeripheral,
    );
    const connectPeripheralListener = bleModule.addListener(
      BleEventType.BleManagerConnectPeripheral,
      handleConnectPeripheral,
    );
    const disconnectPeripheralListener = bleModule.addListener(
      BleEventType.BleManagerDisconnectPeripheral,
      handleDisconnectPeripheral,
    );
    const updateValueListener = bleModule.addListener(
      BleEventType.BleManagerDidUpdateValueForCharacteristic,
      handleUpdateValue,
    );

    return () => {
      updateStateListener.remove();
      stopScanListener.remove();
      discoverPeripheralListener.remove();
      connectPeripheralListener.remove();
      disconnectPeripheralListener.remove();
      updateValueListener.remove();
    };
  }, []);

    
    let resultPin: string = ''; 
    /** 接收到新数据 */
    function handleUpdateValue(data: any) {
      console.log('BluetoothUpdateValue data:', data);
      let value = data.value as string;
      console.log('BluetoothUpdateValue value:', value);
  
      bleReceiveData.current.push(value);
      setReceiveData(bleReceiveData.current.join(' -- '));
  
      const result = convertDataToString(data.value);
      bleReceiveData.current.push(result);
      console.log('BluetoothUpdateValue *****result:', result); // 输出: 
      
      console.log('BluetoothUpdateValue value:', value);
      console.log('BluetoothUpdateValue *****resultPin:', resultPin); 
      if (result.startsWith("peaqID,")) {
        resultPin = result;
      } else {
        resultPin = resultPin + result;
      }
      if (resultPin.endsWith(",END")) {
        resultPin = resultPin.replace(/,END$/, ''); // 替换掉最后的",END"
        console.log('BluetoothUpdateValue *****resultPin222:', resultPin); 
        mmkvStore.set(BLE_DEVICE_DID_ADDR_KEY, resultPin);

        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以需要加1，并且保证两位数的格式
        const day = String(currentDate.getDate()).padStart(2, '0'); // 保证两位数的格式
        const formattedDate = `${day}/${month}/${year}`;
        mmkvStore.set(BLE_DEVICE_INIT_TIME_KEY, formattedDate);
      }
      setReceiveData(bleReceiveData.current.join(' -- '));

    }

    // function handleUpdateValueBAK(data: any) {
    //   console.log('BluetoothUpdateValue data:', data);
    //   let value = data.value as string;
    //   console.log('BluetoothUpdateValue value:', value);
  
    //   bleReceiveData.current.push(value);
    //   setReceiveData(bleReceiveData.current.join(' -- '));
  
    //   const result = convertDataToString(data.value);
    //   bleReceiveData.current.push(result);
    //   console.log('BluetoothUpdateValue *****result:', result); // 输出: 
    //   const resultStore = mmkvStore.getString(BLE_DEVICE_DID_ADDR_KEY);
    //   console.log('BluetoothUpdateValue value:', value);
    //   console.log('BluetoothUpdateValue resultStore:', resultStore);
    //   let resultPin: string = ''+resultStore; // 初始化为一个空字符串
    //   console.log('BluetoothUpdateValue *****resultPin:', resultPin); 
    //   console.log('BluetoothUpdateValue *****resultPin.length:', resultPin.length); 
    //   // if (resultPin.length == 20 || resultPin.length == 40) {
    //   //   resultPin = resultStore + result; // 拼接结果
    //   // } else {
    //   //   resultPin = result; // 清空数据, 存本次最新的一段
    //   // }
    //   if (result.startsWith("peaqID,")) {
    //     resultPin = result;
    //   } else {
    //     resultPin = resultStore + result;
    //   }
    //   if (resultPin.endsWith(",END")) {
    //     resultPin = resultPin.replace(/,END$/, ''); // 替换掉最后的",END"
    //   }
    //   console.log('BluetoothUpdateValue *****resultPin222:', resultPin); 
    //   mmkvStore.set(BLE_DEVICE_DID_ADDR_KEY, resultPin);
    //   setReceiveData(bleReceiveData.current.join(' -- '));

      
    //   const currentDate = new Date();
    //   const year = currentDate.getFullYear();
    //   const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以需要加1，并且保证两位数的格式
    //   const day = String(currentDate.getDate()).padStart(2, '0'); // 保证两位数的格式
    //   const formattedDate = `${day}/${month}/${year}`;
    //   mmkvStore.set(BLE_DEVICE_INIT_TIME_KEY, formattedDate);
    // }

  // LOG  BluetoothUpdateValue: [1, 1, 9, 5, 1, 2, 3, 4, 5, 225]
    function convertDataToString(data: number[]): string {
      console.log('convertDataToString data:', data);
      let resultString = '';
      for (let i = 0; i < data.length; i++) {
          resultString += String.fromCharCode(data[i]);
          console.log('convertDataToString *****data[i]:', data[i]);
          console.log('convertDataToString *****i:', i);
          console.log('convertDataToString *****result:', resultString);
      }
      return resultString;
    }
  
  /** 蓝牙设备已连接 */
  function handleConnectPeripheral(data: Peripheral) {
    console.log('BleManagerConnectPeripheral:', data);
  }

  /** 蓝牙设备已断开连接 */
  function handleDisconnectPeripheral(data: Peripheral) {
    console.log('BleManagerDisconnectPeripheral:', data);
    initData();
  }
  function initData() {
    // 断开连接后清空UUID
    bleModule.initUUID();
    // 断开后显示上次的扫描结果
    setData([...deviceMap.current.values()]);
    console.log('**** initData set connected = false');
    setIsConnected(false);
    setWriteData('');
    setReadData('');
    setReceiveData('');
    setInputText('');
  }

    /** 搜索到一个新设备监听 */
    function handleDiscoverPeripheral(data: Peripheral) {
      // console.log('BleManagerDiscoverPeripheral:', data);
      // 蓝牙连接 id
      let id;
      // 蓝牙 Mac 地址
      let macAddress;
      if (Platform.OS == 'android') {
        macAddress = data.id;
        id = macAddress;
      } else {
        // ios连接时不需要用到Mac地址，但跨平台识别同一设备时需要 Mac 地址
        macAddress = bleProtocol.getMacFromAdvertising(data);
        id = data.id;
      }
      deviceMap.current.set(data.id, data);
      setData([...deviceMap.current.values()]);
    }

  /** 扫描结束监听 */
  function handleStopScan() {
    console.log('Scanning is stopped');
    setScaning(false);
  }
  /** 蓝牙状态改变 */
  function handleUpdateState(event: BleManagerDidUpdateStateEvent) {
    console.log('BleManagerDidUpdateState:', event);
    bleModule.bleState = event.state;
    // 蓝牙打开时自动扫描
    if (event.state === BleState.On) {
      scan();
    }
  }
  function scan() {
    if (bleModule.bleState !== BleState.On) {
      enableBluetooth();
      return;
    }

    // 重新扫描时清空列表
    deviceMap.current.clear();
    bleModule
      .scan()
      .then(() => {
        setScaning(true);
      })
      .catch(err => {
        setScaning(false);
      });
  }

  function enableBluetooth() {
    if (Platform.OS === 'ios') {
      alert('请开启手机蓝牙');
    } else {
      Alert.alert('提示', '请开启手机蓝牙', [
        {
          text: '取消',
          onPress: () => {},
        },
        {
          text: '打开',
          onPress: () => {
            bleModule.enableBluetooth();
          },
        },
      ]);
    }
  }

  /** 连接蓝牙 */
  function connect(item: Peripheral) {
    setConnectingId(item.id);
    console.log("item.id******",item.id);

    if (scaning) {
      // 当前正在扫描中，连接时关闭扫描
      bleModule.stopScan().then(() => {
        setScaning(false);
      });
    }

    console.log("焦起龙")
    console.log('焦起龙', item.id);

    console.log("焦起龙")
    bleModule
      .connect(item.id)
      .then(peripheralInfo => {
        setCurrConnectItemName(item.name == undefined ? "" : item.name);
        console.log('**** 11 set connected = true');
        setIsConnected(true);
        // 连接成功后，列表只显示已连接的设备
        setData([item]);
        
        notifyEc3();
      })
      .catch(err => {
        alert('连接失败');
      })
      .finally(() => {
        setConnectingId('');
      });
  }

      /** 断开连接 */
  function disconnect() {
    bleModule.disconnect();
    initData();
  }


  function notifyEc3() {
    bleModule
      .startEc3Notification(SERVICE_UUID, NOTIFY_CHARACTERISTIC_UUID)
      .then(() => {
        setIsMonitoring(true);
        // alert('广播接收开启成功');
        console.log('**** 广播接收开启成功');
      })
      .catch(err => {
        setIsMonitoring(false);
        // alert('广播接收开启失败');
        console.log('**** 广播接收开启失败');
      });
  }

  function notify(index: number) {
    bleModule
      .startNotification(index)
      .then(() => {
        setIsMonitoring(true);
        alert('开启成功');
      })
      .catch(err => {
        setIsMonitoring(false);
        alert('开启失败');
      });
  }

  function read(index: number) {
    bleModule
      .read(index)
      .then((data: string) => {
        setReadData(data);
      })
      .catch(err => {
        alert('读取失败');
      });
  }

  function write(writeType: 'write' | 'writeWithoutResponse') {
    console.log("write---------------", writeType)
    console.log("write--------------inputText-", inputText)
    return (index: number) => {
      console.log("write--------------inputText.length-", inputText.length)
      if (inputText.length === 0) {
        alert('请输入消息内容');
        return;
      }

      console.log("write--------------index-", index)
      bleModule[writeType](inputText+inputTextPassWord, index)
        .then(() => {
          bleReceiveData.current = [];
          console.log("write inputText==","connectwifi"+inputText+inputTextPassWord)
          setWriteData("connectwifi,"+inputText+","+inputTextPassWord);
          setInputText('');
          setInputTextPassWord('');
        })
        .catch(err => {
          alert('发送失败');
        });
    };
  }

  function writeEc3Data() {
    console.log("write--------------inputText-", inputText)
    console.log("write--------------inputText.length-", inputText.length)
    if (inputText.length === 0) {
      alert('请输入WiFi名称');
      return;
    }
    if (inputTextPassWord.length === 0) {
      alert('请输入WiFi密码');
      return;
    }

    let data = "connectwifi,"+inputText+","+inputTextPassWord;
    bleModule['writeEc3DataWithoutResponse'](data, SERVICE_UUID, WRITE_CHARACTERISTIC_UUID)
      .then(() => {
        bleReceiveData.current = [];
        console.log("write inputText==",data)
        setWriteData(data);
        setInputText('');
        setInputTextPassWord('');
      })
      .catch(err => {
        alert('发送失败');
      });
  }

  function readPeaqIDEc3Data() {
    let data = "peaqID";
    bleModule['writeEc3DataWithoutResponse'](data, SERVICE_UUID, WRITE_CHARACTERISTIC_UUID)
      .then(() => {
        bleReceiveData.current = [];
        console.log("write inputText==",data)
        setWriteData(data);
      })
      .catch(err => {
        alert('发送失败');
      });
  }

  function alert(text: string) {
    Alert.alert('提示', text, [{text: '确定', onPress: () => {}}]);
  }

  function renderItem(item: ListRenderItemInfo<Peripheral>) {
    const data = item.item;
    const disabled = !!connectingId && connectingId !== data.id;

    console.log("----------------1---------------")

    console.log(data)
    console.log("----------------2---------------")
    return (
      <TouchableOpacity
        activeOpacity={1.0}
        disabled={disabled || isConnected}
        onPress={() => {
          connect(data);
        }}
        style={[styles.item, { opacity: disabled ? 1 : 1 }]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'column' }}>
            <Text style={{ color: 'white' }}>{data.name ? data.name : 'Unnamed device'}</Text>
            <Text style={{ color: 'white' }}>{data.id}</Text>
          </View>
          <Text style={{ color: 'white', marginRight: 10 }}>
            {connectingId === data.id ? 'Connecting...' : ''}
          </Text>
        </View>
      </TouchableOpacity>

    );
  }

  function renderFooter() {
    if (!isConnected) {
      return;
    }
    return (
      <KeyboardAwareScrollView extraScrollHeight={20} enableAutomaticScroll={true} enableOnAndroid={true}>

        <ScrollView
          style={{
            marginTop: 10,
            borderColor: 'leeow',
            borderStyle: 'solid',
            borderTopWidth: StyleSheet.hairlineWidth * 2,
            flex:1,
          }}>



          <Text style={{marginTop:13,fontSize:20, color: 'white',textAlign:'center',fontWeight:'bold'}}>
            Connect to WiFi
          </Text>

          <Text style={{marginTop:13,marginLeft:50,marginRight:50,fontSize:16, color: 'gray',textAlign:'center'}}>
            Pleace ensure your phone and the Ec cube are on the same network
          </Text>

          <ImageBackground
            source={require('./assets/beijingBlu.png')}
            style={{height:240,width:240,alignSelf:'center',marginTop:20}}> 
          </ImageBackground>
              
          <View style ={{height:50,width:300,alignSelf:'center',marginTop:30,backgroundColor:theme.colorBorder,borderRadius:15,flexDirection: 'row',flex:1}}>
              <ImageBackground
                source={require('./assets/namepass.png')}
                style={{height:30,width:30,marginLeft:20,marginTop:10}}
                resizeMode='contain'
                > 
              </ImageBackground>

              <TextInput
                  style={{
                    paddingLeft: 10,
                    paddingRight: 10,
                    // backgroundColor: 'red',
                    height: 50,
                    width: 230,
                    fontSize: 19,
                    color:'white',
                    marginLeft: 10,
                  }}
                  placeholder="Enter wifi name"
                  placeholderTextColor='gray'
                  value={inputText} 
                  onChangeText={(text: any) => {
                    setInputText(text)
                  }}>
                </TextInput>
            </View>


            <View style ={{height:50,width:300,alignSelf:'center',marginTop:10,backgroundColor:theme.colorBorder,borderRadius:15,flexDirection: 'row',flex:1}}>
              
              <ImageBackground
                source={require('./assets/wiftpassword.png')}
                style={{height:30,width:30,marginLeft:20,marginTop:10}}
                resizeMode='contain'
                > 
              </ImageBackground>

              <TextInput 
                style={{
                paddingLeft: 10,
                paddingRight: 10,
                // backgroundColor: 'red',
                height: 50,
                marginTop:0,
                width: 230,
                fontSize: 19, 
                color:'white',
                marginLeft:10,
                }}
                placeholder="Enter wifi password"
                placeholderTextColor="gray"
                value={inputTextPassWord} 
                onChangeText={(text: any) => {
                  setInputTextPassWord(text);
                }}>
              </TextInput>

            </View>



          {/* <TextInput 
            style={{
            paddingLeft: 10,
            paddingRight: 10,
            backgroundColor: theme.colorBorder,
            height: 50,
            width: width,
            fontSize: 16,
            color:'white',
            flex: 1,}} placeholder="Enter wifi name"  placeholderTextColor = 'white'
            onChangeText={ (text: any) => {
              setInputText(text)
            }}>
          </TextInput>

          <TextInput 
            style={{
            paddingLeft: 10,
            paddingRight: 10,
            backgroundColor: theme.colorBorder,
            height: 50,
            marginTop:20,
            width: width,
            fontSize: 16, 
            color:'white',
            flex: 1,}} placeholder="Enter wifi password" placeholderTextColor = 'white'
            
            onChangeText={ text => {
              setInputTextPassWord(text)
            }}>
          </TextInput> */}

        
    


        <TouchableOpacity style={{
                height:50,
                marginTop:20,
                width:180,
                backgroundColor: '#62F3A5',
                alignSelf:"center",
                borderRadius:25,
              }}
                activeOpacity={1.0}
                onPress={() => {  
                  {writeEc3Data()}
                }}>
              <Text style={{marginTop:13,fontSize:20, color: 'black',textAlign:'center'}}>
                Send
              </Text>     
          </TouchableOpacity>





          <Text style={{
              marginTop: 5,
              marginBottom: 15,
              backgroundColor: 'transparent', 
              color: 'white',
              paddingLeft: 10, 
              paddingRight: 10,
          }}>{receiveData}</Text>


        {/* <TouchableOpacity style={{
            height:50,
            marginTop:10,
            // width:width,
            backgroundColor: theme.colorBorder,
            marginLeft:50,
            marginRight:50,
            // alignSelf:"center"
          }}
          activeOpacity={1.0}
          onPress={() => {
            {
              // notifyEc3()
              readPeaqIDEc3Data()
            }
          }}>
        <Text style={{marginTop:13,fontSize:20, color: 'white',textAlign:'center'}}>
          启动接收数据
        </Text>
        </TouchableOpacity> */}




        </ScrollView>
      </KeyboardAwareScrollView>

    );
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:theme.colorBgContainer}}>
      <Header
        itemName={currConnectItemName}
        isConnected={isConnected}
        scaning={scaning}
        disabled={scaning || !!connectingId}
        onPress={isConnected ? disconnect : scan}
      />
      {!isConnected && (
        <FlatList
          renderItem={renderItem}
          keyExtractor={(item: { id: any }) => item.id}
          data={data}
          extraData={connectingId}
        />
      )}

      {renderFooter()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  // container: {
  //   flex: 1,
  //   backgroundColor: theme.colorBgSecondary,
  // },
  item: {
    flexDirection: 'column',
    borderColor: 'gray',
    borderStyle: 'solid',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: 10,
    paddingVertical: 8,
  },
});