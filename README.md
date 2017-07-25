GXB-UI 1.0
============

公信宝数据交易所钱包客户端, 提供转账、交易查询、区块浏览、账户查询、数据产品查询、联盟查询、商户和数据源认证等功能。

> 说明: 此项目fork自BitShares2.0的官方轻钱包 [bitshares-ui](https://github.com/bitshares/bitshares-ui), 移除了内盘交易相关的模块, 并根据公信宝数据交易所的产品需求进行了修改, 部分多余模块存在依赖耦合暂时没有移除,会在后续版本中进行处理。

## 安装

必要环境: Node 6+

建议系统: OSX、Ubuntu

建议使用NVM([Node Version Manager](https://github.com/creationix/nvm))进行安装:

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.2/install.sh | bash
nvm install v6
nvm use v6
```

克隆工程:

```
git clone https://github.com/gxchain/gxb-light.git
cd gxb-light
```

请先切换到`/web`目录下安装依赖:

```
cd web
npm install
```

## 启动

开发模式依赖于Express和webpack2, 依赖安装完成后, 在`/web`目录下下执行以下脚本来启动项目:
```
npm start
```

启动后浏览器打开: `localhost:8080` or `127.0.0.1:8080`. 
本项目支持热重载,即在修改工程模块后会立即编译和自动刷新页面


## 部署
通过以下命令可以编译出静态网站:
```
npm run build
```
编译结果在 `/dist` 目录下, 可以通过nginx、apache或者其他你喜欢的方式进行部署

## 打包钱包安装文件

钱包使用Electron进行打包, 支持Windows, OSX, Linux Debian环境下打包, 执行以下脚本来进行打包:

```
cd web
npm run electron
cd ../electron ##首次进入需要执行安装依赖 npm install
npm run release
```

每个环境下会打包各自环境对应的安装包

## 开发方式

- bug优先

## 代码风格

遵循 [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

强烈推荐使用 _eslint_ 来规范你的代码格式
