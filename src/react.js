const { PureComponent, createElement } = require('react');

const defaultThrottle = f => f;

const defaultSelect = () => ({});
const defaultSelectAll = state => state;
const defaultSelectOnceAll = (state, bundle) => ({
  ...(bundle.actions
    ? {
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

// TODO: Memoize select functions.

/**
 * Connect provided React component to the provided bundle.
 * @param {Object} thisBundle
 * @param {Object} options
 * @param {React.Component} component
 */
module.exports = function connect(
  thisBundle,
  {
    selectAll = false,
    select = selectAll ? defaultSelectAll : defaultSelect,
    selectOnce = selectAll ? defaultSelectOnceAll : defaultSelect,
    throttle = defaultThrottle,
  },
  component
) {
  // Second argument to select functions is different depending whether you
  // connect to combined bundle or not.
  //
  //   - For non-combined bundle, second argument is current bundle.
  //   - For combined bundle, second argument is mapping `key -> bundle` of
  //     combined bundles.
  //
  const selectSecondArg = thisBundle.bundles
    ? thisBundle.bundles.reduce((res, b) => ({ ...res, [b.key]: b }))
    : thisBundle;

  return class extends PureComponent {
    constructor(props) {
      super(props);

      this.staticProps = selectOnce(
        thisBundle.getState(),
        selectSecondArg,
        props
      );
      this.getDynamicProps = () =>
        select(thisBundle.getState(), selectSecondArg, this.props);

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
        Object.assign({}, this.props, this.staticProps, this._lastDynamicProps)
      );
    }
  };
};
