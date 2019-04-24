import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native'
import metrics, { scale } from '../theme/metrics'
import colors from '../theme/colors'
import DWTooltip from './tooltip'

const ICON = {
  LIGHT: require('../assets/media/icon-info-light3x.png'),
  DARK: require('../assets/media/icon-info-dark3x.png'),
}

type Props = {
  children?: React.Node,
  label: string,
  tooltipContainerStyle: TStyle,
  triangleOffset: number,
  style: TStyle,
  position: "top" | "bottom",
  lightIcon: Boolean,
}

export default class Tooltip extends Component<Props> {
  static propTypes = {
    label: PropTypes.string.isRequired,
    tooltipContainerStyle: PropTypes.any,
    triangleOffset: PropTypes.number,
    style: PropTypes.any,
    position: PropTypes.string,
    lightIcon: PropTypes.bool,
  }
  /**
   * @param {string} position - top/bottom
   * @param {boolean} lightIcon - Enable a light info icon, if omit the dark info icon will be use by default
   * @param {string} label - The text used inside tooltip
   */
  static defaultProps = {
    position: 'bottom',
    lightIcon: false,
  }

  constructor(props) {
    super(props)

    this.getTooltipSize = this.getTooltipSize.bind(this)
    this._setTooltipBelow = this._setTooltipBelow.bind(this)
  }

  /**
   * Calc max size of tooltip
   */
  getTooltipSize() {
    return metrics.screen.width
  }

  /**
   * @param {string} default - Default position are top
   * @param {boolean} false - Init tooltip in bottom
   * @param {boolean} true - Init tooltip in top
   */
  _setTooltipBelow() {
    const { position } = this.props
    return position === 'top' ? false : true
  }

  renderIconButton() {
    const { lightIcon } = this.props

    const icon = lightIcon ? ICON.LIGHT : ICON.DARK

    const iconButton = <Image source={icon} style={styles.lightIcon} />

    return iconButton
  }

  renderTooltipButton = () => {
    const { children } = this.props

    return (children != null) ? children : this.renderIconButton()
  }

  renderPopoverButton = () => {
    return (
      <TouchableOpacity
        onPress={event => {
          event.preventDefault()
          this.Tooltip.toggle()
        }}
        style={StyleSheet.buttonIcon}
      >
        <View style={styles.tooltipButtonContainer}>
          {this.renderTooltipButton()}
        </View>
      </TouchableOpacity>
    )
  }

  renderTooltipLabel = () => {
    const { label } = this.props

    return [
      {
        label,
        onPress: () => {},
      },
    ]
  }

  renderTooltipContainerStyle = () => {
    const { tooltipContainerStyle } = this.props
    return [
      {
        ...tooltipContainerStyle,
        maxWidth: this.getTooltipSize(),
        marginRight: scale(25),
      },
    ]
  }

  renderPopoverTooltip() {
    const { triangleOffset, contentStyle } = this.props
    return (
      <DWTooltip
        ref={ref => {
         this.Tooltip = ref
        }}
        buttonComponent={this.renderPopoverButton()}
        items={this.renderTooltipLabel()}
        triangleOffset={triangleOffset}
        tooltipContainerStyle={this.renderTooltipContainerStyle()}
        labelStyle={[ToolTipTextStyle, contentStyle]}
        setBelow={this._setTooltipBelow()}
        // labelContainerStyle require an object param, or will broken the component, can't pass {styles.CLASS}.
        labelContainerStyle={styles.labelContainerStyle}
        overlayStyle={styles.overlayStyle}
        onLayout={this.props.onLayout}
      />
    )
  }

  render() {
    const { style } = this.props
    return (
      <View style={[styles.tooltip, style]}>
        <View style={styles.tooltipView}>{this.renderPopoverTooltip()}</View>
      </View>
    )
  }
}

/**
 * These styles are used in/out the component Tooltip
 */
export const ToolTipTextStyle = {
  fontSize: scale(12),
  color: 'rgba(0, 0, 0, 0.54)',
}

const styles = StyleSheet.create({
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 0,
  },
  tooltipView: {

  },
  tooltipTitle: {
    color: colors.gray,
  },
  tooltipButtonContainer: {
    paddingLeft: scale(5),
    paddingRight: scale(5),
  },
  tooltipButton: {
    width: scale(12),
    height: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipButtonText: {
    color: colors.white,
  },
  lightIcon: {
    width: scale(12),
    height: scale(12),
  },
  buttonIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainerStyle: {
    padding: scale(16),
    borderRadius: scale(6),
    backgroundColor: colors.white,
  },
  overlayStyle: {
    backgroundColor: colors.transparent,
  },
})
