export type AnalyticsConfig = {
  /**
   * 应用ID，需要向管理员申请
   */
  appId: string;

  /**
   * 服务地址
   */
  server: string

  /**
   * 用户标识
   */
  userIdentifier?: string;

  /**
   * debug模式，开启后将会在控制台打印出最终发送的参数信息，建议仅在开发环境中开启
   */
  debug?: boolean;
}

export type AnalyticsData = {
  /**
   * 事件名称
   */
  hitType: 'page_view' | 'click' | 'scroll' | 'session_start' | 'first_visit' | 'form_start' | string;

  /**
   * 页面地址
   */
  page?: string;

  /**
   * 页面名称
   */
  title?: string;

  /**
   * 用户标识
   */
  userIdentifier?: string;

  /**
   * 自定义字段
   */
  customFields?: Record<string, string>;
}

const SID_KEY = '_ta_sid';

export default class Analytics {
  _config?: AnalyticsConfig;
  _server?: string;

  constructor(config: AnalyticsConfig) {
    this.setConfig(config);

    this.addEventListeners();

    this.firstVisit();
  }

  firstVisit() {
    if (this.sid) {
      this.send({
        hitType: 'page_view',
      });
    } else {
      this.setSid();
      this.send({
        hitType: 'first_visit',
      });
    }
  }

  /**
   * 更新配置信息
   */
  update(config: Partial<AnalyticsConfig>) {
    this.setConfig({ ...this.config, ...config });
  }

  // 设置config
  private setConfig(config: AnalyticsConfig) {
    if(!config.server) throw new Error('未配置服务地址')

    // 设置服务地址
    this._server = config.server;

    // 设置配置信息
    this._config = { ...config };

    // 冻结配置对象
    Object.freeze(this._config);
  }

  /**
   * 读取配置
   */
  get config(): AnalyticsConfig {
    if (!this._config) throw new Error('未配置config');
    return { ...this._config };
  }

  /**
   * 读取服务地址
   */
  get server(): string {
    if (!this._server) throw new Error('未配置服务地址');
    return this._server;
  }

  get isDebug(): boolean {
    return !!this.config.debug;
  }

  get sid(): string {
    return window.sessionStorage.getItem(SID_KEY) || '';
  }

  private setSid() {
    if (this.sid) return;
    window.sessionStorage.setItem(SID_KEY, Date.now().toString());
  }

  /**
   * 将数据转换为url query参数，前面带 ?
   */
  private getSearch(data: AnalyticsData) {
    const params: Record<string, string> = {
      appID: this.config.appId,
      hitType: data.hitType,
      page: data.page || window.location.href,
      title: data.title || window.document.title,
      sid: this.sid,
      t: Date.now().toString(),
      ua: window.navigator.userAgent,
    };

    const userIdentifier = data.userIdentifier || this.config.userIdentifier;

    if (userIdentifier) params.userIdentifier = userIdentifier;

    if (data.customFields) params.customFields = JSON.stringify(data.customFields);

    const searchParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      searchParams.set(key, params[key]);
    });

    const search = `?${searchParams.toString()}`;

    if (this.isDebug) {
      console.group('th-analytics');
      console.debug('server: ', this.server);
      console.debug('params: ', params);
      console.debug('params.customFields: ', data.customFields);
      console.debug('search: ', search);
      console.groupEnd();
    }

    return search;
  }

  /**
   * 发送数据
   */
  send(data: AnalyticsData) {
    const url = new URL(this.server);

    url.search = this.getSearch(data);

    window.navigator.sendBeacon(url.toString());
  }

  /**
   * 获取报告的元素，需要在元素上添加属性 data-report = eventName
   */
  private getReportElem = (elem: EventTarget | HTMLElement | SVGElement | null, eventName: string): HTMLElement | SVGElement | null => {
    if (!elem || !(elem instanceof HTMLElement || elem instanceof SVGElement) || elem === document.documentElement) return null;
    if (elem.dataset.report?.includes(eventName)) return elem;
    return this.getReportElem(elem.parentElement, eventName);
  }

  private getReportElemParams = (elem: HTMLElement | SVGElement) => {
    const keyNames = Object.keys(elem.dataset).filter(key => /^report[A-Z]/.test(key)).map(key => {
      const name = key.replace(/^report[A-Z]/, match => match.toLowerCase().replace('report', ''));
      return { key, name };
    });
    const params: Record<string, string> = {};
    keyNames.forEach(({ key, name }) => {
      const value = elem.dataset[key];
      if (!value) return;
      params[name] = value;
    });
    if (elem instanceof HTMLFormElement) {
      params.formAction = elem.action;
      params.formId = elem.id;
      params.formMethod = elem.method;
    }
    if (elem instanceof HTMLAnchorElement) {
      params.anchorHref = elem.href;
      params.anchorId = elem.id;
    }
    return params;
  };

  /**
   * 发送点击事件报告
   */
  private handleReportClick = (e: MouseEvent) => {
    const elem = this.getReportElem(e.target, 'click');
    if (!elem) return;
    const eventName = elem.dataset.reportName || 'click';
    const params = this.getReportElemParams(elem);
    this.send({
      hitType: eventName,
      page: window.location.href,
      title: window.document.title,
      customFields: params,
    });
  }

  /**
   * 发送表单事件报告
   */
  private handleReportForm = (e: Event) => {
    const elem = e.target;
    if (!(elem instanceof HTMLFormElement) || !(elem.dataset.report?.includes('submit'))) return;
    const eventName = elem.dataset.reportName || 'submit';
    const params = this.getReportElemParams(elem);
    this.send({
      hitType: eventName,
      page: window.location.href,
      title: window.document.title,
      customFields: params,
    });
  }

  /**
   * 添加事件监听
   */
  private addEventListeners() {
    document.addEventListener('click', this.handleReportClick, { capture: true, passive: true });
    document.addEventListener('submit', this.handleReportForm, { capture: true, passive: true });
  }
}
