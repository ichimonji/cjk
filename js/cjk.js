/* eslint one-var: 0 */

import _ from 'lodash';
import cjkPinyin from './json/pinyin.json';
import cjkPron from './json/pron.json';
import cjkTone from './json/tone.json';
import cjkZhuyin from './json/zhuyin.json';

const hanRange = [
  '\u2E80-\u2E99',
  '\u2E9B-\u2EF3',
  '\u2F00-\u2FD5',
  '\u3400-\u4DB5',
  '\u4E00-\u9FEF',
  '\uF900-\uFA6D',
  '\uFA70-\uFAD9',
  '\uFE45-\uFE46',
  '\uFF61-\uFF65',
  // '\u{1D360}-\u{1D371}',
  // '\u{1F250}-\u{1F251}',
  // '\u{20000}-\u{2A6D6}',
  // '\u{2A700}-\u{2B734}',
  // '\u{2B740}-\u{2B81D}',
  // '\u{2B820}-\u{2CEA1}',
  // '\u{2CEB0}-\u{2EBE0}',
  // '\u{2F800}-\u{2FA1D}',
].join('');

/*
  setting options
    input: input type
      json(default), dec, pinyin, string, pinyin
    output: output type
      json, dec, hex, entity, pinyin, pinyin2, spell, tone, zhuyin, zhuyin2
    valueType: value type (only output json)
      json, string
    delimiter: for multiple value
      '/'(default)
      Ex. ',', '-' or ''...
    separator: for multiple value
      '[]'(default)
      Ex. '()', '{}' or ''...
    divider: for multiple hypotheses
      ','(default)
      Ex. '-', '/' or ''...
    superDivider: for multiple hypotheses of parents
      '\n'(default)
    jsonList:
      (only output json) Keys to include in json
      dec, hex, entity, pinyin, pinyin2, spell, tone, zhuyin, zhuyin2
    through:
      (other than output json) Processing when ignoring errors
      false (output error message)
      '' (ignore errors and do not output anything)
      'original' (Ignore the error and output the original search character)
*/

export default class {
  constructor(option = {}) {
    // option merge
    const defaultOption = {
      input: 'json',
      output: 'json',
      valueType: 'json',
      delimiter: '/',
      separator: '[]',
      divider: ',',
      superDivider: '\n',
      jsonList: [],
      through: 'original',
    };
    this.defaultJsonList = {
      dec: 1,
      hex: 1,
      entity: 1,
      pinyin: 1,
      pinyin2: 1,
      spell: 1,
      tone: 1,
      zhuyin: 1,
      zhuyin2: 1,
    };

    // extend option
    Object.assign(this, defaultOption, option);
    this.adjustState();

    // other var
    this.inputValue = '';
    this.isSingleline = true;
    this.isMultiline = false;
    this.isMultiResult = false;

    this.han = new RegExp(`[${hanRange}]`, 'i');
    this.cjkChar = cjkPron.map(r => r[0]).filter((x, i, self) => self.indexOf(x) === i);
  }

  // private
  adjustState() {
    // adjust separater
    if (this.separator === '') {
      this.separator = ['', ''];
    } else if (!Array.isArray(this.separator)) {
      this.separator = this.separator.split('');
    }
    this.json = this.defaultJsonList;

    // outputfilter
    if (this.output !== 'json') {
      Array.prototype.forEach.call(
        Object.keys(this.json),
        key => {
          this.json[key] = 0;
        }
      );
      this.json[this.output] = 1;
    } else if (this.jsonList === 'all') {
      Array.prototype.forEach.call(
        Object.keys(this.json),
        key => {
          this.json[key] = 1;
        }
      );
    } else if (this.jsonList.length !== 0) {
      Array.prototype.forEach.call(
        Object.keys(this.json),
        key => {
          if (this.jsonList.indexOf(key) === -1) {
            this.json[key] = 0;
          } else {
            this.json[key] = 1;
          }
        }
      );
    }
    this.jsonSwitch = parseInt(_.values(this.json).join(''), 2);
    return this;
  }

  setState(val, tp) {
    this.inputValue = val;
    this.inputType = tp;
    if (val.length > 1) {
      this.isSingleline = false;
      this.isMultiline = true;
    }
    return this;
  }

  formatter(r) {
    if (!Array.isArray(r)) {
      return r;
    } else if (r.length === 1) {
      return r[0];
    } else if (r.length > 1) {
      if (this.valueType === 'string' || this.output !== 'json') {
        return this.separator.join(r.join(this.delimiter));
      }
      return r;
    }
    return this.error();
  }

  combiner(r, divider) {
    if (!Array.isArray(r)) {
      return r;
    } else if (r.length === 1) {
      return r[0];
    } else if (r.length > 1) {
      if (this.output !== 'json') {
        return r.join(divider);
      }
      return r;
    }
    return this.error();
  }

  option(opt) {
    Object.assign(this, opt);
    this.adjustState();
  }

  from(search, fromType = this.input) {
    this.setState(search, fromType);
    let innerType = fromType;
    if (fromType === 'pinyin2') {
      innerType = 'pinyin';
      search = search.map(val => {
        let instNum = val.replace(/[^\d]/g, '');
        let instSpell = val.replace(/[\d]/g, '');
        instNum = (instNum.length) ? parseInt(instNum, 10) : 0;
        let instArr = Object.keys(cjkPinyin).filter(r => {
          return cjkPinyin[r][0] === instSpell && cjkPinyin[r][1] === instNum;
        });
        return instArr[0];
      });
    } else if (innerType === 'zhuyin2') {
      innerType = 'pinyin';
      let zhSpell, zhTone;
      if (!(/([ˊˇˋ])/g).test(search)) {
        search = search.map(val => {
          zhSpell = Object.keys(cjkZhuyin).filter(key => cjkZhuyin[key] === val)[0];
          return [[zhSpell, 0], [zhSpell, 1]];
        });
      } else {
        search = search.map(val => {
          return val.replace(/^(.*?)([ˊˇˋ])$/g, (r, r1, r2) => {
            zhSpell = Object.keys(cjkZhuyin).filter(key => cjkZhuyin[key] === r1)[0];
            zhTone = Object.keys(cjkTone).filter(key => cjkTone[key] === r2)[0];
            return `${zhSpell},${zhTone}`;
          }).split(',');
        });
      }
      search = search.map(
        s => Object.keys(cjkPinyin).filter(key => cjkPinyin[key].join('') === s.join(''))[0]
      );
    } else if (innerType === 'zhuyin') {
      let zhSpell, zhTone;
      innerType = 'pinyin';
      search = search.map(val => {
        zhSpell = Object.keys(cjkZhuyin).filter(key => cjkZhuyin[key] === val)[0];
        return Object.keys(cjkPinyin).filter(key => cjkPinyin[key][0] === zhSpell);
      });
      if (search.length === 1) {
        [search] = search;
      }
      if (search.length > 1) {
        this.isSingleline = false;
        this.isMultiline = true;
      }
    } else if (innerType === 'spell') {
      innerType = 'pinyin';
      console.log(search);
      search = Object.keys(cjkPinyin).filter(key => cjkPinyin[key][0] === search);
      console.log(search);
      if (search.length === 1) {
        [search] = search;
      }
      if (search.length > 1) {
        this.isSingleline = false;
        this.isMultiline = true;
      }
    }

    let funcTo = false;
    if (innerType === 'dec') {
      if (this.isSingleline) {
        funcTo = this.outputter(search[0]);
      } else if (this.isMultiline) {
        funcTo = this.multiOutput(search);
      }
    } else if (innerType === 'hex') {
      if (this.isSingleline) {
        funcTo = this.outputter(parseInt(search[0], 16));
      } else if (this.isMultiline) {
        funcTo = this.multiOutput(search.map(r => parseInt(r, 16)));
      }
    } else if (innerType === 'string') {
      if (this.isSingleline) {
        funcTo = this.outputter(search.charCodeAt());
      } else if (this.isMultiline) {
        funcTo = this.multiOutput(search.split('').map(r => r.charCodeAt()));
      }
    } else if (innerType === 'pinyin') {
      if (this.isSingleline) {
        const arrPyin = cjkPron.filter(set => search[0] === set[1]).map(set => set[0]);
        funcTo = this.multiOutput(arrPyin);
      } else if (this.isMultiline) {
        const arrPyin2 = search.map(r => cjkPron.filter(set => r === set[1]).map(set => set[0]));
        funcTo = this.multi2Output(arrPyin2);
      }
    }
    return funcTo || this.error('multi', this.inputValue);
  }

  multi2Output(arr) {
    this.isMultiResult = true;
    const arrOn = arr.map(r => this.multiOutput(r));
    return this.combiner(arrOn, this.superDivider);
  }

  multiOutput(decs) {
    const decOn = decs.map(r => this.outputter(r));
    return this.combiner(decOn, this.divider);
  }

  error(type = 'default', target = '') {
    let msg = {};
    if (this.output !== 'json') {
      if (this.through === '') {
        return ''
      } else if (this.through === 'original') {
        if (this.inputType === 'string') {
          return target.eintity;
        } else {
          return target[this.inputType];
        }
      }
    }
    switch (type) {
      case 'outRange':
        msg = {
          value: target,
          error: 'rangeError',
          text: `'${target}' is not hanzi.`,
        };
        break;
      case 'notFind':
        msg = {
          value: target,
          error: 'unregistred',
          text: `'${target}' is not not registered.`,
        };
        break;
      default:
        msg = {
          value: target,
          error: 'unexpected',
          text: 'an unexpected error.',
        };
        break;
    }
    if (this.output !== 'json') {
      return msg.text;
    }
    return msg;
  }

  outputter(dec) {
    dec = dec.toString(10);

    let
      arrPyin = [],
      arrSpell = [],
      arrTone = [],
      arrZyin = [],
      opt = {};

    const
      entity = String.fromCharCode(dec);

    if (!this.han.test(entity)) return this.error('outRange', (entity || dec));
    else if (this.cjkChar.indexOf(dec) === -1) return this.error('notFind', (entity ||dec));

    /*
      bitSwitch
      0b111111111
      | dec | hex | ent | pyi | py2 | spe | ton | zyi | zy2 |
      |   1 |   1 |   1 |   1 |   1 |   1 |   1 |   1 |   1 |
      | 256 | 128 |  64 |  32 |  16 |   8 |   4 |   2 |   1 |
    */
    /* eslint-disable no-bitwise */
    if (this.jsonSwitch & 0b100000000) {
      opt.dec = dec;
    }
    if (this.jsonSwitch & 0b010000000) {
      opt.hex = parseInt(dec, 10).toString(16);
    }
    if (this.jsonSwitch & 0b001000000) {
      opt.entity = entity;
    }
    if (this.jsonSwitch & 0b000111111) {
      arrPyin = cjkPron.filter(set => dec.toString(10) === set[0]).map(set => set[1]);
    }
    if (this.jsonSwitch & 0b000100000) {
      opt.pinyin = this.formatter(arrPyin);
    }
    if (this.jsonSwitch & 0b000011011) {
      arrSpell = arrPyin.map(pyin => cjkPinyin[pyin][0]);
    }
    if (this.jsonSwitch & 0b000010101) {
      arrTone = arrPyin.map(pyin => cjkPinyin[pyin][1]);
    }
    if (this.jsonSwitch & 0b000010000) {
      opt.pinyin2 = this.formatter(arrSpell.map((item, index) => item + arrTone[index]));
    }
    if (this.jsonSwitch & 0b000001000) {
      opt.spell = this.formatter(arrSpell);
    }
    if (this.jsonSwitch & 0b000000100) {
      opt.tone = this.formatter(arrTone);
    }
    if (this.jsonSwitch & 0b000000011) {
      arrZyin = arrSpell.map(pyin => cjkZhuyin[pyin]);
    }
    if (this.jsonSwitch & 0b000000010) {
      opt.zhuyin = this.formatter(arrZyin);
    }
    if (this.jsonSwitch & 0b000000001) {
      opt.zhuyin2 = this.formatter(arrZyin.map((zyin, index) => zyin + cjkTone[arrTone[index]]));
    }


    if (Object.keys(opt).length === 1) [opt] = _.values(opt);

    if (!opt) return this.error('single', opt);

    return opt;
  }
};
