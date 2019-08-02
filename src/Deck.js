/*
 * Component Description
 */
import React from "react";
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  PanResponder,
  UIManager,
  View
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const DEFAULT_SWIPE_DURATION = 250;

export default class Deck extends React.Component {
  static defaultProps = {
    onSwipeLeft: () => {
      console.log(
        "Card was swipped Left, but no function was passed for this event."
      );
    },
    onSwipeRight: () => {
      console.log(
        "Card was swipped Right, but no function was passed for this event."
      );
    }
  };

  constructor(props) {
    super(props);

    const position = new Animated.ValueXY();
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true, // * Always allow responder
      onPanResponderMove: (event, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          this.forceCardOffScreen(true);
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          this.forceCardOffScreen(false);
        } else {
          this.resetPosition();
        }
      }
    });

    this.state = {
      curIdx: 0
    };

    this.position = position;
    this.panResponder = panResponder;
    this.forceCardOffScreen = this.forceCardOffScreen.bind(this);
    this.onSwipeComplete = this.onSwipeComplete.bind(this);
    this.getCardStyle = this.getCardStyle.bind(this);
    this.resetPosition = this.resetPosition.bind(this);
    this.renderCards = this.renderCards.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ curIdx: 0 });
    }
  }

  componentWillUpdate() {
    UIManager.setLayoutAnimationEnabledExperimental &&
      UIManager.setLayoutAnimationEnabledExperimental(true);

    LayoutAnimation.spring();
  }

  render() {
    return <View>{this.renderCards()}</View>;
  }

  renderCards() {
    if (this.state.curIdx >= (this.props.data || []).length) {
      return this.props.renderNoMoreCards();
    }

    return this.props.data
      .map((item, idx) => {
        if (idx === this.state.curIdx) {
          return (
            <Animated.View
              key={item.id}
              style={[this.getCardStyle(), styles.cardStyle]}
              {...this.panResponder.panHandlers}
            >
              {this.props.renderCard(item)}
            </Animated.View>
          );
        }

        if (idx < this.state.curIdx) {
          return null;
        }

        return (
          <Animated.View
            key={item.id}
            style={[styles.cardStyle, { top: 10 * (idx - this.state.curIdx) }]}
          >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      })
      .reverse();
  }

  getCardStyle() {
    const rotate = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.66, 0, SCREEN_WIDTH * 1.66],
      outputRange: ["-120deg", "0deg", "120deg"]
    });

    return {
      ...this.position.getLayout(),
      transform: [{ rotate }]
    };
  }

  onSwipeComplete(toRight) {
    const { data, onSwipeLeft, onSwipeRight } = this.props;
    const item = data[this.state.curIdx];

    toRight ? onSwipeRight(item) : onSwipeLeft(item);
    this.position.setValue({ x: 0, y: 0 });
    this.setState({ curIdx: this.state.curIdx + 1 });
  }

  forceCardOffScreen(toRight, specifiedDuration) {
    Animated.timing(this.position, {
      toValue: {
        x: toRight ? SCREEN_WIDTH : -SCREEN_WIDTH,
        y: 0
      },
      duration: specifiedDuration || DEFAULT_SWIPE_DURATION
    }).start(() => {
      this.onSwipeComplete(toRight);
    });
  }

  resetPosition() {
    Animated.spring(this.position, {
      toValue: {
        x: 0,
        y: 0
      }
    }).start();
  }
}

const styles = {
  cardStyle: {
    position: "absolute",
    width: SCREEN_WIDTH
  }
};
