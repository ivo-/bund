import { Component, createElement } from 'react';

const defaultSelect = state => state;
const defaultSelectOnce = (actions, selectors) => ({
  ...actions,
  ...selectors,
});
const defaultThrottle = f => f;

/**
 * Connect `React` component to `bund` bundle.
 * @prop {React.Component} component
 * @prop {Object} thisBundle
 * @prop {Object} options
 * @prop {Function} options.select
 * @prop {Function} options.selectOnce
 * @prop {Function} options.throttle
 */
export default function connect(
  component,
  thisBundle,
  {
    select = defaultSelect,
    selectOnce = defaultSelectOnce,
    throttle = defaultThrottle,
  } = {}
) {
  const selectArgs = thisBundle.bundles || [
    thisBundle.actions,
    thisBundle.selectors,
  ];
  const staticProps = selectOnce(thisBundle.getState(), ...selectArgs);
  const getDynamicProps = () => select(thisBundle.getState(), selectArgs);

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

        /* eslint-disable */
        if (thisBundle.key === 'users') console.log(
          'chaaaaaaaaaaaaannnnnnnnnngggggggggeeeeeeeee',
          action,
          // action[1],
          // thisBundle.key,
          // 'current',
          // thisBundle.getState(),
          // 'last',
          // this.lastState,
          // 'props',
          // getDynamicProps(),
        );

        this.forceUpdate();
      }
    }

    render() {
      const dynamicProps = getDynamicProps();
      this.lastDynamicProps = dynamicProps;
      const props = Object.assign({}, this.props, staticProps, dynamicProps);
      console.log('rerender', props);

      return createElement(
        component,
        props,
      );
    }
  };
}
