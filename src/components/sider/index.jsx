import React from 'react';
import PropTypes from 'prop-types';

import {Link} from 'react-router';

import Layout from 'antd/lib/layout';
import Menu from 'antd/lib/menu';
import Icon from 'antd/lib/icon';

import './index.less';

const HTTP_PATTERN = /^https?:\/\//;

const bubbleSort = (arr, sortCb) => {
  var len = arr.length;
  for (var i = 0; i < len; i++) {
    for (var j = 0; j < len - 1 - i; j++) {
      // 相邻元素两两对比
      if (sortCb(arr[j], arr[j + 1]) > 0) {
        // 元素交换
        var temp = arr[j + 1];
        arr[j + 1] = arr[j];
        arr[j] = temp;
      }
    }
  }
  return arr;
};

export class Sider extends React.PureComponent {
  static propTypes = {
    routes: PropTypes.array.isRequired,
    route: PropTypes.object,
    orderKeys: PropTypes.array,
    collapsed: PropTypes.bool,
    openLevel: PropTypes.number,
    brand: PropTypes.object,
    subMenus: PropTypes.object,
    Link: PropTypes.any,
    getResolvePath: PropTypes.func,
    menu: PropTypes.object,

    width: PropTypes.any,
    collapsedWidth: PropTypes.any,
    onCollapse: PropTypes.func,
    flex: PropTypes.bool,
    sider: PropTypes.object,
    header: PropTypes.object
  }

  static defaultProps = {
    subMenus: {},
    getResolvePath: (item) => item.resolvePath || item.path,
    Link: Link,
    brand: {
      logo: '//img.alicdn.com/tfs/TB14dINRpXXXXcyXXXXXXXXXXXX-64-64.png?t=1517996107967',
      title: 'App'
    }
  }

  constructor(props) {
    super(props);

    const route = props.route;
    const routes = this.getRoutes(props.routes, props.orderKeys);
    let openKeys = route && this.getParentsResolvePaths(route);
    if (!openKeys || !openKeys.length) {
      openKeys = this.getOpenKeys(routes, props.subMenus);
    }
    this.state = {
      routes: routes,
      selectedKeys: route ? [this.props.getResolvePath(route)] : null,
      openKeys: openKeys,
      subMenus: props.subMenus
    };
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.route !== nextProps.route) {
      const resolvePath = this
        .props
        .getResolvePath(nextProps.route);
      if (!this.state.selectedKeys || this.state.selectedKeys.indexOf(resolvePath) === -1) {
        const routes = this.getRoutes(nextProps.routes, nextProps.orderKeys);
        let openKeys = this.state.openKeys.length ? this.state.openKeys : nextProps.route && this.getParentsResolvePaths(nextProps.route);
        if (!openKeys || !openKeys.length) {
          openKeys = this.getOpenKeys(routes, nextProps.subMenus);
        }
        this.setState({
          routes: routes,
          selectedKeys: [resolvePath],
          openKeys: openKeys
        });
      }
    }
  }

  getRoutes(routes, orderKeys) {
    if (orderKeys) {
      const map = {};
      orderKeys.forEach((v, index) => map[v] = index);
      return bubbleSort(routes, (a, b) => {
        const aName = a.children ? a.name : a.navKey || a.name;
        const bName = b.children ? b.name : b.navKey || b.name;
        const compare = map[aName] - map[bName];
        if (compare === 0 || isNaN(compare)) {
          return a.value - b.value;
        } else {
          return compare;
        }
      });
    } else {
      return routes;
    }
  }

  getOpenKeys(routes, subMenus, level = 0) {
    if (this.props.openLevel) {
      const cacheMap = {};
      let keys = [];
      routes.forEach(route => {
        const children = route.children || route.childRoutes;
        if (route.navKey && subMenus[route.navKey]) {
          if (!cacheMap[route.navKey]) {
            cacheMap[route.navKey] = true;
            keys.push(route.navKey);
          }
        } else if (children && level < this.props.openLevel) {
          if (!cacheMap[route.name]) {
            cacheMap[route.name] = true;
            keys.push(route.name);
          }
          keys = keys.concat(this.getOpenKeys(children, subMenus, level + 1));
        }
      });
      return keys;
    } else {
      return null;
    }
  }

  getParentsResolvePaths(route) {
    const resolvePaths = [];
    const navKey = route.navKey;
    while (route.parent) {
      route = route.parent;
      resolvePaths.push(route.name);
    }
    if (navKey && this.props.subMenus[navKey]) {
      resolvePaths.push(navKey);
    }
    return resolvePaths;
  }

  packNode(item, level) {
    const subMenus = this.state.subMenus;
    if (item.hide || item.disabled) {
      return null;
    }
    if (item.navKey && subMenus[item.navKey]) {
      if (subMenus[item.navKey].hide || subMenus[item.navKey].disabled) {
        return null;
      }
      if (level < 1) {
        subMenus[item.navKey].children = subMenus[item.navKey].children || [];
        let idx = subMenus[item.navKey]
          .children
          .findIndex(d => d.name === item.name);
        if (idx === 0) {
          item = subMenus[item.navKey];
        } else if (idx === -1) {
          subMenus[item.navKey].children = subMenus[item.navKey].children || [];
          idx = subMenus[item.navKey]
            .children
            .push(item);
          if (idx > 1) {
            clearTimeout(this._timer);
            this._timer = setTimeout(() => {
              clearTimeout(this._timer);
              if (this.mounted) {
                this.forceUpdate();
              }
            });
            return null;
          } else {
            const navKey = item.navKey;
            item = subMenus[item.navKey];
            item.name = navKey;
          }
        } else {
          return null;
        }
      }
    }

    // #! 从路由配置项中获取childRoutes
    const target = item.target;
    const title = item.title || item.name;
    const icon = item.icon;
    const iconCom = icon && (<Icon type={icon} />);
    const children = item.children || item.childRoutes || [];

    if (title) {
      return {
        target: target,
        icon: iconCom,
        title: title,
        name: item.navKey ? item.navKey + '-' + item.name : item.name,
        children: children,
        hide: item.hide || item.disabled,
        path: children.length ? null : this.props.getResolvePath(item)
      };
    } else {
      return null;
    }
  }

  getNavMenuItems(menusData, level = 0) {
    const ILink = this.props.Link;
    if (!menusData) {
      return [];
    }
    return menusData.map((item) => {
      item = this.packNode(item, level);

      if (!item) {
        return null;
      }

      if (item.children.length) {
        return (
          <Menu.SubMenu
            title={item.icon ?
              (
                <span>
                  {item.icon}
                  <span className="j-menu-text">{item.title}</span>
                </span>
              ) : (
                <span className="j-menu-text">{item.title}</span>
              )}
            key={item.name}>
            {this.getNavMenuItems(item.children, level + 1)}
          </Menu.SubMenu>
        );
      }
      return (
        <Menu.Item key={item.path}>
          {HTTP_PATTERN.test(item.path) ?
            (
              <a
                href={item.path}
                target={item.target}
                onClick={e => ['_self', undefined].indexOf(item.target) === -1 && e.stopPropagation()}>
                {item.icon}<span className="j-menu-text">{item.title}</span>
              </a>
            ) :
            (
              <ILink to={item.path} target={item.target}>
                {item.icon}<span className="j-menu-text">{item.title}</span>
              </ILink>
            )}
        </Menu.Item>
      );
    });
  }

  render() {
    let Conn;
    let connProps;
    let sider = this.props.sider;
    let header = this.props.header;
    const brand = this.props.brand;
    const ILink = this.props.Link;
    let flexDiv;

    const menuOption = Object.assign({
      mode: 'inline',
      theme: 'dark',
      inlineIndent: 24
    }, this.props.menu);

    if (menuOption.mode === 'horizontal') {
      Conn = Layout.Header;
      connProps = header || {};
    } else {
      menuOption.style = menuOption.style || {
        margin: '16px 0',
        width: '100%'
      };
      menuOption.openKeys = this.state.collapsed ? null : this.state.openKeys;
      const {collapsed, onCollapse, flex} = this.props;
      Conn = Layout.Sider;
      // inspired
      if (sider) {
        connProps = sider;
      } else {
        let width = this.props.width || 256;
        let collapsedWidth = this.props.collapsedWidth || 80;
        if (collapsed) {
          width = 0;
          collapsedWidth = 0;
        }
        connProps = {
          trigger: null,
          collapsible: true,
          breakpoint: 'md',
          width: width,
          collapsedWidth: collapsedWidth
        };
      }
      connProps.className = 'j-com-sider ' + 'j-com-sider-' + menuOption.theme + ' ' + (collapsed ? 'j-com-sider-collapse' : 'j-com-sider-expand');
      if (connProps.flex || flex) {
        flexDiv = (<div className="j-sider-collapse-outer">
          <div className="j-sider-collapse-inner">
            <div className="j-sider-collapse-bg"></div>
            <div className="j-sider-collapse" onClick={() => onCollapse(!collapsed)}>
              {collapsed ? (<Icon type="menu-unfold" />) : <Icon type="menu-fold" />}
            </div>
          </div>
        </div>);
      }
    }
    return (
      <Conn {...connProps}>
        {brand ? (<div className='j-sider-logo'>
          <ILink to={brand.path || '/'}>
            <img src={brand.logo} alt="logo" />
            <h1 className="j-menu-text">{brand.title}</h1>
          </ILink>
        </div>) :  null}
        <Menu
          onOpenChange={(openKeys) => this.setState({openKeys: openKeys})}
          onSelect={(item) => this.setState({selectedKeys: item.selectedKeys})}
          selectedKeys={this.state.selectedKeys}
          inlineCollapsed={this.state.collapsed}
          {...menuOption}>
          {this.getNavMenuItems(this.state.routes)}
        </Menu>
        {flexDiv}
      </Conn>
    );
  }
}
