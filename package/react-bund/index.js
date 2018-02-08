import React from 'react';

const defaultSelect = state => state;
const defaultSelectOnce = (actions, selectors) => ({
  ...actions,
  ...selectors,
});
const defaultThrottle = f => f;

export default function connect(
  component,
  thisBundle,
  {
    select = defaultSelect,
    selectOnce = defaultSelectOnce,
    throttle = defaultThrottle,
  }
) {
  const actions =
    thisBundle.actions ||
    thisBundle.bundles.reduce(
      (res, b) => ({
        ...res,
        [b.key]: b.actions,
      }),
      {}
    );
  const selectors =
    thisBundle.selectors ||
    thisBundle.bundles.reduce(
      (res, b) => ({
        ...res,
        [b.key]: b.selectors,
      }),
      {}
    );
  const staticProps = selectOnce(thisBundle.getState(), actions, selectors);

  // TODO: implement real throttle and shouldComponentUpdate
  return class extends React.Component {
    componentWillMount() {
      const update = throttle(this.forceUpdate.bind(this));
      this.unsubscribe = thisBundle.onChange(update);
    }

    componentWillUnMount() {
      this.unsubscribe();
    }

    render() {
      return (
        <Component
          {...this.props}
          {...staticProps}
          {...select(thisBundle.getState(), actions, selectors)}
        />
      );
    }
  };
}
