/* eslint-env jest, jasmine */

jest.disableAutomock();
jest.mock('algoliasearch/lite.js', () => 'algoliasearch');
jest.mock('./icons/address.svg', () => 'address');
jest.mock('./icons/clear.svg', () => 'clear');
jest.mock('./icons/city.svg', () => 'city');
jest.mock('./icons/country.svg', () => 'country');
jest.mock('./icons/algolia.svg', () => 'algolia');
jest.mock('./icons/osm.svg', () => 'osm');
jest.mock('./places.scss', () => 'places.scss');
jest.mock('./createAutocompleteDataset', () => jest.fn(() => 'autocompleteDataset'));

import places from './places.js';
import errors from './errors.js';
import EventEmitter from 'events';
import createAutocompleteDataset from './createAutocompleteDataset.js';
import autocomplete from 'autocomplete.js';

describe('places', () => {
  beforeEach(() => document.querySelector('body').innerHTML = '');

  describe('container', () => {
    it('fails when container is made of multiple HTMLElements', () => {
      document.querySelector('body').appendChild(document.createElement('span'));
      document.querySelector('body').appendChild(document.createElement('span'));
      const container = document.querySelectorAll('span');
      expect(() => places({container})).toThrowError(errors.multiContainers);
    });

    it('fails when container is a css selector resoling to multiple elements', () => {
      document.querySelector('body').appendChild(document.createElement('span'));
      document.querySelector('body').appendChild(document.createElement('span'));
      const container = 'span';
      expect(() => places({container})).toThrowError(errors.multiContainers);
    });

    it('fails when container does not resolves to an HTMLInputElement', () => {
      document.querySelector('body').appendChild(document.createElement('span'));
      const container = 'span';
      expect(() => places({container})).toThrowError(errors.badContainer);
    });

    it('works when using document.querySelectorAll', () => {
      document.querySelector('body').appendChild(document.createElement('input'));
      const container = document.querySelectorAll('input');
      expect(() => places({container})).not.toThrow();
    });

    it('works when using a css selector', () => {
      document.querySelector('body').appendChild(document.createElement('input'));
      const container = 'input';
      expect(() => places({container})).not.toThrow();
    });
  });

  describe('dataset', () => {
    let args;
    let placesInstance;

    beforeEach(() => {
      createAutocompleteDataset.mockClear();
      document.querySelector('body').appendChild(document.createElement('input'));
      const container = document.querySelector('input');
      placesInstance = places({container, autocomplete: 'option'});
      args = createAutocompleteDataset.mock.calls[0][0];
    });

    it('creates an autocomplete dataset', () => expect(createAutocompleteDataset).toBeCalled());
    it('passes the algoliasearch client', () => expect(args.algoliasearch).toEqual('algoliasearch'));
    it('passes provided options', () => expect(args.autocomplete).toEqual('option'));

    it('triggers a suggestions event when onHits called', done => {
      placesInstance.once('suggestions', e => {
        expect(e).toEqual({suggestions: 'hits', rawAnswer: 'rawAnswer', query: 'query'});
        done();
      });

      args.onHits({hits: 'hits', rawAnswer: 'rawAnswer', query: 'query'});
    });

    it('triggers an error event when onError called', done => {
      placesInstance.once('error', e => {
        expect(e).toEqual('error');
        done();
      });

      args.onError('error');
    });

    it('triggers a limit event when onRateLimitReached called', done => {
      placesInstance.once('limit', e => {
        expect(e).toEqual({message: errors.rateLimitReached});
        done();
      });

      args.onRateLimitReached();
    });

    it('writes a message to console when nobody listening to the limit event', () => {
      const consoleLog = console.log;
      console.log = jest.fn();
      args.onRateLimitReached();
      expect(console.log).toBeCalledWith(errors.rateLimitReached);
      console.log = consoleLog;
    });
  });

  describe('autocomplete', () => {
    let args;
    let placesInstance;

    beforeEach(() => {
      autocomplete.mockClear();
      document.querySelector('body').appendChild(document.createElement('input'));
      const container = document.querySelector('input');
      placesInstance = places({container, autocomplete: 'option'});
      args = createAutocompleteDataset.mock.calls[0][0];
    });

    it('creates an autocomplete instance', () => {
      expect(autocomplete).toBeCalledWith(
        document.querySelector('input'), {
          autoselect: true,
          cssClasses: {prefix: 'ap', root: 'algolia-places'},
          debug: false,
          hint: false
        },
        'autocompleteDataset'
      );
    });

    it('triggers a change event on autocomplete:selected');
    it('triggers a change event on autocomplete:autocompleted');
    it('triggers a cursorchanged event on autocomplete:cursorchanged');
  });

  it('inserts the css file on top', () => {
    expect(document.querySelector('head > style').textContent).toEqual('places.scss');
  });

  it('returns an EventEmitter', () => {
    document.querySelector('body').appendChild(document.createElement('input'));
    const container = document.querySelector('input');
    expect(places({container}) instanceof EventEmitter).toEqual(true);
  });
});
