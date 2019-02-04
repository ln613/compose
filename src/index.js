import { find, isNil, isEmpty, view, lensPath, reduce, max, equals } from 'ramda';
import { compose, lifecycle, withProps, withHandlers, withState as _withState } from 'recompose';

const firstLetterToUpper = str => str[0].toUpperCase() + str.slice(1);
const toLensPath = s => s.replace(/\[/g, '.').replace(/\]/g, '').split('.');
const viewLens = (s, o) => view(lensPath(toLensPath(s)), o);

export const withParams = withProps(props => ({ ...props.match.params }));

export const withState = (prop, val) =>
  _withState(prop, 'set' + firstLetterToUpper(prop), val);

export const withMount = f => lifecycle({
  componentDidMount() {
    f(this.props);
  }
});

export const withLoad = (prop, key, field, force) => lifecycle({
  componentWillMount() {
    (force || isEmpty(this.props[prop])) && this.props['get' + firstLetterToUpper(prop)]({ [key || 'id']: this.props[field || 'id'] });
  }
});
export const withLoadForce = (prop, key, field) => withLoad(prop, key, field, true);
export const withLoadBy = (prop, key, force) => withLoad(prop, key, key, force);
export const withLoadForceBy = (prop, key) => withLoad(prop, key, key, true);

const _withEdit = (p, prop, path, initObj) => {
  const id = (initObj && p[initObj.id]) || +p.match.params.id;
  const list = toLensPath(path || (prop + 's'));
  const v = find(x => x.id == id, view(lensPath(list), p) || []);
  p.setForm(v || { ...(initObj || {}), id }, { path: prop });
};

export const withEdit = (prop, path, initObj) => withNewValue((path && path.split('.')[0]) || (prop + 's'), null, p => _withEdit(p, prop, path, initObj));
export const withEditForce = (prop, path, initObj) => withHasValue((path && path.split('.')[0]) || (prop + 's'), p => _withEdit(p, prop, path, initObj));

export const withEditList = prop => lifecycle({
  componentWillMount() {
    const list = toLensPath(prop);
    const v = view(lensPath(list), this.props);
    this.props.setForm(v, { path: list });
  }
});

// triggered when a prop has a new value in the store. if no "val" provided, compared with old value
export const withNewValue = (prop, val, cb) => lifecycle({
  componentWillReceiveProps(newProps) {
    const newValue = newProps[prop];
    const oldValue = this.props[prop];
    if (isNil(val) ? !equals(newValue, oldValue) : (equals(newValue, val) && !equals(oldValue, val)))
      cb(newProps, newValue);
  }
});

export const withHasValue = (prop, cb) => lifecycle({
  componentWillReceiveProps(newProps) {
    if (!isNil(newProps[prop]) && isNil(this.props[prop]))
      cb(newProps, newValue);
  }
});

export const withNewId = path => withProps(prop => ({ newId: reduce(max, 0, (viewLens(path, prop) || []).map(x => +x.id)) + 1 }));

const getEl = id => id ? document.getElementById(id) : window;
const getListenerName = (event, id) => `${event}_${id || 'window'}_listener`;

export const withListener = (event, f, id) => compose(
  withHandlers({ [getListenerName(event, id)]: p => e => f(p, e) }),
  lifecycle({
    componentDidMount() {
      getEl(id).addEventListener(event, this.props[getListenerName(event, id)]);
    },

    componentWillUnmount() {
      getEl(id).removeEventListener(event, this.props[getListenerName(event, id)]);
    }
  })
)  

export const withKey = f => withListener('keydown', (p, e) => f(p, e.key, e.keyCode));

export const multiLang = prop => lang => obj => obj[prop + '_' + lang] || obj[prop];
export const multiLangName = multiLang('name');
export const multiLangDesc = multiLang('desc');
export const withLang = withProps(props => ({ n: multiLangName(props.lang), d: multiLangDesc(props.lang) }));
