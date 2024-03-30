import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View,Dimensions, Image, Platform} from 'react-native';


const {width, height, scale} = Dimensions.get('window');

interface HeaderProps {
  itemName: string;
  isConnected: boolean;
  scaning: boolean;
  disabled: boolean;
  onPress: () => void;
}

const Header: React.FC<HeaderProps> = ({
  itemName,
  isConnected,
  scaning,
  disabled,
  onPress,
}) => {
  console.log("--------------------------itemName=--",itemName)
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.buttonView, { opacity: disabled ? 0.5 : 1 }]}
          disabled={disabled}
          onPress={onPress}>

          <Image
            source={require('./assets/bluetooth.png')}
            style={{ height: 24, width: 24, marginRight: 8 }}>
          </Image>

          <Text style={styles.buttonText}>
            {scaning ? 'Searching' : isConnected ? 'Unconnect' : 'Scan'}
          </Text>

        </TouchableOpacity>
      </View>

      <Text style={styles.text}>
        {isConnected ? 'Current connect device: '+itemName : 'Available devices'}
      </Text>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 20 : 40,
    alignItems: 'center', // 让内容在纵向方向上居中对齐
  },
  buttonContainer: {
    alignSelf: 'center', // 让按钮容器水平居中
  },
  buttonView: {
    backgroundColor: '#454545',
    borderRadius: 10,
    marginTop: 10,
    height: 40,
    flexDirection: 'row', // 沿水平方向布局
    alignItems: 'center', // 让内容在水平方向上居中对齐
    paddingHorizontal: 20, // 添加水平边距
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
  },
  text: {
    marginLeft: 10,
    marginTop: 10,
    color: 'white'
  },
});


export default Header;
