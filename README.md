# Tooltip component

This is a tooltip component compatible with te RN >= 0.51.0.

Enjoy it!


## <a name="section-getting-started"> Getting Started </a>


### Exemple 

<p align="center">
  <video src="video/tooltip.mov" alt="Exemple" width="200" height="400">
</p>


### Installing 
```
$ npm install --save react-native-dw-tooltip
```

### Props

| Name     | Type   | Required | Default value | Description                                                                                                                  |
| -------- | ------ | -------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| children              | `React.Node`        | `false` | -         | A component that will be rendered inside the `Tooltip`. |
| label                 | `String`            | `true`  | -         | A string that be message content. |
| lightIcon             | `Boolean`           | `false` | "false"   | Color for icon tip. |
| position              | `'top' or 'bottom'`  | `false` | "bottom"  | Position that tooltip will be render |
| tooltipContainerStyle | `TStyle`            | `false` | -         | Style of the container of the entire tooltip label. |
| triangleOffset        | `Number`            | `false` | 0         | Number of pixels to offset triangle from center. Positive numbers will push right. Negative Numbers will push left. |
| style                 | `TStyle`            | `false` | -         | Tooltip global container|


### Usage example

```js
  ...
  import Tooltip from 'react-native-dw-tooltip' 
  ...

  render() {
    ...

    return (
      <Tooltip
        ligthIcon
        label="ASijic sdi aos aosd e lopess deirmmaie weoae o
        aioermn ferrie ra sper psirnmci aeid einfie einfie a
        eifien ai ie ief ei aimeidmeif aimaed aiede aimd aev
        relax, this is just a exemple."
      />
    )
  ...
```

```js
  ...

  render() {
      ...

    return (
      <Tooltip
        position="top"
        label="The container width and height is variable by content"
      > 
        <Text> I Love Cheese </Text>
      </Tooltip>
    )
  ...
```
### License

MIT

### Contribution

PR are welcome!