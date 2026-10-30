/**
 * Quiz trắc nghiệm chấm ngay. Dùng lại cho mọi bài:
 *
 * <div class="quiz" data-quiz>
 *   <script type="application/json">
 *     { "questions": [ { "prompt": "...", "options": ["a","b"], "answer": 1, "explain": "..." } ] }
 *   </script>
 * </div>
 *
 * Mỗi câu chỉ được chọn một lần (để người học phải nghĩ trước khi bấm), sau đó hiện giải thích.
 */
(function () {
  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderQuiz(root) {
    const data = JSON.parse(root.querySelector('script[type="application/json"]').textContent);
    const total = data.questions.length;
    let answered = 0;
    let correct = 0;
    const score = el('p', { class: 'meta', 'aria-live': 'polite' });

    data.questions.forEach((q, qi) => {
      const box = el('div', { class: 'exercise' });
      const heading = el('h3', { id: `${root.id || 'quiz'}-q${qi}` }, `Câu ${qi + 1}. ${q.prompt}`);
      const group = el('div', { role: 'group', 'aria-labelledby': heading.id });
      group.style.display = 'flex';
      group.style.flexWrap = 'wrap';
      group.style.gap = '0.5rem';
      const feedback = el('div', { class: 'feedback', 'aria-live': 'polite' });
      const buttons = q.options.map((opt, oi) => {
        const b = el('button', { type: 'button', class: 'btn' }, opt);
        b.addEventListener('click', () => {
          const ok = oi === q.answer;
          buttons.forEach((x, xi) => {
            x.disabled = true;
            if (xi === q.answer) x.classList.add('is-correct');
          });
          if (!ok) b.classList.add('is-wrong');
          feedback.innerHTML = '';
          feedback.append(
            el('span', { class: ok ? 'verdict-ok' : 'verdict-bad' }, ok ? 'Đúng. ' : `Chưa đúng — đáp án: ${q.options[q.answer]}. `),
            document.createTextNode(q.explain || ''),
          );
          answered += 1;
          if (ok) correct += 1;
          score.textContent =
            answered === total
              ? `Kết quả: ${correct}/${total}. ${correct === total ? 'Rất tốt!' : 'Đọc lại giải thích của các câu sai, rồi làm lại sau 1–2 ngày.'}`
              : `Đã làm ${answered}/${total} câu.`;
        });
        group.append(b);
        return b;
      });
      box.append(heading, group, feedback);
      root.append(box);
    });
    root.append(score);
  }

  document.querySelectorAll('[data-quiz]').forEach(renderQuiz);
})();
