/* eslint-env jest */

let autocomplete = jest.fn(() => {
  document.querySelector('input').classList.add('ap-input');
  const instance = {
    on: jest.fn(),
    focus: jest.fn()
  };
  autocomplete.__instance = instance;
  return instance;
});

export default autocomplete;
