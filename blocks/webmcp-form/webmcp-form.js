/*
 * webmcp-form block: renders an Adaptive Form with the official af-core runtime and exposes it to
 * in-browser AI agents through the official af-webmcp adapter (@aemforms/* 1.0.9, vendored).
 * The DOM and the WebMCP tools drive the same model, so agents can use either path.
 */
import {
  createFormInstance, registerFormWebMCP, Submit, AddInstance, RemoveInstance,
} from './vendor/af-webmcp.bundle.min.js';
import definition, { SUBMIT_ENDPOINT } from './form-definition.js';
import {
  initTracking, trackingModelContext, nativeModelContext, markSubmitVia, reportSubmitOutcome,
} from './tracking.js';

const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  children.flat().forEach((child) => child && node.append(child));
  return node;
};

const labelText = (field) => field.label?.value || field.name;

// af-core moves a repeatable panel's label, description and maxOccur onto its instances,
// so read them from the authored definition (they must stay visible when there are 0 instances).
function authoredRepeatables(definitionNode, out = new Map()) {
  (definitionNode.items || []).forEach((item) => {
    if (item.repeatable) out.set(item.name, item);
    authoredRepeatables(item, out);
  });
  return out;
}

function createRenderer(form, root, definitionRoot) {
  const repeatables = authoredRepeatables(definitionRoot);
  const bindings = new Map(); // field id -> { field, input, error, kind }

  const toModel = (field, kind, input) => {
    if (kind === 'checkbox-group') {
      const values = [...input.querySelectorAll('input:checked')].map((box) => box.value);
      return values.length ? values : null;
    }
    if (kind === 'checkbox') return input.checked ? true : null;
    if (input.value === '') return null;
    if (kind === 'number-input') return Number(input.value);
    return input.value;
  };

  const toView = (binding) => {
    const { field, input, kind } = binding;
    const { value } = field;
    if (kind === 'checkbox-group') {
      const selected = Array.isArray(value) ? value.map(String) : [];
      input.querySelectorAll('input').forEach((box) => { box.checked = selected.includes(box.value); });
    } else if (kind === 'checkbox') {
      input.checked = value === true;
    } else if (kind === 'drop-down') {
      const text = value === null || value === undefined ? '' : String(value);
      // Keep an invalid value visible (e.g. an agent wrote a label instead of an option value).
      if (text && ![...input.options].some((o) => o.value === text)) {
        input.append(el('option', { value: text, 'data-invalid': true, text: `${text} (not an option)` }));
      }
      input.value = text;
    } else if (document.activeElement !== input || input.readOnly) {
      input.value = value === null || value === undefined ? '' : String(value);
    }
  };

  const showError = (binding) => {
    const message = binding.field.errorMessage || '';
    binding.error.textContent = message;
    if (message) binding.input.setAttribute('aria-invalid', 'true');
    else binding.input.removeAttribute('aria-invalid');
  };

  const renderField = (field) => {
    const kind = field.fieldType;
    const id = `wf-${field.id}`;
    const errorId = `${id}-error`;
    const helpId = `${id}-help`;
    const describedBy = [field.description ? helpId : null, errorId].filter(Boolean).join(' ');
    const common = {
      id, name: field.qualifiedName, 'aria-describedby': describedBy, required: field.required,
    };
    let input;
    let wrapper;

    if (kind === 'checkbox-group') {
      input = el('div', { class: 'wf-options', id, role: 'group' });
      (field.enum || []).forEach((value, i) => {
        const boxId = `${id}-${i}`;
        input.append(el(
          'div',
          { class: 'wf-option' },
          el('input', {
            type: 'checkbox', id: boxId, name: field.qualifiedName, value: String(value),
          }),
          el('label', { for: boxId, text: field.enumNames?.[i] ?? String(value) }),
        ));
      });
      wrapper = el(
        'fieldset',
        { class: `wf-field wf-${kind}`, 'aria-describedby': describedBy },
        el('legend', { text: labelText(field) }),
        input,
      );
    } else if (kind === 'checkbox') {
      input = el('input', { ...common, type: 'checkbox', value: 'true' });
      wrapper = el(
        'div',
        { class: `wf-field wf-${kind}` },
        input,
        el('label', { for: id, text: labelText(field) }),
      );
    } else {
      if (kind === 'drop-down') {
        input = el(
          'select',
          common,
          el('option', { value: '', text: 'Select…' }),
          (field.enum || []).map((value, i) => el('option', {
            value: String(value), text: field.enumNames?.[i] ?? String(value),
          })),
        );
      } else if (kind === 'multiline-input') {
        input = el('textarea', { ...common, rows: 3, maxlength: field.maxLength });
      } else {
        const type = {
          email: 'email', 'date-input': 'date', 'number-input': 'number',
        }[kind] || 'text';
        input = el('input', {
          ...common,
          type,
          min: field.minimum,
          max: field.maximum,
          step: field.type === 'integer' ? 1 : undefined,
          readonly: field.readOnly,
          autocomplete: { firstName: 'given-name', lastName: 'family-name', email: 'email' }[field.name],
        });
      }
      wrapper = el(
        'div',
        { class: `wf-field wf-${kind}` },
        el('label', { for: id, text: `${labelText(field)}${field.required ? ' *' : ''}` }),
        input,
      );
    }
    if (field.description) wrapper.append(el('p', { class: 'wf-help', id: helpId, text: field.description }));
    const error = el('p', { class: 'wf-error', id: errorId, 'aria-live': 'polite' });
    wrapper.append(error);

    const binding = {
      field, input, error, kind,
    };
    bindings.set(field.id, binding);
    if (!field.readOnly) {
      input.addEventListener('change', () => { field.value = toModel(field, kind, input); });
      if (kind !== 'checkbox' && kind !== 'checkbox-group' && kind !== 'drop-down') {
        input.addEventListener('input', () => { field.value = toModel(field, kind, input); });
      }
    }
    toView(binding);
    return wrapper;
  };

  const renderRepeatable = (panel) => {
    const authored = repeatables.get(panel.name) || {};
    const title = authored.label?.value || labelText(panel);
    const instances = el('div', { class: 'wf-instances' });
    const addButton = el('button', { type: 'button', class: 'button secondary', text: 'Add a traveller' });
    const fieldset = el(
      'fieldset',
      { class: 'wf-repeatable', id: `wf-${panel.id}` },
      el('legend', { text: title }),
      authored.description ? el('p', { class: 'wf-help', text: authored.description }) : null,
      instances,
      addButton,
    );
    const draw = () => {
      instances.replaceChildren();
      panel.items.forEach((instance, index) => {
        const removeButton = el('button', { type: 'button', class: 'button secondary', text: `Remove traveller ${index + 1}` });
        removeButton.addEventListener('click', () => panel.removeItem(new RemoveInstance(index)));
        instances.append(el(
          'div',
          { class: 'wf-instance', id: `wf-${instance.id}` },
          el('p', { class: 'wf-instance-title', text: `Traveller ${index + 1}` }),
          // eslint-disable-next-line no-use-before-define
          instance.items.map(renderNode),
          removeButton,
        ));
      });
      const { maxOccur } = authored;
      const atMax = Number.isInteger(maxOccur) && maxOccur >= 0 && panel.items.length >= maxOccur;
      addButton.disabled = atMax;
    };
    addButton.addEventListener('click', () => panel.addItem(new AddInstance()));
    bindings.set(panel.id, { field: panel, kind: 'repeatable', redraw: draw });
    draw();
    return fieldset;
  };

  function renderNode(node) {
    if (node.isContainer) {
      if (node.type === 'array') return renderRepeatable(node);
      return el(
        'fieldset',
        { class: 'wf-panel', id: `wf-${node.id}` },
        el('legend', { text: labelText(node) }),
        node.items.map(renderNode),
      );
    }
    return renderField(node);
  }

  form.subscribe((event) => {
    const state = event.payload?.field;
    const binding = state && bindings.get(state.id);
    if (!binding) return;
    const changed = new Set((event.payload.changes || []).map((c) => c.propertyName));
    if (binding.kind === 'repeatable') {
      if (changed.has('items')) binding.redraw();
      return;
    }
    if (changed.has('value') || changed.has('enum')) toView(binding);
    if (changed.has('errorMessage') || changed.has('valid')) showError(binding);
  }, 'fieldChanged');

  root.append(...form.items.map(renderNode));

  return {
    focus(fieldId) {
      const binding = bindings.get(fieldId);
      const target = binding?.kind === 'checkbox-group' ? binding.input.querySelector('input') : binding?.input;
      if (!target) return false;
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      target.focus({ preventScroll: true });
      return document.activeElement === target;
    },
  };
}

export default async function decorate(block) {
  block.replaceChildren();
  const form = createFormInstance(structuredClone(definition));

  const status = el('div', { class: 'wf-status', role: 'status', 'aria-live': 'polite' });
  const fields = el('div', { class: 'wf-fields' });
  const submitButton = el('button', { type: 'submit', class: 'button', text: 'Send request' });
  const formEl = el(
    'form',
    { class: 'wf-form', novalidate: true, 'aria-labelledby': 'wf-title' },
    el('h2', { id: 'wf-title', text: form.title }),
    el('p', { class: 'wf-intro', text: definition.description }),
    fields,
    el('div', { class: 'wf-actions' }, submitButton),
    status,
  );
  block.append(formEl);

  const renderer = createRenderer(form, fields, definition);
  initTracking({ submitPath: SUBMIT_ENDPOINT, formId: definition.id });

  let lastVia = null;
  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    lastVia = 'dom';
    markSubmitVia('dom');
    status.textContent = '';
    if (form.validate().length > 0) {
      status.textContent = 'Please fix the highlighted fields.';
      reportSubmitOutcome({ via: 'dom', success: false, error: 'validation' });
      return;
    }
    submitButton.disabled = true;
    form.dispatch(new Submit());
  });

  const settle = (success, detail) => {
    submitButton.disabled = false;
    const via = lastVia || 'webmcp';
    lastVia = null;
    if (success) {
      const reference = detail?.payload?.body?.reference;
      status.textContent = `Request received${reference ? ` (reference ${reference})` : ''}. Thank you!`;
      status.classList.add('wf-success');
    } else {
      status.textContent = 'The request could not be sent. Please try again.';
    }
    reportSubmitOutcome({ via, success, reference: detail?.payload?.body?.reference });
  };
  form.subscribe((e) => settle(true, e), 'submitSuccess');
  form.subscribe((e) => settle(false, e), 'submitError');

  const host = nativeModelContext();
  if (host) {
    const unregister = registerFormWebMCP(form, {
      modelContext: trackingModelContext(host),
      onFocusRequest: (fieldId) => renderer.focus(fieldId),
    });
    window.addEventListener('pagehide', (event) => { if (!event.persisted) unregister(); });
  }
  block.dataset.webmcp = host ? 'registered' : 'no-host';
}
