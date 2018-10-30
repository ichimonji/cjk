/* eslint camelcase: 0, one-var: 0, no-extend-native: 0, no-console: 0 */

import Cjk from './cjk';

console.json = json => console.log(JSON.stringify(json, null, '  '));

const cjk = new Cjk({ output: 'pinyin', valueType: 'string' });

const
  el_ipt = document.getElementById('input'),
  el_opt = document.getElementById('output'),
  rd_ipt = document.getElementsByName('inputType'),
  rd_opt = document.getElementsByName('outputType'),
  cb_jlt = document.getElementsByName('jsonList'),
  rd_vlt = document.getElementsByName('valueType'),
  rd_dlm = document.getElementsByName('delimiter'),
  rd_dvr = document.getElementsByName('divider'),
  rd_spr = document.getElementsByName('separator'),
  bt_cnv = document.getElementById('convert'),
  bx_jlt = document.querySelector('.checkList--json'),
  rd_thg = document.getElementsByName('through'),
  reset = document.getElementById('reset'),
  thArr = {
    through: '',
    notThrough: false,
    original: 'original',
  };

Object.prototype.checkVal = function checkVal() {
  let result = Array.prototype.filter.call(
    this,
    elm => elm.checked,
  );
  if (this.item(0).type === 'radio') {
    result = result[0].value || result.item(0).value;
  } else if (this.item(0).type === 'checkbox') {
    result = result.map(elm => elm.value);
  }
  return result;
};

Object.prototype.addEventListenerMulti = function addEventListenerMulti(events, callback) {
  const target = (/(NodeList|HTMLCollection)/).test(Object.prototype.toString.call(this)) ? this : [this];
  events.split(' ').forEach(event => {
    Array.prototype.forEach.call(
      target,
      elm => elm.addEventListener(event, ev => callback(ev)),
    );
  });
};

const
  jsonListChange = () => {
    let jls_arr = cb_jlt.checkVal().map(val => val.replace('jlt_', ''));
    jls_arr = jls_arr.length ? jls_arr : 'all';
    cjk.option({ jsonList: jls_arr });
  },
  converter = () => {
    el_opt.innerHTML = 'conveting...';
    const
      iptType = rd_ipt.checkVal().replace('ipt_', ''),
      optType = rd_opt.checkVal().replace('opt_', '');
    let
      ipt = el_ipt.value;
    if ((/(dec|hex|pinyin|pinyin2|zhuyin|zhuyin2)/g).test(iptType)) {
      ipt = ipt.split(',');
    }
    let res = '';
    if (optType === 'json') {
      jsonListChange();
    }
    cjk.option({
      input: iptType,
      output: optType,
      valueType: rd_vlt.checkVal().replace('value_', ''),
      delimiter: rd_dlm.checkVal(),
      separator: rd_spr.checkVal(),
      divider: rd_dvr.checkVal(),
      through: thArr[rd_thg.checkVal()],
    });

    if (ipt !== '') {
      res = cjk.from(ipt);
      if (optType === 'json') {
        res = `<pre>${JSON.stringify(res, null, 2)}</pre>`;
      }
      el_opt.innerHTML = res;
    } else {
      el_opt.innerHTML = '';
    }
  },
  jsonListDisplay = () => {
    if (rd_opt.checkVal() === 'opt_json') {
      bx_jlt.classList.remove('hidden');
    } else {
      bx_jlt.classList.add('hidden');
    }
  },
  resetter = () => {
    el_opt.innerHTML = '';
  };

reset.addEventListener('click', resetter);
bt_cnv.addEventListener('click', converter);
rd_opt.addEventListenerMulti('change', jsonListDisplay);
jsonListDisplay();