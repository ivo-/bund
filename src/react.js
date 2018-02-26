const { PureComponent, createElement } = require('react');

const defaultSelectAll = state => state;
const defaultSelectOnceAll = (state, bundle) => ({
  ...(bundle.actions ? {
    ...bundle.actions,
    ...bundle.selectors,
  } : {
    ...Object.values(bundle).reduce((res, b) => ({
      ...res,
      ...b.actions,
      ...b.selectors,
    })),
  }),
});
const defaultThrottle = f => f;

/**
 * Connect provided React component to the provided bundle.
 * @param {React.Component} component
 * @param {Object} thisBundle
 * @param {Object} options
 */
module.exports = function connect(
  thisBundle,
  {
    selectAll = false,
    select = selectAll && defaultSelectAll,
    selectOnce = selectAll && defaultSelectOnceAll,
    throttle = defaultThrottle,
  },
  component,
) {
  const selectArg = thisBundle.bundles
    ? thisBundle.bundles.reduce((res, b) => ({ ...res, [b.key]: b }))
    : thisBundle;

  return class extends PureComponent {
    constructor(props) {
      super(props);

      this.staticProps = selectOnce(thisBundle.getState(), selectArg, props);
      this.getDynamicProps = () =>
        select(thisBundle.getState(), selectArg, this.props);

      this._lastDynamicProps = null;

      this.handleChange = this.handleChange.bind(this);
      this.unsubscribe = thisBundle.onChange(this.handleChange);
      this.scheduleUpdate = throttle(this.forceUpdate.bind(this));
    }

    componentWillUnMount() {
      this.unsubscribe();
    }

    handleChange() {
      const props = this.getDynamicProps();
      if (this._lastDynamicProps !== props) {
        this._lastDynamicProps = props;
        this.scheduleUpdate();
      }
    }

    render() {
      this._lastDynamicProps = this.getDynamicProps();
      return createElement(
        component,
        Object.assign({}, this.props, this.staticProps, this._lastDynamicProps),
      );
    }
  };
};
