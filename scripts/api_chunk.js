"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [6788],
  {
    25016: (e, t, r) => {
      r.d(t, { cn: () => o });
      var a = r(2821),
        s = r(75889);
      function o() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++) t[r] = arguments[r];
        return (0, s.QP)((0, a.$)(t));
      }
    },
    44442: (e, t, r) => {
      r.d(t, {
        JN: () => n,
        as: () => m,
        TW: () => u,
        $k: () => l,
        Ge: () => c,
        UM: () => d,
        df: () => i,
        HF: () => s,
        A4: () => x,
        CT: () => p,
        EU: () => h,
        sb: () => f,
        YC: () => g,
        Nz: () => o,
      });
      let a = async function (e) {
          let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
            r = await fetch(e, { ...t, credentials: "include" });
          if (401 === r.status) {
            try {
              let e = await fetch("/api/public/config");
              if (e.ok) {
                let { isStudyAuthRequired: t } = await e.json();
                if (!t) return r;
              }
            } catch (e) {
              return r;
            }
            (localStorage.removeItem("USER_DATA"),
              localStorage.removeItem("enrolledBatches"),
              localStorage.removeItem("selectedBatch"),
              (window.location.href = "/auth"));
          }
          return r;
        },
        s = async function () {
          let e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "1",
            t = await a("/api/AllBatches?page=".concat(e));
          if (!t.ok) throw Error("Failed to fetch batches");
          return t.json();
        },
        o = async function (e) {
          let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 1,
            r = await a("/api/searchBatch?name=".concat(e, "&page=").concat(t));
          if (!r.ok) throw Error("Failed to search batches");
          return r.json();
        },
        n = async (e, t, r) => {
          let s = "/api/BatchInfo?BatchId=".concat(e, "&Type=").concat(t);
          "announcement" === t && void 0 !== r && (s += "&page=".concat(null != r ? r : 1));
          let o = await a(s);
          if (!o.ok) throw Error("Failed to search batches");
          return o.json();
        },
        l = async (e, t, r) => {
          let s = "/api/SubjectInfo?BatchId="
              .concat(e, "&SubjectId=")
              .concat(t, "&page=")
              .concat(null != r ? r : 1),
            o = await a(s);
          if (!o.ok) throw Error("Failed to search batches");
          return o.json();
        },
        c = async (e, t, r, s, o) => {
          let n = "/api/TopicInfo?BatchId="
              .concat(e, "&SubjectId=")
              .concat(t, "&TopicId=")
              .concat(r, "&ContentType=")
              .concat(s, "&page=")
              .concat(null != o ? o : 1),
            l = await a(n);
          if (!l.ok) throw Error("Failed to fetch topics");
          return l.json();
        },
        i = async (e, t) => {
          let r = await a("/api/enrollBatch", {
            method: "POST",
            body: JSON.stringify({ batchId: e, name: t }),
          });
          if (!r.ok) throw Error("Failed to enroll batch");
          return r.json();
        },
        d = async (e, t) => {
          let r = await a("/api/UnenrollBatch", {
            method: "POST",
            body: JSON.stringify({ batchId: e, name: t }),
          });
          if (!r.ok) throw Error("Failed to enroll batch");
          return r.json();
        },
        h = async () => {
          let e = await a("/api/AboutMe", { method: "GET" });
          if (!e.ok) {
            let t = "Failed to fetch enrolled batches";
            try {
              t = (await e.json()).message || t;
            } catch (e) {}
            if (401 === e.status) throw Error("Unauthorized: Please log in again");
            if (404 === e.status) throw Error("User not found");
            if (e.status >= 500) throw Error("Server error: Please try again later");
            throw Error(t);
          }
          let t = await e.json();
          if (!t || "object" != typeof t) throw Error("Invalid response format from server");
          return (Array.isArray(t.enrolledBatches) || (t.enrolledBatches = []), t);
        },
        u = async (e, t, r) => {
          let s = "/api/GetPdf?BatchId=".concat(e, "&SubjectId=").concat(t, "&PdfId=").concat(r),
            o = await a(s);
          if (!o.ok) throw Error("Failed to fetch topics");
          return o.json();
        },
        f = async (e) => {
          let t = await a("/api/todays-schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batchId: e }),
          });
          if (!t.ok) throw Error("Failed to get today's classes");
          return t.json();
        },
        g = async (e) => {
          let t = e.join(","),
            r = await a("/api/get-user-details-list", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idsParam: t }),
            });
          if (!r.ok) throw Error("Failed to get teacher details");
          return r.json();
        },
        m = async () => {
          let e = await a("/api/CheckTgStatus", { method: "GET" });
          if (!e.ok) throw Error("Failed to verify Telegram status");
          return e.json();
        },
        x = async (e, t, r, s) => {
          let o = "/api/QuizInfo?BatchId=".concat(e, "&SubjectId=").concat(t);
          (r && (o += "&ContentId=".concat(r)), s && (o += "&QuizId=".concat(s)));
          let n = await a(o);
          if (!n.ok) {
            let e = await n.text().catch(() => "no-text");
            throw Error(
              "Failed to fetch quiz info. Status: "
                .concat(n.status, ". Body: ")
                .concat(e.substring(0, 50)),
            );
          }
          return n.json();
        },
        p = async (e) => {
          let t = await a("/api/TestList?BatchId=".concat(e));
          if (!t.ok) throw Error("Failed to fetch test series");
          return t.json();
        };
    },
    76788: (e, t, r) => {
      r.d(t, { A: () => m });
      var a = r(95155),
        s = r(12115),
        o = r(20063),
        n = r(15239),
        l = r(97003),
        c = r(44442),
        i = r(18720),
        d = r(12181),
        h = r(94315),
        u = r(89442),
        f = r(69054),
        g = r(19402);
      function m(e) {
        let {
            id: t = "",
            title: r = "",
            type: m = "",
            image: x,
            startDate: p = "",
            endDate: w = "",
            price: b = "",
            forText: y = "",
            isPlaceholder: v = !1,
            priority: j = !1,
          } = e,
          N = (0, o.useRouter)(),
          [S, E] = (0, s.useState)(!1),
          [k, I] = (0, s.useState)(!1),
          B = k && S,
          [F, A] = (0, s.useState)(!1);
        ((0, s.useEffect)(() => A(!0), []),
          (0, s.useEffect)(() => {
            I(!0);
          }, []),
          (0, s.useEffect)(() => {
            if (!k) return;
            let e = () => {
              let e = localStorage.getItem("enrolledBatches") || "[]";
              try {
                let r = JSON.parse(e).some((e) => e.batchId === t);
                E(r);
              } catch (e) {
                console.error("Failed to parse enrolledBatches from localStorage", e);
              }
            };
            return (
              e(),
              window.addEventListener("batchesUpdated", e),
              () => {
                window.removeEventListener("batchesUpdated", e);
              }
            );
          }, [t, k]));
        let T = async () => {
            try {
              let e = await (0, c.df)(t, r);
              if (e.success) {
                let e = localStorage.getItem("enrolledBatches") || "[]",
                  a = [];
                try {
                  ((a = JSON.parse(e)), Array.isArray(a) || (a = []));
                } catch (e) {
                  (console.error("Invalid JSON in localStorage:", e), (a = []));
                }
                (a.some((e) => e.batchId === t)
                  ? (0, i.o)("You're already enrolled in this batch.")
                  : (a.push({ batchId: t, name: r }),
                    localStorage.setItem("enrolledBatches", JSON.stringify(a)),
                    i.o.success("You've successfully enrolled in \"".concat(r, '".'))),
                  window.dispatchEvent(new Event("batchesUpdated")),
                  E(!0));
              } else i.o.error(e.message || "Enrollment failed. Please try again.");
            } catch (e) {
              (console.error("Error during enrollment:", e),
                i.o.error("An error occurred while enrolling."));
            }
          },
          O = async () => {
            try {
              let e = await (0, c.UM)(t, r);
              if (e.success) {
                let e = localStorage.getItem("enrolledBatches") || "[]",
                  a = [];
                try {
                  ((a = JSON.parse(e)), Array.isArray(a) || (a = []));
                } catch (e) {
                  (console.error("Invalid JSON in localStorage:", e), (a = []));
                }
                ((a = a.filter((e) => e.batchId !== t)),
                  localStorage.setItem("enrolledBatches", JSON.stringify(a)),
                  window.dispatchEvent(new Event("batchesUpdated")),
                  E(!1),
                  i.o.success('You have been unenrolled from "'.concat(r, '".')));
              } else i.o.error(e.message || "Failed to unenroll. Please try again.");
            } catch (e) {
              (console.error(e), i.o.error("An error occurred while unenrolling."));
            }
          };
        return v
          ? (0, a.jsxs)("div", {
              className: "border rounded-xl p-4 space-y-4 animate-pulse bg-muted",
              children: [
                (0, a.jsx)("div", { className: "h-6 bg-muted-foreground/30 rounded w-3/4" }),
                (0, a.jsx)("div", { className: "h-48 bg-muted-foreground/30 rounded" }),
                (0, a.jsx)("div", { className: "h-4 bg-muted-foreground/30 rounded w-1/2" }),
                (0, a.jsx)("div", { className: "h-4 bg-muted-foreground/30 rounded w-3/4" }),
                (0, a.jsxs)("div", {
                  className: "flex gap-2",
                  children: [
                    (0, a.jsx)("div", { className: "h-8 bg-muted-foreground/30 rounded w-1/2" }),
                    (0, a.jsx)("div", { className: "h-8 bg-muted-foreground/30 rounded w-1/2" }),
                  ],
                }),
              ],
            })
          : k
            ? (0, a.jsxs)("div", {
                className:
                  "border rounded-xl overflow-hidden hover:shadow-lg dark:border-gray-700 transition-shadow bg-white dark:bg-gray-900 flex flex-wrap",
                children: [
                  (0, a.jsxs)("div", {
                    className:
                      "p-4 pb-0 gap-1 space-y-3 relative flex items-center justify-between w-full",
                    children: [
                      (0, a.jsx)("h1", {
                        className: "line-clamp-2 text-lg font-bold",
                        children: r,
                      }),
                      (0, a.jsx)("div", {
                        className: "items-center !m-0",
                        children: (0, a.jsx)("span", {
                          className: "bg-yellow-400 text-xs px-2 py-1 rounded font-medium",
                          children: "New",
                        }),
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className: "w-full p-4 flex flex-wrap justify-between",
                    children: [
                      (0, a.jsxs)("div", {
                        className: "w-full rounded-lg overflow-hidden relative",
                        children: [
                          (0, a.jsx)(n.default, {
                            src:
                              x ||
                              "https://i.ibb.co/N2z9f44g/Chat-GPT-Image-Jun-13-2026-06-37-52-PM.png",
                            alt: r,
                            width: 400,
                            height: 200,
                            className: "w-full object-contain",
                            priority: j,
                          }),
                          (0, a.jsx)("div", {
                            className: "absolute bottom-2 left-2 z-10",
                            children: (0, a.jsx)("span", {
                              className:
                                "rounded-md bg-pink-500/70 dark:text-white dark:bg-green-500/80 px-2 py-1 text-xs font-medium text-white ring-1 ring-pink-700/10 ring-inset",
                              children: m || "Hinglish",
                            }),
                          }),
                        ],
                      }),
                      (0, a.jsxs)("div", {
                        className: "pt-3 space-y-3 w-full",
                        children: [
                          (0, a.jsxs)("div", {
                            className: "flex items-center gap-2 text-muted-foreground text-sm",
                            children: [
                              (0, a.jsx)(d.A, { className: "w-4 h-4" }),
                              (0, a.jsx)("span", {
                                className: "text-xs font-semibold text-foreground",
                                children: y,
                              }),
                            ],
                          }),
                          (0, a.jsxs)("div", {
                            className: "flex items-center gap-1 text-muted-foreground text-xs",
                            children: [
                              (0, a.jsx)(h.A, { className: "w-4 h-4" }),
                              "Starts on",
                              (0, a.jsx)("span", {
                                className: "text-xs font-semibold text-foreground",
                                children: p,
                              }),
                              "| Ends on",
                              (0, a.jsx)("span", {
                                className: "text-xs font-semibold text-foreground",
                                children: w,
                              }),
                            ],
                          }),
                          (0, a.jsxs)("div", {
                            className: "flex flex-wrap items-center justify-between gap-2",
                            children: [
                              (0, a.jsxs)("div", {
                                children: [
                                  (0, a.jsx)("span", {
                                    className:
                                      "text-base sm:text-lg font-bold text-green-600 dark:text-green-400",
                                    children: "₹ FREE",
                                  }),
                                  b &&
                                    (0, a.jsxs)("span", {
                                      className: "text-xs text-muted-foreground line-through ml-2",
                                      children: ["₹", b],
                                    }),
                                ],
                              }),
                              (0, a.jsx)("span", {
                                className:
                                  "text-xs bg-green-50 dark:bg-green-500 text-green-600 dark:text-white px-2 py-1 rounded",
                                children: "100% Free For Students",
                              }),
                            ],
                          }),
                          (0, a.jsxs)("div", {
                            className: "flex flex-wrap gap-2",
                            children: [
                              (0, a.jsxs)(l.$, {
                                variant: "outline",
                                className: "flex-1 min-w-[120px]",
                                onClick: () => N.push("/study/batches/".concat(t)),
                                children: [(0, a.jsx)(u.A, { className: "w-4 h-4 mr-2" }), "Study"],
                              }),
                              k &&
                                (B
                                  ? (0, a.jsxs)(l.$, {
                                      variant: "destructive",
                                      className:
                                        "flex-1 min-w-[120px] text-xs sm:text-sm bg-red-600 hover:bg-red-700",
                                      onClick: O,
                                      children: [
                                        (0, a.jsx)(f.A, { className: "ml-1 w-4 h-4" }),
                                        " Unenroll",
                                      ],
                                    })
                                  : (0, a.jsxs)(l.$, {
                                      className:
                                        "flex-1 min-w-[120px] text-xs sm:text-sm bg-green-400 text-white hover:bg-green-600 dark:hover:text-white",
                                      onClick: T,
                                      children: [
                                        "Enroll Now ",
                                        (0, a.jsx)(g.A, { className: "ml-1 w-4 h-4" }),
                                      ],
                                    })),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
            : null;
      }
    },
    97003: (e, t, r) => {
      r.d(t, { $: () => i, r: () => c });
      var a = r(95155),
        s = r(12115),
        o = r(32467),
        n = r(83101),
        l = r(25016);
      let c = (0, n.F)(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          {
            variants: {
              variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
              },
              size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
              },
            },
            defaultVariants: { variant: "default", size: "default" },
          },
        ),
        i = s.forwardRef((e, t) => {
          let { className: r, variant: s, size: n, asChild: i = !1, ...d } = e,
            h = i ? o.DX : "button";
          return (0, a.jsx)(h, {
            className: (0, l.cn)(c({ variant: s, size: n, className: r })),
            ref: t,
            ...d,
          });
        });
      i.displayName = "Button";
    },
  },
]);
