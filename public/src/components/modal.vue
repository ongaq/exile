<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <slot name="header"></slot>
          </div>

          <div class="modal-body">
            <slot name="body"></slot>
          </div>

          <div class="modal-footer">
            <slot name="footer">
              <button class="modal-default-button button is-small" @click="$emit('close')">OK</button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'modal-template',
  data() {
    return {
      msg: '',
    };
  },
};
</script>

<style lang="scss">
$vue-color: #42b983;

.modal {
  &-mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, .5);
    display: table;
    transition: opacity .3s ease;
  }
  &-wrapper {
    display: table-cell;
    vertical-align: middle;
  }
  &-container {
    position: relative;
    width: 300px;
    margin: 0px auto;
    padding: 20px 30px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
    transition: all .3s ease;
    font-family: Helvetica, Arial, sans-serif;
  }
  &-header h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: $vue-color;
  }
  &-body {
    margin: 0;
    text-align: left;
    font-size: 12px;
  }
  &-default-button {
    float: right;
  }
  &-default-button + &-default-button {
    margin-right: 10px;
  }
  &-migiue-button {
    position: absolute;
    top: -4px;
    right: -4px;
    display: block;
    width: 20px;
    height: 20px;
    text-align: center;
    background-color: #333;
    border-radius: 10px;
    z-index: 9;

    button {
      position: relative;
      top: -1px;
      display: block;
      padding: 0;
      width: 20px;
      height: 20px;
      color: #fff;
      font-size: 14px;
      z-index: 10;
    }
  }
  &-enter,
  &-leave-active {
    opacity: 0;
  }
  &-enter &-container,
  &-leave-active &-container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
  }
  &-footer {
    margin-top: 10px;

    &:after {
      display: table;
      content: "";
      clear: both;
    }
  }
}
</style>
