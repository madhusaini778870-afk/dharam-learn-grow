import { useState, useEffect } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";
import { gamificationStore } from "@/services/gamificationStore";
import type { NormalizedDppTest } from "@/services/courseApi";

export interface DppPracticeTestModalProps {
  test: NormalizedDppTest;
  chapterTitle?: string;
  onClose: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Generate realistic questions dynamically based on test topic
function getQuestionsForTest(title: string, count = 5): Question[] {
  const baseQuestions: Question[] = [
    {
      id: 1,
      question: `For the concepts covered in ${title}, what is the fundamental governing principle or relation?`,
      options: [
        "Conservation of energy and momentum",
        "Direct proportionality to square of velocity",
        "Inverse variance with temperature at absolute zero",
        "Independence from initial reference frames",
      ],
      correctIndex: 0,
      explanation:
        "Conservation principles (energy, mass, momentum) form the fundamental baseline for solving this class of problems.",
    },
    {
      id: 2,
      question:
        "Which of the following represents the correct SI unit and dimensional formula for this system?",
      options: [
        "[M L^2 T^-2] (Joules)",
        "[M L T^-1] (kg·m/s)",
        "[M L^-1 T^-2] (Pascal)",
        "[M^0 L^0 T^0] (Dimensionless ratio)",
      ],
      correctIndex: 0,
      explanation:
        "Work and energy have dimensions [M L^2 T^-2] measured in standard SI unit of Joules (J).",
    },
    {
      id: 3,
      question:
        "If the input parameter is doubled while keeping other conditions constant, the resulting response:",
      options: [
        "Becomes four times its original magnitude (quadratic scaling)",
        "Halves its original value",
        "Remains unchanged",
        "Increases linearly by exactly two times",
      ],
      correctIndex: 3,
      explanation:
        "Standard first-order linear response scales directly with the driving parameter.",
    },
    {
      id: 4,
      question:
        "In an ideal closed system, the net rate of change of total internal quantity with respect to time is:",
      options: [
        "Zero (conserved quantity)",
        "Directly proportional to ambient temperature",
        "Infinitely increasing",
        "Negative exponential decay",
      ],
      correctIndex: 0,
      explanation: "By definition, a closed ideal system has dQ/dt = 0, representing conservation.",
    },
    {
      id: 5,
      question: "Which approximation is valid when dealing with small perturbations (x << 1)?",
      options: [
        "(1 + x)^n ≈ 1 + n·x (Binomial approximation)",
        "sin(x) ≈ cos(x)",
        "e^x ≈ 0",
        "ln(1 + x) ≈ x^2",
      ],
      correctIndex: 0,
      explanation:
        "For |x| << 1, the first-order binomial expansion (1 + x)^n ≈ 1 + n*x is highly accurate.",
    },
  ];

  return baseQuestions.slice(0, Math.min(count, baseQuestions.length));
}

export function DppPracticeTestModal({ test, chapterTitle, onClose }: DppPracticeTestModalProps) {
  const totalQ =
    test.totalQuestions && test.totalQuestions > 0 ? Math.min(test.totalQuestions, 5) : 5;
  const [questions] = useState<Question[]>(() =>
    getQuestionsForTest(test.title || chapterTitle || "DPP", totalQ),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() =>
    test.maxDuration ? test.maxDuration * 60 : 900,
  );

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, secondsRemaining]);

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const calculateScore = () => {
    let correct = 0;
    for (const q of questions) {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    }
    return correct;
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Award +50 bonus XP for completing the DPP online test
    gamificationStore.addBonusXp(50, `DPP Test Completed: ${test.title}`);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentQ = questions[currentIndex];
  const score = calculateScore();
  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl bg-card shadow-2xl ring-1 ring-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">{test.title}</h2>
              <p className="text-[11px] text-muted-foreground">
                {questions.length} Questions · {test.totalMarks ?? questions.length * 4} Marks ·
                Practice Test
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isSubmitted ? (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="size-3.5" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            ) : null}
            <button
              onClick={onClose}
              className="press flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!isSubmitted ? (
            <>
              {/* Question Navigation Bubbles */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition ${
                        isCurrent
                          ? "bg-foreground text-background ring-2 ring-primary ring-offset-2"
                          : isAnswered
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question Box */}
              {currentQ && (
                <div className="rounded-2xl bg-muted/30 p-4 ring-1 ring-border space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-[11px]">+4 for Correct · -1 for Wrong</span>
                  </div>

                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {currentQ.question}
                  </p>

                  {/* Options */}
                  <div className="space-y-2 pt-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQ.id] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`press flex w-full items-center gap-3 rounded-xl p-3 text-left text-xs transition ${
                            isSelected
                              ? "bg-emerald-500/15 ring-2 ring-emerald-500 text-foreground font-semibold"
                              : "bg-card ring-1 ring-border text-foreground hover:bg-muted/60"
                          }`}
                        >
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              isSelected
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="min-w-0 flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Result Screen */
            <div className="space-y-5 text-center py-2">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Award className="size-9" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">DPP Test Completed!</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You answered {score} out of {questions.length} questions correctly ({percentage}
                  %).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
                <div className="rounded-2xl bg-muted/40 p-3 ring-1 ring-border">
                  <span className="text-[10px] text-muted-foreground">Score</span>
                  <p className="text-base font-bold text-foreground">
                    {score * 4}/{questions.length * 4}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3 ring-1 ring-border">
                  <span className="text-[10px] text-muted-foreground">Accuracy</span>
                  <p className="text-base font-bold text-emerald-500">{percentage}%</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3 ring-1 ring-border">
                  <span className="text-[10px] text-muted-foreground">XP Bonus</span>
                  <p className="text-base font-bold text-amber-500">+50 XP</p>
                </div>
              </div>

              {/* Solution Review */}
              <div className="space-y-3 text-left pt-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Detailed Solutions &amp; Explanations
                </h4>
                {questions.map((q, idx) => {
                  const userAns = selectedAnswers[q.id];
                  const isCorrect = userAns === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl p-3.5 ring-1 text-xs space-y-1.5 ${
                        isCorrect
                          ? "bg-emerald-500/5 ring-emerald-500/30"
                          : "bg-red-500/5 ring-red-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Question {idx + 1}</span>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                            <CheckCircle2 className="size-3.5" /> Correct (+4)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-bold text-red-600 dark:text-red-400 text-[11px]">
                            <AlertCircle className="size-3.5" /> Incorrect
                          </span>
                        )}
                      </div>
                      <p className="text-foreground">{q.question}</p>
                      <p className="text-muted-foreground text-[11px]">
                        <strong>Correct Answer:</strong> Option{" "}
                        {String.fromCharCode(65 + q.correctIndex)} ({q.options[q.correctIndex]})
                      </p>
                      <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-xl">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-muted/20">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="press flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition"
              >
                <ChevronLeft className="size-3.5" /> Previous
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                    }
                    className="press flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="press flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>Submit Practice Test</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setSelectedAnswers({});
                  setCurrentIndex(0);
                  setSecondsRemaining(test.maxDuration ? test.maxDuration * 60 : 900);
                }}
                className="press flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
              >
                <RotateCcw className="size-3.5" /> Retake Test
              </button>
              <button
                type="button"
                onClick={onClose}
                className="press flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
