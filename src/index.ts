import Analytics, { AnalyticsConfig, AnalyticsData } from "./analytics";

let analytics: Analytics;

export const initialize = (config: AnalyticsConfig) => {
  if (analytics) {
    console.warn('[th-analytics] [initialize] 请勿重复执行方法: initialize，如需更新配置信息，请使用方法: update');
    return;
  };
  analytics = new Analytics(config);
};

export const send = (data: AnalyticsData) => {
  if (!analytics) throw new Error('[th-analytics] [send] 请先执行初始化方法: initialize');
  analytics.send(data);
};

export const update = (config: Partial<AnalyticsConfig>) => {
  if (!analytics) throw new Error('[th-analytics] [update] 请先执行初始化方法: initialize');
  analytics.update(config);
};

export default { initialize, send, update };
