import Vue from 'vue';
import Counter from './components/counter.vue';

const mount = () => {
  const counterElement = document.getElementById('js-counter');
  console.log(counterElement)
  // eslint-disable-next-line no-new
  new Vue({
    el: counterElement,
    components: {
        Counter,
    },
    render(createElement) {
      return createElement('counter');
    },
  });
};

mount();

export default mount;
