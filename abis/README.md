# 合约 ABI 文件

该文件夹包含项目中主要合约的 ABI（Application Binary Interface）文件，供前端应用使用。

### Contracts
- ConfidentialTokenFactory contract:  0x8d3F4e8fe379dBEA133420Eb6Be79033A0e78593
- ZamaForge contract : 0xdc5A3601541518A3B52879ef5F231f6A624C93EB
- Airdrop contract: 0x6dB435EFe22787b6CC4E0DDAb8a6281a8a6E04F1

## 合约说明

### 1. ConfidentialTokenFactory.json
- **功能**: 工厂合约，用于部署和管理 ConfidentialToken
- **核心方法**:
  - `wrapERC20(address erc20_, uint256 amount)`: 将 ERC20 代币包装为加密代币
  - `getConfidentialToken(address normalToken_)`: 获取普通代币对应的加密代币地址
  - `getERC20(address confidentialToken_)`: 获取加密代币对应的普通代币地址

### 2. ConfidentialTokenWrapper.json
- **功能**: 加密代币包装器，支持加密转账和 unwrap 操作
- **核心方法**:
  - `wrap(address to, uint256 amount)`: 包装普通代币为加密代币
  - `unwrap(address from, address to, euint64 amount)`: 解包装加密代币为普通代币
  - `confidentialTransfer(address to, euint64 amount)`: 加密转账
  - `confidentialBalanceOf(address account)`: 查询加密余额
  - `finalizeUnwrap(uint256 requestID, uint64 amount, bytes[] signatures)`: 完成 unwrap 操作

### 3. TestCoin.json
- **功能**: 测试用的 ERC20 代币合约
- **核心方法**: 标准 ERC20 接口
  - `transfer(address to, uint256 value)`: 转账
  - `balanceOf(address account)`: 查询余额
  - `approve(address spender, uint256 value)`: 授权

## 使用方式

### 在前端项目中引用

```javascript
import ConfidentialTokenFactory from './abis/ConfidentialTokenFactory.json';
import ConfidentialTokenWrapper from './abis/ConfidentialTokenWrapper.json';
import TestCoin from './abis/TestCoin.json';

// 使用示例
const factoryContract = new ethers.Contract(
  FACTORY_ADDRESS, 
  ConfidentialTokenFactory, 
  signer
);
```

### 主要工作流程

1. **包装流程**: 
   - 用户调用 `FactoryContract.wrapERC20()` 将普通 ERC20 代币包装为加密代币
   
2. **解包装流程**:
   - 用户调用 `ConfidentialTokenWrapper.unwrap()` 发起解包装请求
   - 链外计算解密值
   - 调用 `finalizeUnwrap()` 完成解包装

## 注意事项

- 加密代币使用 FHE（全同态加密）技术，余额和转账金额都是加密的
- unwrap 操作需要两步完成：发起请求 → 链外解密 → 完成解包装
- 所有涉及加密数据的操作都需要 inputProof 参数