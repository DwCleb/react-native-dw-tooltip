// @flow
//
// Modified from react-native-popover-tooltip
// https://github.com/wookoinc/react-native-popover-tooltip

import type {
  StyleObj,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes'

import * as React from 'react'
import {
  View,
  Modal,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Text,
  ViewPropTypes,
  Platform,
} from 'react-native'
import PropTypes from 'prop-types'
import invariant from 'invariant'

import TooltipItem, { type Label, labelPropType } from './tooltipItem'

import metrics,{ scale } from '../../theme/metrics'
import colors from '../../theme/colors'

type Props = {
  buttonComponent: React.Node,
  buttonComponentExpandRatio: number,
  buttonComponentModalOffset: number,
  items: $ReadOnlyArray<{ +label: Label, onPress: () => void }>,
  componentWrapperStyle?: StyleObj,
  overlayStyle?: StyleObj,
  tooltipContainerStyle?: StyleObj,
  tooltipContainerOffset: number,
  labelContainerStyle?: StyleObj,
  labelSeparatorColor: string,
  labelStyle?: StyleObj,
  setBelow: bool,
  animationType?: "timing" | "spring",
  onRequestClose: () => void,
  triangleOffset: number,
  delayLongPress: number,
  onOpenTooltipMenu?: () => void,
  onCloseTooltipMenu?: () => void,
  onPress?: () => void,
  componentContainerStyle?: StyleObj,
  timingConfig?: { duration?: number },
  springConfig?: { tension?: number, friction?: number },
  opacityChangeDuration?: number,
};

type State = {
  isModalOpen: bool,
  x: number,
  y: number,
  width: number,
  height: number,
  opacity: Animated.Value,
  tooltipContainerScale: Animated.Value,
  buttonComponentContainerScale: number | Animated.Interpolation,
  tooltipTriangleDown: bool,
  tooltipTriangleLeftMargin: number,
  triangleOffset: number,
  willPopUp: bool,
  oppositeOpacity: ?Animated.Interpolation,
  tooltipContainerX: ?Animated.Interpolation,
  tooltipContainerY: ?Animated.Interpolation,
  buttonComponentOpacity: number,
};
class DWTooltip extends React.PureComponent<Props, State> {
  static propTypes = {
    buttonComponent: PropTypes.node.isRequired,
    buttonComponentExpandRatio: PropTypes.number,
    buttonComponentModalOffset: PropTypes.number,
    items: PropTypes.arrayOf(PropTypes.shape({
      label: labelPropType.isRequired,
      onPress: PropTypes.func.isRequired,
    })).isRequired,
    componentWrapperStyle: ViewPropTypes.style,
    overlayStyle: ViewPropTypes.style,
    tooltipContainerStyle: ViewPropTypes.style,
    tooltipContainerOffset: PropTypes.number,
    labelContainerStyle: ViewPropTypes.style,
    labelSeparatorColor: PropTypes.string,
    labelStyle: Text.propTypes.style,
    setBelow: PropTypes.bool,
    animationType: PropTypes.oneOf(['timing', 'spring']),
    onRequestClose: PropTypes.func,
    triangleOffset: PropTypes.number,
    delayLongPress: PropTypes.number,
    onOpenTooltipMenu: PropTypes.func,
    onCloseTooltipMenu: PropTypes.func,
    onPress: PropTypes.func,
    componentContainerStyle: ViewPropTypes.style,
    timingConfig: PropTypes.object,
    springConfig: PropTypes.object,
    opacityChangeDuration: PropTypes.number,
  };

  static defaultProps = {
    buttonComponentExpandRatio: scale(1.0),
    buttonComponentModalOffset: 0,
    tooltipContainerOffset: 0,
    labelSeparatorColor: '#E1E1E1',
    onRequestClose: () => {},
    setBelow: false,
    delayLongPress: 100,
    triangleOffset: 0,
  };

  wrapperComponent: ?TouchableOpacity;

  constructor(props: Props) {
    super(props)
    this.state = {
      isModalOpen: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      opacity: new Animated.Value(0),
      tooltipContainerScale: new Animated.Value(0),
      buttonComponentContainerScale: 1,
      tooltipTriangleDown: !props.setBelow,
      tooltipTriangleLeftMargin: 0,
      triangleOffset: props.triangleOffset,
      willPopUp: false,
      oppositeOpacity: undefined,
      tooltipContainerX: undefined,
      tooltipContainerY: undefined,
      buttonComponentOpacity: 0,
    }
  }

  componentDidMount() {
    // Bind to opacity, the opposite of opacity
    // Used to achieve: gradually disappear as some things gradually appear
    const newOppositeOpacity = this.state.opacity.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    })
    this.setState({ oppositeOpacity: newOppositeOpacity })
  }

  toggleModal = () => {
    this.setState({ isModalOpen: !this.state.isModalOpen })
  }

  openModal = () => {
    this.setState({ willPopUp: true })
    this.toggleModal()
    this.props.onOpenTooltipMenu && this.props.onOpenTooltipMenu()
  }

  hideModal = () => {
    // Avoid redundant layout calculations
    this.setState({ willPopUp: false })
    this.showZoomingOutAnimation()
    this.props.onCloseTooltipMenu && this.props.onCloseTooltipMenu()
  }

  onPressItem = (userCallback: () => void) => {
    this.toggle()
    userCallback()
  }

  onInnerContainerLayout = (
    event: { nativeEvent: { layout: { height: number, width: number } } },
  ) => {
    // The width and height of the popup
    const tooltipContainerWidth = event.nativeEvent.layout.width
    const tooltipContainerHeight = event.nativeEvent.layout.height
    if (
      !this.state.willPopUp
      || tooltipContainerWidth === 0
      || tooltipContainerHeight === 0
    ) {
      return
    }

    const componentWrapper = this.wrapperComponent
    invariant(componentWrapper, 'should be set')
    // The position information of the view (buttonComponent) that triggered the popup
    componentWrapper.measure((x, y, width, height, pageX, pageY) => {
      console.log(`wrapper properties: (width: ${width}, height: ${height}, pX: ${pageX}, pY: ${pageY})`)
      // tooltip.maxX
      const fullWidth = pageX + tooltipContainerWidth
        + (width - tooltipContainerWidth) / 2
      const tooltipContainerXFinal = fullWidth > metrics.screen.width
        ? metrics.screen.width - tooltipContainerWidth // If there is a part that goes beyond the screen, then pull back a little bit, next to the edge of the screen
        : pageX + (width - tooltipContainerWidth) / 2 // Otherwise it will be displayed in our calculated position
        let { tooltipTriangleDown } = this.state
        
      const tooltipMargin = scale(2) // The spacing between the popup and the trigger view
      const tooltipMinY = pageY - tooltipContainerHeight - tooltipMargin // Popup above view
      const tooltipMaxY = pageY + height + tooltipMargin // Popup box under view
      // First press the desired parameter
      let tooltipContainerYFinal = tooltipTriangleDown ? tooltipMinY : tooltipMaxY
      // I want to put the popup above, but the space above is not enough.
      if (tooltipTriangleDown && tooltipMinY < 0) {
        tooltipContainerYFinal = tooltipMaxY
        tooltipTriangleDown = false

      // I want to put the popup below, but the height is beyond the screen.
      } else if (!tooltipTriangleDown && tooltipMaxY + tooltipContainerHeight > metrics.screen.height) {
        tooltipContainerYFinal = tooltipMinY
        tooltipTriangleDown = true
      }

      // Animating effects: no matter how scale changes, the abscissa remains unchanged
      const tooltipContainerX = this.state.tooltipContainerScale.interpolate({
        inputRange: [0, 1],
        outputRange: [tooltipContainerXFinal, tooltipContainerXFinal],
      })

      // Animating effect: As the popup box is enlarged, the ordinate of the pop-up box also changes, and the effect of popping up from the trigger view is achieved.
      const tooltipContainerY = this.state.tooltipContainerScale.interpolate({
        inputRange: [0, 1],
        outputRange: [
          tooltipTriangleDown ? pageY - height : pageY, // Realize the discovery that the animation will be more natural from the side that is farther away from the trigger view.
          tooltipContainerYFinal,
        ],
      })

      // This is a design parameter, and the original design is estimated to be like this:
      // Considering that the popup is modal (Modal), you can blur the background and highlight only the popup and trigger view to achieve a more pure visual effect.
      // Now that you want to move the trigger view onto the modal view, why not add some animation effects to optimize this conversion process?
      const buttonComponentContainerScale = this.state.tooltipContainerScale.interpolate({
        inputRange: [0, 1],
        outputRange: [1, this.props.buttonComponentExpandRatio],
      })

      // The distance from the small triangle to the left of the entire popup
      const tooltipTriangleLeftMargin = pageX + width / 2 - tooltipContainerXFinal - 10

      // Put all the calculated data into state and use it in render
      this.setState(
        {
          x: pageX,
          y: pageY,
          width,
          height,
          tooltipContainerX,
          tooltipContainerY,
          tooltipTriangleDown,
          tooltipTriangleLeftMargin,
          buttonComponentContainerScale,
          buttonComponentOpacity: 1, // The default value is 0, set to 1 after the calculation is complete. Implement the logic of the comment in render.
        },
        this.showZoomingInAnimation, // After the data is updated, the animation of the bullet box appears.
      )
    })
    this.setState({ willPopUp: false })
  }

  render() {
    // Build the style attribute of the popup
    const tooltipContainerStyle = {
      left: this.state.tooltipContainerX,
      top: this.state.tooltipContainerY,
      transform: [
        { scale: this.state.tooltipContainerScale },
      ],
    }

    // Convert the content to be displayed in the popup to TooltipItem
    const items = this.props.items.map((item, index) => {
      const classes = [this.props.labelContainerStyle]

      if (index !== this.props.items.length - 1) {
        classes.push([
          styles.tooltipMargin,
          { borderBottomColor: this.props.labelSeparatorColor },
        ])
      }

      return (
        <TooltipItem
          key={index}
          label={item.label}
          onPressUserCallback={item.onPress}
          onPress={this.onPressItem}
          containerStyle={classes}
          labelStyle={this.props.labelStyle}
        />
      )
    })

    // Let the color of the small triangle match the background color of the popup
    const { labelContainerStyle } = this.props
    const borderStyle = labelContainerStyle && labelContainerStyle.backgroundColor
      ? (
        // The small triangle is implemented by border, and the border used in different directions is different.
        this.state.tooltipTriangleDown 
        ? { borderTopColor: labelContainerStyle.backgroundColor } 
        : { borderBottomColor: labelContainerStyle.backgroundColor }
      ) : null
    let triangleDown = null
    let triangleUp = null
    if (this.state.tooltipTriangleDown) {
      triangleDown = (
        <View style={[
          styles.triangleDown,
          {
            marginLeft: this.state.tooltipTriangleLeftMargin,
            left: this.state.triangleOffset,
          },
          borderStyle,
        ]} />
      )
    } else {
      triangleUp = (
        <View style={[
          styles.triangleUp,
          {
            marginLeft: this.state.tooltipTriangleLeftMargin,
            left: this.state.triangleOffset,
          },
          borderStyle
        ]} />
      )
    }

    return (
      <TouchableOpacity
        ref={this.wrapperRef}
        style={this.props.componentWrapperStyle}
        onPress={this.props.onPress}
        onLongPress={this.toggle}
        delayLongPress={this.props.delayLongPress}
        activeOpacity={1.0}
      >
        <Animated.View style={[
          this.props.componentContainerStyle,
        ]}>
          {this.props.buttonComponent}
        </Animated.View>
        <Modal
          visible={this.state.isModalOpen}
          onRequestClose={this.props.onRequestClose}
          transparent
        >
          <Animated.View style={[
            styles.overlay,
            this.props.overlayStyle,
            { opacity: this.state.opacity },
          ]}>
            <TouchableOpacity
              activeOpacity={1}
              focusedOpacity={1}
              style={styles.button}
              onPress={this.toggle}
            >
              <Animated.View
                style={[
                  styles.tooltipContainer,
                  this.props.tooltipContainerStyle,
                  tooltipContainerStyle,
                ]}
              >
                <View
                  onLayout={this.onInnerContainerLayout}
                  style={styles.innerContainer}
                >
                  {triangleUp}
                  <View style={[
                    styles.allItemContainer,
                    this.props.tooltipContainerStyle,
                  ]}>
                    {items}
                  </View>
                  {triangleDown}
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
      </TouchableOpacity>
    )
  }

  wrapperRef = (wrapperComponent: ?TouchableOpacity) => {
    this.wrapperComponent = wrapperComponent
  }

  // Animation of the bullet box
  showZoomingInAnimation = () => {
    let tooltipAnimation = Animated.timing(
      this.state.tooltipContainerScale,
      {
        toValue: 1,
        duration: this.props.timingConfig && this.props.timingConfig.duration
          ? this.props.timingConfig.duration
          : 200,
      }
    )
    if (this.props.animationType === 'spring') {
      tooltipAnimation = Animated.spring(
        this.state.tooltipContainerScale,
        {
          toValue: 1,
          tension: this.props.springConfig && this.props.springConfig.tension
            ? this.props.springConfig.tension
            : 100,
          friction: this.props.springConfig && this.props.springConfig.friction
            ? this.props.springConfig.friction
            : 7,
        },
      )
    }
    Animated.parallel([
      tooltipAnimation,
      Animated.timing(
        this.state.opacity,
        {
          toValue: 1,
          duration: this.props.opacityChangeDuration
            ? this.props.opacityChangeDuration
            : 200,
        },
      ),
    ]).start()
  }

  // Bullet box disappearing animation
  showZoomingOutAnimation() {
    Animated.parallel([
      Animated.timing(
        this.state.tooltipContainerScale,
        {
          toValue: 0,
          duration: this.props.opacityChangeDuration
            ? this.props.opacityChangeDuration
            : 200,
        },
      ),
      Animated.timing(
        this.state.opacity,
        {
          toValue: 0,
          duration: this.props.opacityChangeDuration
            ? this.props.opacityChangeDuration
            : 200,
        },
      ),
    ]).start(this.toggleModal)
  }

  toggle = () => {
    if (this.state.isModalOpen) {
      this.hideModal()
    } else {
      this.openModal()
    }
  }
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.transparent,
    flex: 1,
  },
  innerContainer: {
    backgroundColor: colors.transparent,
    alignItems: 'flex-start'
  },
  tooltipMargin: {
    borderBottomWidth: scale(1),
  },
  tooltipContainer: {
    backgroundColor: colors.transparent,
    position: 'absolute',
    marginTop: Platform.OS === 'ios' ? 0 : scale(-25), // Apply specific Android Style
  },
  triangleDown: {
    width: scale(10),
    height: scale(10),
    backgroundColor: colors.transparent,
    borderStyle: 'solid',
    borderTopWidth: scale(10),
    borderRightWidth: scale(10),
    borderBottomWidth: 0,
    borderLeftWidth: scale(10),
    borderTopColor: colors.white,
    borderRightColor: colors.transparent,
    borderBottomColor: colors.transparent,
    borderLeftColor: colors.transparent,
  },
  triangleUp: {
    width: scale(10),
    height: scale(10),
    backgroundColor: colors.transparent,
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: scale(10),
    borderBottomWidth: scale(10),
    borderLeftWidth: scale(10),
    borderBottomColor: colors.white,
    borderTopColor: colors.transparent,
    borderRightColor: colors.transparent,
    borderLeftColor: colors.transparent,
  },
  button: {
    flex: 1,
  },
  allItemContainer: {
    borderRadius: scale(5),
    backgroundColor: colors.white,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  absoluteAnimatedView: {
    position: 'absolute',
    backgroundColor: colors.transparent,
  },
})

export default DWTooltip
