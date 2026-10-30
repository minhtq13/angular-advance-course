/**
 * Bài tập "import này được phép hay bị chặn?" theo đúng logic @nx/enforce-module-boundaries:
 * với mỗi ràng buộc có sourceTag thuộc project nguồn, project đích phải có ít nhất một tag
 * trong onlyDependOnLibsWithTags; tất cả ràng buộc khớp đều phải thỏa (AND).
 *
 * <div data-boundary-checker>
 *   <script type="application/json">
 *     { "projects": [{ "name": "...", "tags": ["scope:x", "type:y"] }],
 *       "constraints": [{ "sourceTag": "type:ui", "onlyDependOnLibsWithTags": ["type:ui", "type:util"] }],
 *       "exercises": [{ "from": "...", "to": "..." }] }
 *   </script>
 * </div>
 *
 * Phần 1: đoán trước từng cặp (retrieval practice). Phần 2: tự chọn cặp bất kỳ để kiểm tra.
 * Thêm thuộc tính data-allow-add để người học tự thêm lib (scope/type lấy từ các tag trong luật).
 * "exercises" có thể bỏ trống nếu chỉ cần hộp thử tự do.
 */
(function () {
  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function check(cfg, fromName, toName) {
    const from = cfg.projects.find((p) => p.name === fromName);
    const to = cfg.projects.find((p) => p.name === toName);
    const violations = cfg.constraints.filter(
      (c) => from.tags.includes(c.sourceTag) && !c.onlyDependOnLibsWithTags.some((t) => to.tags.includes(t)),
    );
    return {
      allowed: violations.length === 0,
      messages: violations.map(
        (c) =>
          `A project tagged with "${c.sourceTag}" can only depend on libs tagged with ` +
          c.onlyDependOnLibsWithTags.map((t) => `"${t}"`).join(', '),
      ),
    };
  }

  function describe(cfg, result) {
    const box = el('div', { class: 'feedback' });
    if (result.allowed) {
      box.append(el('span', { class: 'verdict-ok' }, 'Được phép.'), document.createTextNode(' Mọi luật áp dụng cho project nguồn đều thỏa.'));
    } else {
      // ESLint chỉ in luật vi phạm ĐẦU TIÊN theo thứ tự trong depConstraints (đã kiểm trên repo Care Portal).
      box.append(el('span', { class: 'verdict-bad' }, 'Bị chặn.'), document.createTextNode(' ESLint sẽ báo:'));
      box.append(el('code', { class: 'lint' }, result.messages[0]));
      if (result.messages.length > 1) {
        box.append(el('p', { class: 'meta' }, `Import này còn vi phạm thêm ${result.messages.length - 1} luật (ESLint chỉ in luật đầu tiên):`));
        result.messages.slice(1).forEach((m) => box.append(el('code', { class: 'lint' }, m)));
      }
    }
    return box;
  }

  function label(cfg, name) {
    const p = cfg.projects.find((x) => x.name === name);
    return `${name}  [${p.tags.join(', ')}]`;
  }

  function render(root) {
    const cfg = JSON.parse(root.querySelector('script[type="application/json"]').textContent);
    let done = 0;
    let right = 0;
    const score = el('p', { class: 'meta', 'aria-live': 'polite' });

    (cfg.exercises || []).forEach((ex, i) => {
      const result = check(cfg, ex.from, ex.to);
      const box = el('div', { class: 'exercise' });
      const head = el('h3', { id: `bc-${i}` });
      head.append(document.createTextNode(`Cặp ${i + 1}. `), el('code', {}, ex.from), document.createTextNode(' import '), el('code', {}, ex.to));
      const tags = el('p', { class: 'meta' }, `Tag: ${label(cfg, ex.from)} → ${label(cfg, ex.to)}`);
      const group = el('div', { role: 'group', 'aria-labelledby': head.id });
      group.style.display = 'flex';
      group.style.gap = '0.5rem';
      const out = el('div', { 'aria-live': 'polite' });
      const choices = [
        { text: 'Được phép', value: true },
        { text: 'Bị chặn', value: false },
      ];
      const buttons = choices.map((c) => {
        const b = el('button', { type: 'button', class: 'btn' }, c.text);
        b.addEventListener('click', () => {
          const ok = c.value === result.allowed;
          buttons.forEach((x, xi) => {
            x.disabled = true;
            if (choices[xi].value === result.allowed) x.classList.add('is-correct');
          });
          if (!ok) b.classList.add('is-wrong');
          out.innerHTML = '';
          out.append(describe(cfg, result));
          done += 1;
          if (ok) right += 1;
          score.textContent = `Đoán đúng ${right}/${done} cặp.`;
        });
        group.append(b);
        return b;
      });
      box.append(head, tags, group, out);
      root.append(box);
    });
    root.append(score);

    // Hộp thử tự do
    const sandbox = el('div', { class: 'exercise' });
    sandbox.append(el('h3', {}, 'Tự thử cặp bất kỳ'));
    const row = el('div');
    row.style.display = 'flex';
    row.style.flexWrap = 'wrap';
    row.style.gap = '0.5rem';
    row.style.alignItems = 'center';
    const mk = (id, text) => {
      const wrap = el('label', { for: id });
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.fontSize = '0.9rem';
      wrap.append(document.createTextNode(text));
      const s = el('select', { id });
      s.style.font = 'inherit';
      s.style.padding = '0.3rem';
      cfg.projects.forEach((p) => s.append(el('option', { value: p.name }, p.name)));
      wrap.append(s);
      return { wrap, s };
    };
    const a = mk(`${root.id || 'bc'}-from`, 'Project nguồn (import từ)');
    const b = mk(`${root.id || 'bc'}-to`, 'Project đích (bị import)');
    b.s.selectedIndex = 1;
    const out = el('div', { 'aria-live': 'polite' });
    const update = () => {
      out.innerHTML = '';
      if (a.s.value === b.s.value) {
        out.append(el('p', { class: 'feedback' }, 'Chọn hai project khác nhau.'));
        return;
      }
      out.append(describe(cfg, check(cfg, a.s.value, b.s.value)));
    };
    a.s.addEventListener('change', update);
    b.s.addEventListener('change', update);
    row.append(a.wrap, el('span', {}, '→'), b.wrap);
    sandbox.append(row, out);

    // Thêm lib của người học (dùng cho bài thiết kế): chọn scope/type từ các tag có trong luật.
    if (root.hasAttribute('data-allow-add')) {
      const tagsOf = (prefix) =>
        [...new Set(cfg.constraints.flatMap((c) => [c.sourceTag, ...c.onlyDependOnLibsWithTags]))]
          .filter((t) => t.startsWith(prefix))
          .sort();
      const form = el('form', { class: 'add-project' });
      form.append(el('p', { class: 'meta' }, 'Thêm lib bạn thiết kế, rồi chọn nó ở hai ô phía trên để kiểm tra import:'));
      const field = (id, text, control) => {
        const wrap = el('label', { for: id });
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.fontSize = '0.9rem';
        control.id = id;
        control.style.font = 'inherit';
        control.style.padding = '0.3rem';
        wrap.append(document.createTextNode(text), control);
        return wrap;
      };
      const name = el('input', { type: 'text', required: '', placeholder: 'admin-feature-contracts', autocomplete: 'off' });
      const scope = el('select');
      tagsOf('scope:').forEach((t) => scope.append(el('option', { value: t }, t)));
      const type = el('select');
      tagsOf('type:').forEach((t) => type.append(el('option', { value: t }, t)));
      const msg = el('p', { class: 'feedback', 'aria-live': 'polite' });
      const line = el('div');
      line.style.display = 'flex';
      line.style.flexWrap = 'wrap';
      line.style.gap = '0.5rem';
      line.style.alignItems = 'flex-end';
      line.append(
        field(`${root.id || 'bc'}-new-name`, 'Tên lib', name),
        field(`${root.id || 'bc'}-new-scope`, 'scope', scope),
        field(`${root.id || 'bc'}-new-type`, 'type', type),
        el('button', { type: 'submit', class: 'btn' }, 'Thêm'),
      );
      form.append(line, msg);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const n = name.value.trim();
        if (!n) return;
        if (cfg.projects.some((p) => p.name === n)) {
          msg.textContent = `Đã có project tên "${n}".`;
          return;
        }
        cfg.projects.push({ name: n, tags: [scope.value, type.value] });
        [a.s, b.s].forEach((s) => s.append(el('option', { value: n }, n)));
        a.s.value = n;
        update();
        msg.textContent = `Đã thêm ${n} [${scope.value}, ${type.value}] và chọn làm project nguồn.`;
        name.value = '';
      });
      sandbox.append(form);
    }
    root.append(sandbox);
    update();
  }

  document.querySelectorAll('[data-boundary-checker]').forEach(render);
})();
