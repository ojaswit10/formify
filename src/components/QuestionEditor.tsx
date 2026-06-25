'use client'

import { Question, QuestionType, detectEquationWarning } from '@/types/formify'

interface Props {
  questions: Question[]
  onChange: (questions: Question[]) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

function updateOne(
  questions: Question[],
  id: string,
  updates: Partial<Question>
): Question[] {
  return questions.map((q) => {
    if (q.id !== id) return q
    const updated = { ...q, ...updates }
    // Re-run equation warning whenever question text or type changes
    updated.hasEquationWarning = detectEquationWarning(updated)
    return updated
  })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TypePills({
  current,
  onChange,
}: {
  current: QuestionType
  onChange: (t: QuestionType) => void
}) {
  const types: { value: QuestionType; label: string }[] = [
    { value: 'mcq', label: 'MCQ' },
    { value: 'short_answer', label: 'Short' },
    { value: 'paragraph', label: 'Paragraph' },
  ]
  return (
    <div className="type-pills">
      {types.map(({ value, label }) => (
        <button
          key={value}
          className={`type-pill${current === value ? ' active' : ''}`}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function OptionRow({
  option,
  index,
  isCorrect,
  canRemove,
  onTextChange,
  onMarkCorrect,
  onRemove,
}: {
  option: string
  index: number
  isCorrect: boolean
  canRemove: boolean
  onTextChange: (val: string) => void
  onMarkCorrect: () => void
  onRemove: () => void
}) {
  return (
    <div className="option-row">
      {/* Radio button — filled = correct answer */}
      <button
        className={`option-radio${isCorrect ? ' correct' : ''}`}
        onClick={onMarkCorrect}
        title={
          isCorrect
            ? 'Correct answer (click to unset)'
            : 'Mark as correct answer'
        }
        aria-label={isCorrect ? 'Correct answer' : 'Mark correct'}
      />

      <input
        className="option-input"
        type="text"
        value={option}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Option ${String.fromCharCode(65 + index)}`}
      />

      {canRemove && (
        <button
          className="option-remove"
          onClick={onRemove}
          title="Remove option"
          aria-label="Remove option"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Main editor ────────────────────────────────────────────────────────────

export default function QuestionEditor({ questions, onChange }: Props) {
  // ── Question-level mutations ─────────────────────────────────────────────

  function updateQuestion(id: string, updates: Partial<Question>) {
    onChange(updateOne(questions, id, updates))
  }

  function deleteQuestion(id: string) {
    onChange(questions.filter((q) => q.id !== id))
  }

  // ── Type switching ───────────────────────────────────────────────────────

  function changeType(id: string, type: QuestionType) {
    const q = questions.find((q) => q.id === id)!
    updateQuestion(id, {
      type,
      // Switching to MCQ: seed with two empty options if there were none
      options: type === 'mcq' ? (q.options && q.options.length > 0 ? q.options : ['', '']) : null,
      // Clear correct answer when switching away from MCQ
      correctIndex: type === 'mcq' ? q.correctIndex : null,
    })
  }

  // ── MCQ option mutations ─────────────────────────────────────────────────

  function setOptionText(id: string, idx: number, value: string) {
    const q = questions.find((q) => q.id === id)!
    const options = [...(q.options ?? [])]
    options[idx] = value
    updateQuestion(id, { options })
  }

  function addOption(id: string) {
    const q = questions.find((q) => q.id === id)!
    updateQuestion(id, { options: [...(q.options ?? []), ''] })
  }

  function removeOption(id: string, idx: number) {
    const q = questions.find((q) => q.id === id)!
    const options = (q.options ?? []).filter((_, i) => i !== idx)
    // Shift correctIndex if needed
    let correctIndex = q.correctIndex
    if (correctIndex !== null) {
      if (correctIndex === idx) correctIndex = null
      else if (correctIndex > idx) correctIndex -= 1
    }
    updateQuestion(id, { options, correctIndex })
  }

  function toggleCorrect(id: string, idx: number) {
    const q = questions.find((q) => q.id === id)!
    // Click correct again → unset (toggle off)
    updateQuestion(id, {
      correctIndex: q.correctIndex === idx ? null : idx,
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (questions.length === 0) {
    return (
      <div className="editor-empty">
        No questions found. Try a different file or paste your questions directly.
      </div>
    )
  }

  return (
    <div className="question-list">
      {questions.map((q, i) => (
        <div key={q.id} className="question-item">

          {/* ── Header row ─────────────────────────────────────────────── */}
          <div className="question-header">
            <div className="question-header-left">
              <span className="question-number">Q{i + 1}</span>
              <TypePills
                current={q.type}
                onChange={(t) => changeType(q.id, t)}
              />
            </div>

            <div className="question-header-right">
              {q.hasEquationWarning && (
                <span
                  className="eq-warning"
                  title="This question may contain an equation that wasn't extracted from the file. Please check and edit the text if needed."
                >
                  ⚠ Check equation
                </span>
              )}
              <button
                className="delete-question"
                onClick={() => deleteQuestion(q.id)}
                title="Delete question"
                aria-label="Delete question"
              >
                ×
              </button>
            </div>
          </div>

          {/* ── Question text ───────────────────────────────────────────── */}
          <textarea
            className="question-textarea"
            value={q.question}
            onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
            placeholder="Question text…"
            rows={2}
          />

          {/* ── MCQ options ─────────────────────────────────────────────── */}
          {q.type === 'mcq' && (
            <div className="options-list">
              {(q.options ?? []).map((opt, idx) => (
                <OptionRow
                  key={idx}
                  option={opt}
                  index={idx}
                  isCorrect={q.correctIndex === idx}
                  canRemove={(q.options?.length ?? 0) > 2}
                  onTextChange={(val) => setOptionText(q.id, idx, val)}
                  onMarkCorrect={() => toggleCorrect(q.id, idx)}
                  onRemove={() => removeOption(q.id, idx)}
                />
              ))}

              <div className="options-footer">
                {(q.options?.length ?? 0) < 6 && (
                  <button
                    className="add-option-btn"
                    onClick={() => addOption(q.id)}
                  >
                    + Add option
                  </button>
                )}
                {q.correctIndex !== null ? (
                  <span className="answer-key-set">
                    ✓ Answer key: option {String.fromCharCode(65 + q.correctIndex)}
                  </span>
                ) : (
                  <span className="answer-key-unset">
                    Click a circle to set the correct answer
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Non-MCQ hint ─────────────────────────────────────────────── */}
          {q.type === 'short_answer' && (
            <div className="answer-type-hint">Short text response</div>
          )}
          {q.type === 'paragraph' && (
            <div className="answer-type-hint">Long paragraph response</div>
          )}
        </div>
      ))}
    </div>
  )
}
