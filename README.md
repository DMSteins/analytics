# th-analytics

埋点功能库，用于收集用户的操作信息


npm 安装

```bash
npm i th-analytics

npm i th-analytics
```

yarn 安装

```bash
yarn add th-analytics

yarn add th-analytics
```

npm 更新

```bash
npm update th-analytics
```

yarn 更新

```bash
yarn upgrade th-analytics
```

## 使用

```javascript
import { initialize, send, update } from 'th-analytics';

// 初始化
initialize({
  appID: 'xxxxxx', // 应用ID或应用token
  server: 'xxxxxx', // 埋点api地址
  userIdentifier: 'xxxx', // 用户标识符，选填，优先使用send方法中的值
  debug: false, // debug模式，开启后，会在控制台打印出每次发送的参数
});

// 发送数据
send({
  hitType: 'click', // 事件类型，必填
  page: '/xxx/xxx', // 路径，不填默认当前页面url
  title: 'xxxxx', // 标题，不填默认当前页面title
  userIdentifier: 'xxxx', // 用户标识，不填默认使用 config 中的userIdentifier
  customFields: { // 自定义字段，类型 Record<string, string>
    formId: 'xxxx',
  },
});

// 更新配置，一般用于异步获取用户信息时，来更新userIdentifier
update({
  userIdentifier: 'xxxxxx',
});
```

在点击元素时，如果元素上带有 data-report="click" 属性，会自动收集数据发送

```html
<button data-report="click" data-report-name="click">
  创建项目
</button>

<form data-report="submit" data-report-name="submit">

</form>
```

- data-report 每个需要自动发送数据的元素，需要写上这个属性，目前仅设置了'click', 'submit'两种事件
- data-report-name 事件类型，click 事件默认 'click', submit 事件默认 'submit'，该值将会覆盖默认值，config hitType的类型
- data-report-* 其他定义，会自动收集到customFields字段

