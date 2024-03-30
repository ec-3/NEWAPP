import { _ChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { _isAssetFungibleToken } from '@subwallet/extension-base/services/chain-service/utils';

export function isTokenAvailable(
  chainAsset: _ChainAsset,
  assetSettingMap: Record<string, AssetSetting>,
  chainStateMap: Record<string, _ChainState>,
  filterActiveChain: boolean,
  ledgerNetwork?: string,
): boolean {
  const assetSetting = assetSettingMap[chainAsset.slug];

  const isAssetVisible = assetSetting && assetSetting.visible;
  const isAssetFungible = _isAssetFungibleToken(chainAsset);
  const isOriginChainActive = chainStateMap[chainAsset.originChain]?.active;
  const isValidLedger = ledgerNetwork ? ledgerNetwork === chainAsset.originChain : true; // Check if have ledger network

  // console.log(`***isTokenAvailable=: ${chainAsset.slug}   ${isAssetVisible}  ${isAssetFungible}   ${isOriginChainActive}    ${isValidLedger} *******`);

  if (chainAsset.slug === "krest_network-NATIVE-KREST" 
      || chainAsset.slug === "agung_network-NATIVE-AGUNG"
      || chainAsset.slug === "polygon-NATIVE-MATIC"
      || chainAsset.slug === "agung_network-NATIVE-ECT"
      || chainAsset.slug === "ethereum-ERC20-ECT-0xefc6899a558096d4f853682d29bbc2e46227fb10"
      || chainAsset.slug === "agung-NATIVE-ECT") {
    return true;
  } else {
    return false;
  }

  if (filterActiveChain) {
    return isAssetVisible && isAssetFungible && isOriginChainActive && isValidLedger;
  }

  return isAssetVisible && isAssetFungible && isValidLedger;
}
