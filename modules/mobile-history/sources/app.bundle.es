/* global window */

import "node_modules/core-js/client/core.min.js"

import "specific/js/libs/ios-orientationchange-fix.js"
import "specific/js/jsAPI.js"
import osAPI from "specific/js/osAPI.js"

import utils from '../core/utils';
import config from '../core/config';

/* modules */
import core from '../core/index';
import cliqz from '../core-cliqz/index';
import dev from '../mobile-dev/index';
import history from '../mobile-history/index';
import window from '../platform/window';


const modules = new Map();

const loadModule = (name, module) => {
  return Promise.resolve(module.Background.init()).then(() => {
    const moduleWindow = new module.Window({ window });
    moduleWindow.init();
    modules.set(name, {
      background: module.Background,
      window: moduleWindow,
    });
  });
};

window.document.addEventListener('DOMContentLoaded', function () {
  loadModule('core', core).then(() => {
    return core.Background.providesServices.logos();
  }).then(() => {
    if (config.environment !== 'production') {
      return loadModule('dev', dev);
    } else {
      return Promise.resolve();
    }
  }).then(
    () => loadModule('cliqz', cliqz)
  ).then(
    () => loadModule('history', history)
  ).then(
    () => osAPI.init()
  ).then(
    () => modules.get('history').window.history.init(window.CLIQZ.mode)
  ).catch(e => console.error(e));
});
