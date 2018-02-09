import { Component, createElement } from 'react';

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

export default function connect(
  component,
  thisBundle,
  {
    selectAll = false,
    select = selectAll && defaultSelectAll,
    selectOnce = selectAll && defaultSelectOnceAll,
    throttle = defaultThrottle,
  } = {}
) {
  const selectArg = thisBundle.bundles
    ? thisBundle.bundles.reduce((res, b) => ({ ...res, [b.key]: b }))
    : thisBundle;

  const staticProps = selectOnce(thisBundle.getState(), selectArg);
  const getDynamicProps = () => select(thisBundle.getState(), selectArg);

  return class extends Component {
    constructor(props) {
      super(props);

      this.handleChange = this.handleChange.bind(this);

      this.lastState = thisBundle.getState();
      this.lastDynamicProps = null;

      this.unsubscribe = thisBundle.onChange(this.handleChange);
      this.scheduleUpdate = throttle(this.forceUpdate.bind(this));
    }

    componentWillUnMount() {
      this.unsubscribe();
    }

    handleChange(action, bundle) {
      const state = bundle.getState();
      if (
        this.lastState !== state ||
        this.lastDynamicProps !== getDynamicProps()
      ) {
        this.lastState = state;
        this.lastDynamicProps = getDynamicProps();

        this.scheduleUpdate();
      }
    }

    render() {
      const dynamicProps = getDynamicProps();
      const props = Object.assign({}, this.props, staticProps, dynamicProps);

      this.lastDynamicProps = dynamicProps;
      return createElement(
        component,
        props,
      );
    }
  };
}
