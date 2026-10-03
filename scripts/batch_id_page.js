(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [6693],
  {
    63159: (e, s, t) => {
      "use strict";
      t.d(s, { default: () => g });
      var a = t(95155),
        r = t(12115),
        l = t(15239),
        n = t(20063),
        d = t(1659),
        i = t(44442),
        o = t(97003),
        c = t(64893),
        u = t(19402),
        x = t(56107),
        m = t.n(x),
        h = t(76788),
        p = t(18720);
      function g() {
        let e = (0, n.useParams)(),
          s = (0, n.useRouter)(),
          t = null == e ? void 0 : e.batchid,
          [x, g] = (0, r.useState)(!0);
        (0, n.usePathname)();
        let [b, f] = (0, r.useState)("batch"),
          [j, v] = (0, r.useState)([]),
          [N, w] = (0, r.useState)(!1),
          [k, y] = (0, r.useState)(null),
          [C, D] = (0, r.useState)(1),
          [S, I] = (0, r.useState)(null),
          [T, _] = (0, r.useState)("classes"),
          [E, F] = (0, r.useState)(null),
          [L, A] = (0, r.useState)(null),
          [P, U] = (0, r.useState)(!1),
          [M, z] = (0, r.useState)(null),
          [B, R] = (0, r.useState)([]),
          [V, W] = (0, r.useState)(!1),
          [O, K] = (0, r.useState)(!1),
          [$, G] = (0, r.useState)([]),
          [Q, H] = (0, r.useState)(!1),
          J = (0, n.useSearchParams)();
        (0, r.useEffect)(() => {
          let e = null == J ? void 0 : J.get("toast");
          e && p.o.success(decodeURIComponent(e));
        }, [J, p.o]);
        let q = async (e) => {
            H(!0);
            try {
              var s;
              let t = await d.A.post("/api/todays-schedule", { batchId: e });
              G((null == (s = t.data) ? void 0 : s.data) || []);
            } catch (e) {
              console.error("Failed to fetch todays classes:", e);
            } finally {
              H(!1);
            }
          },
          X = async () => {
            if ("announcement" === b && E) {
              (w(!0), y(null));
              try {
                let e = (await (0, i.JN)(E, "announcement", C)).data || [];
                (v((s) => (1 === C ? e : [...s, ...e])), 0 === e.length ? g(!1) : g(!0));
              } catch (a) {
                var e, s, t;
                (console.error(a),
                  (null == (e = a.response) ? void 0 : e.status) === 401
                    ? p.o.error("Unauthorized: Please login again.")
                    : p.o.error("Failed to load enrolled batches"),
                  y(
                    (null == a || null == (t = a.response) || null == (s = t.data)
                      ? void 0
                      : s.message) || "Failed to fetch announcements",
                  ),
                  g(!1));
              } finally {
                w(!1);
              }
            }
          };
        if (
          ((0, r.useEffect)(() => {
            "announcement" === b && (D(1), g(!0));
          }, [b]),
          (0, r.useEffect)(() => {
            X();
          }, [b, t, E, C]),
          (0, r.useEffect)(() => {
            let e = async () => {
              (U(!0), z(null));
              try {
                let e = (await (0, i.JN)(t, "details")).data;
                (A(e), (null == e ? void 0 : e._id) && (F(e._id), q(e._id)));
              } catch (t) {
                var e, s;
                (z(
                  (null == t || null == (s = t.response) || null == (e = s.data)
                    ? void 0
                    : e.message) || "Error fetching batch details",
                ),
                  console.error("Error:", t));
              } finally {
                U(!1);
              }
            };
            t && e();
          }, [t]),
          (0, r.useEffect)(() => {
            "testSeries" !== T ||
              0 !== B.length ||
              V ||
              !t ||
              O ||
              (async () => {
                (W(!0), K(!0));
                try {
                  let e = await (0, i.CT)(t);
                  e.data && R(e.data);
                } catch (e) {
                  console.error("Failed to fetch tests", e);
                } finally {
                  W(!1);
                }
              })();
          }, [T, t, B.length, V, O]),
          "announcement" === b)
        )
          return (0, a.jsxs)(a.Fragment, {
            children: [
              S &&
                (0, a.jsx)("div", {
                  className: "fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center",
                  onClick: () => I(null),
                  children: (0, a.jsx)("div", {
                    className:
                      "relative max-w-3xl w-full p-4 dark:border bg-foreground rounded divshadow",
                    children: (0, a.jsx)("img", {
                      src: S,
                      alt: "Preview",
                      className: "rounded-lg max-h-[80vh] mx-auto",
                    }),
                  }),
                }),
              (0, a.jsx)("div", {
                className: "p-5",
                children: (0, a.jsx)("div", {
                  className: "container mx-auto px-0 py-6",
                  children: (0, a.jsxs)("div", {
                    className: "divshadow bg-background border rounded-lg p-6",
                    children: [
                      (0, a.jsxs)("div", {
                        className: "flex flex-wrap justify-between items-center mb-4",
                        children: [
                          (0, a.jsx)(o.$, {
                            onClick: () => f("batch"),
                            className: "sm:p-1 sm:h-min",
                            children: "← Back to Batch",
                          }),
                          (0, a.jsx)("h3", {
                            className: "text-xl font-bold",
                            children: "\uD83D\uDCE2 Announcements",
                          }),
                        ],
                      }),
                      (0, a.jsx)("div", {
                        className: "",
                        children:
                          N && 1 === C
                            ? (0, a.jsx)(a.Fragment, {
                                children: (0, a.jsxs)("div", {
                                  className:
                                    "grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3",
                                  children: [
                                    (0, a.jsx)(h.A, { isPlaceholder: !0 }),
                                    (0, a.jsx)(h.A, { isPlaceholder: !0 }),
                                    (0, a.jsx)(h.A, { isPlaceholder: !0 }),
                                  ],
                                }),
                              })
                            : j.length
                              ? (0, a.jsxs)(a.Fragment, {
                                  children: [
                                    (0, a.jsx)("div", {
                                      className:
                                        "grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3",
                                      children: j.map((e, s) =>
                                        (0, a.jsxs)(
                                          "div",
                                          {
                                            className:
                                              "no-scrollbar flex flex-col gap-4  overflow-y-scroll justify-between bg-background border p-4 divshadow max-h-96 rounded-lg",
                                            children: [
                                              (0, a.jsxs)("div", {
                                                className: "flex items-start gap-4",
                                                children: [
                                                  (0, a.jsx)("img", {
                                                    className: "h-11 w-11",
                                                    src: "/assets/img/defaultSubject.svg",
                                                    alt: "PW Logo",
                                                  }),
                                                  (0, a.jsxs)("div", {
                                                    children: [
                                                      (0, a.jsx)("span", {
                                                        className: "mt-3 text-sm font-bold",
                                                        children: "PW Team",
                                                      }),
                                                      (0, a.jsx)("p", {
                                                        className: "text-xs text-muted-foreground",
                                                        children: new Date(
                                                          e.createdAt,
                                                        ).toLocaleString(),
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              (0, a.jsx)("div", {
                                                className: "text-sm space-y-2",
                                                children: (0, a.jsx)("p", {
                                                  className: "break-words whitespace-pre-wrap",
                                                  children: e.announcement,
                                                }),
                                              }),
                                              e.attachment &&
                                                (0, a.jsx)("div", {
                                                  onClick: () => {
                                                    I(e.attachment.baseUrl + e.attachment.key);
                                                  },
                                                  className: "cursor-pointer",
                                                  children: (0, a.jsx)("div", {
                                                    className: "relative aspect-video w-full",
                                                    children: (0, a.jsx)(l.default, {
                                                      src: e.attachment.baseUrl + e.attachment.key,
                                                      alt: "Announcement visual",
                                                      className: "object-contain rounded",
                                                      fill: !0,
                                                    }),
                                                  }),
                                                }),
                                            ],
                                          },
                                          s,
                                        ),
                                      ),
                                    }),
                                    x &&
                                      (0, a.jsx)("div", {
                                        className: "flex justify-center mt-4",
                                        children: (0, a.jsx)(o.$, {
                                          variant: "outline",
                                          onClick: () => D((e) => e + 1),
                                          disabled: N,
                                          children: N ? "Loading..." : "Load More",
                                        }),
                                      }),
                                  ],
                                })
                              : (0, a.jsx)(a.Fragment, {
                                  children: (0, a.jsx)("div", {
                                    className: "p-3 border rounded-md text-center",
                                    children: (0, a.jsx)("p", {
                                      className: "p-4",
                                      children: "No announcements available.",
                                    }),
                                  }),
                                }),
                      }),
                    ],
                  }),
                }),
              }),
            ],
          });
        if ("batch" === b) {
          var Y;
          return (0, a.jsx)(a.Fragment, {
            children: (0, a.jsxs)("div", {
              className: "p-5",
              children: [
                (0, a.jsxs)("div", {
                  className: "bg-background border rounded-[20px_20px_0_0]",
                  children: [
                    (0, a.jsx)("div", {
                      className: "rounded-[20px_20px_0_0] overflow-hidden",
                      children: (0, a.jsx)("div", {
                        className:
                          "bg-[url(/assets/img/descriptionHeader.svg)] bg-no-repeat bg-cover bg-center container mx-auto px-4 py-6",
                        children: L
                          ? (0, a.jsx)("h1", {
                              className: "text-2xl font-bold text-white p-2",
                              children: L.name,
                            })
                          : (0, a.jsx)("div", {
                              className:
                                "h-8 w-64 bg-muted-foreground/30 animate-pulse rounded p-2",
                            }),
                      }),
                    }),
                    (0, a.jsxs)("div", {
                      className:
                        "flex flex-wrap items-center w-auto justify-between px-0 divshadow",
                      children: [
                        (0, a.jsxs)("div", {
                          className: "flex overflow-x-auto mx-3 gap-5",
                          children: [
                            (0, a.jsx)("button", {
                              onClick: () => _("description"),
                              className:
                                "px-1 text-foreground py-3 text-xs w-auto font-medium transition-all border-b-4 ".concat(
                                  "description" === T
                                    ? "border-[#7567ee] text-[#5a4bda] rounded dark:text-[#29ff94] dark:border-[#3dc280]"
                                    : "border-transparent hover:text-[#7567ee] dark:hover:text-[#29ff94]",
                                ),
                              children: "\uD83D\uDCD8 Description",
                            }),
                            (0, a.jsx)("button", {
                              onClick: () => _("classes"),
                              className:
                                "px-1 text-foreground py-3 text-xs w-auto font-medium transition-all border-b-4 ".concat(
                                  "classes" === T
                                    ? "border-[#7567ee] text-[#5a4bda] rounded dark:text-[#29ff94] dark:border-[#3dc280]"
                                    : "border-transparent hover:text-[#7567ee] dark:hover:text-[#29ff94]",
                                ),
                              children: "\uD83C\uDF81 All Classes",
                            }),
                            (0, a.jsx)("button", {
                              onClick: () => _("testSeries"),
                              className:
                                "px-1 text-foreground py-3 text-xs w-auto font-medium transition-all border-b-4 ".concat(
                                  "testSeries" === T
                                    ? "border-[#7567ee] text-[#5a4bda] rounded dark:text-[#29ff94] dark:border-[#3dc280]"
                                    : "border-transparent hover:text-[#7567ee] dark:hover:text-[#29ff94]",
                                ),
                              children: "\uD83D\uDCDD Test Series",
                            }),
                            (0, a.jsx)("button", {
                              onClick: () => _("khazana"),
                              className:
                                "px-1 text-foreground py-3 text-xs w-auto font-medium transition-all border-b-4 ".concat(
                                  "khazana" === T
                                    ? "border-[#7567ee] text-[#5a4bda] rounded dark:text-[#29ff94] dark:border-[#3dc280]"
                                    : "border-transparent hover:text-[#7567ee] dark:hover:text-[#29ff94]",
                                ),
                              children: "\uD83D\uDC8E Khazana",
                            }),
                          ],
                        }),
                        (0, a.jsxs)("div", {
                          className: "flex items-center gap-1 text-foreground rounded-lg mx-5",
                          children: [
                            (0, a.jsxs)(o.$, {
                              variant: "outline",
                              className: "gap-2 px-3 py-4 text-[smaller] h-0",
                              children: [(0, a.jsx)(c.A, { className: "w-4 h-4" }), "Share Batch"],
                            }),
                            (0, a.jsxs)(o.$, {
                              variant: "outline",
                              onClick: () => f("announcement"),
                              className: "gap-2 px-3 py-4 text-[smaller] h-0",
                              children: [
                                (0, a.jsxs)("svg", {
                                  width: "24",
                                  className: "!w-6 !h-6 dark:!stroke-white stroke-black",
                                  height: "24",
                                  viewBox: "0 0 24 24",
                                  fill: "none",
                                  xmlns: "http://www.w3.org/2000/svg",
                                  children: [
                                    (0, a.jsx)("path", {
                                      d: "M14.1426 15.8113C15.5636 15.6427 16.9337 15.3087 18.2333 14.8289C17.1557 13.6328 16.4999 12.0492 16.4999 10.3125V9.78689C16.5 9.7746 16.5 9.76231 16.5 9.75C16.5 7.26472 14.4853 5.25 12 5.25C9.51472 5.25 7.5 7.26472 7.5 9.75L7.49985 10.3125C7.49985 12.0492 6.84396 13.6328 5.76636 14.8289C7.06605 15.3087 8.43632 15.6428 9.85735 15.8113M14.1426 15.8113C13.44 15.8946 12.7249 15.9375 11.9999 15.9375C11.2749 15.9375 10.5599 15.8946 9.85735 15.8113M14.1426 15.8113C14.2124 16.0283 14.25 16.2598 14.25 16.5C14.25 17.7426 13.2426 18.75 12 18.75C10.7574 18.75 9.75 17.7426 9.75 16.5C9.75 16.2598 9.78764 16.0284 9.85735 15.8113",
                                      stroke: "",
                                      strokeWidth: "1.325",
                                      strokeLinecap: "round",
                                      strokeLinejoin: "round",
                                    }),
                                    (0, a.jsx)("circle", {
                                      cx: "16.125",
                                      cy: "7.125",
                                      r: "3.1875",
                                      fill: "#BF2734",
                                      stroke: "white",
                                      strokeWidth: "1.125",
                                    }),
                                  ],
                                }),
                                "Announcement",
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                "description" === T &&
                  (0, a.jsx)("div", {
                    className: "container mx-auto px-0 py-6",
                    children: (0, a.jsxs)("div", {
                      className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                      children: [
                        (0, a.jsx)("div", {
                          className: "lg:col-span-2 space-y-6",
                          children: (0, a.jsxs)("div", {
                            className:
                              "divshadow bg-background border rounded-lg p-6 !text-foreground",
                            children: [
                              (0, a.jsx)("h2", {
                                className: "text-xl font-semibold mb-4",
                                children: "This Batch Includes",
                              }),
                              (null == L ? void 0 : L.shortDescription)
                                ? (0, a.jsx)("div", {
                                    className: "text-foreground !dark:text-white",
                                    dangerouslySetInnerHTML: {
                                      __html: m().decode(L.shortDescription),
                                    },
                                  })
                                : (0, a.jsxs)("div", {
                                    className: "space-y-3",
                                    children: [
                                      (0, a.jsx)("div", {
                                        className:
                                          "h-4 w-full bg-muted-foreground/30 animate-pulse rounded",
                                      }),
                                      (0, a.jsx)("div", {
                                        className:
                                          "h-4 w-5/6 bg-muted-foreground/30 animate-pulse rounded",
                                      }),
                                      (0, a.jsx)("div", {
                                        className:
                                          "h-4 w-4/6 bg-muted-foreground/30 animate-pulse rounded",
                                      }),
                                    ],
                                  }),
                            ],
                          }),
                        }),
                        (0, a.jsx)("div", {
                          className: "lg:col-span-1",
                          children: (0, a.jsx)("div", {
                            className: "sticky top-20",
                            children: (0, a.jsxs)("div", {
                              className:
                                "bg-background border rounded-lg overflow-hidden shadow-md",
                              children: [
                                (0, a.jsxs)("div", {
                                  className: "relative",
                                  children: [
                                    L
                                      ? (0, a.jsx)(a.Fragment, {
                                          children: (0, a.jsx)(l.default, {
                                            src: L.previewImage.baseUrl + L.previewImage.key,
                                            alt: L.name,
                                            width: 400,
                                            height: 200,
                                            className: "w-full object-contain",
                                            priority: !0,
                                          }),
                                        })
                                      : (0, a.jsxs)(a.Fragment, {
                                          children: [
                                            (0, a.jsx)("div", {
                                              className:
                                                "h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2",
                                            }),
                                            (0, a.jsx)("div", {
                                              className:
                                                "h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2",
                                            }),
                                            (0, a.jsx)("div", {
                                              className:
                                                "h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2",
                                            }),
                                            (0, a.jsx)("div", {
                                              className:
                                                "h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2",
                                            }),
                                            (0, a.jsx)("div", {
                                              className:
                                                "h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2",
                                            }),
                                          ],
                                        }),
                                    (0, a.jsx)("span", {
                                      className:
                                        "absolute top-2 right-2 bg-yellow-400 text-xs px-2 py-1 rounded",
                                      children: "New",
                                    }),
                                  ],
                                }),
                                (0, a.jsxs)("div", {
                                  className: "p-4",
                                  children: [
                                    (0, a.jsx)("div", {
                                      className: "flex items-center justify-between mb-4",
                                      children: L
                                        ? (0, a.jsxs)(a.Fragment, {
                                            children: [
                                              (0, a.jsx)("span", {
                                                className: "text-sm text-muted-foreground",
                                                children: L.byName,
                                              }),
                                              (0, a.jsx)("span", {
                                                className:
                                                  "rounded-md bg-pink-50 dark:text-white dark:bg-muted px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-pink-700/10 ring-inset",
                                                children: L.language,
                                              }),
                                            ],
                                          })
                                        : (0, a.jsx)(a.Fragment, {
                                            children: (0, a.jsx)("div", {
                                              className:
                                                "h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2",
                                            }),
                                          }),
                                    }),
                                    (0, a.jsx)("div", {
                                      className: "bg-green-50 dark:bg-muted rounded-lg p-3 mb-4",
                                      children: (0, a.jsxs)("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                          (0, a.jsx)("span", {
                                            className: "text-green-600",
                                            children: "\uD83C\uDFAF",
                                          }),
                                          (0, a.jsx)("span", {
                                            className: "text-sm font-medium",
                                            children: "Enroll Now, To Ease Access",
                                          }),
                                        ],
                                      }),
                                    }),
                                    (0, a.jsxs)(o.$, {
                                      className: "w-full flex items-center justify-center gap-2",
                                      onClick: () =>
                                        s.push("/study/batches?batchid=/".concat(t, "/")),
                                      children: [
                                        "ENROLL NOW",
                                        (0, a.jsx)(u.A, { className: "w-4 h-4" }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        }),
                      ],
                    }),
                  }),
                "classes" === T &&
                  (0, a.jsx)("div", {
                    className: "container mx-auto px-0 py-6",
                    children: (0, a.jsxs)("div", {
                      className: "lg:col-span-2 space-y-6",
                      children: [
                        $.length > 0 &&
                          (0, a.jsxs)("div", {
                            className: "divshadow bg-background border rounded-lg p-6 mb-6",
                            children: [
                              (0, a.jsx)("h3", {
                                className:
                                  "text-2xl font-bold text-static-black max-md:text-xl max-sm:text-base mb-4",
                                children: "Today's Class",
                              }),
                              (0, a.jsx)("div", {
                                className: "flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar",
                                children: $.map((e) => {
                                  var r;
                                  let l = "COMPLETED" === e.status,
                                    n = "ACTIVE" === e.status || "LIVE" === e.status,
                                    d = "PENDING" === e.status;
                                  if ("PENDING" === e.status && e.startTime) {
                                    let s = new Date(),
                                      t = new Date(e.startTime),
                                      a = new Date(e.endTime ? e.endTime : t.getTime() + 72e5);
                                    s >= t && s <= a
                                      ? ((n = !0), (d = !1))
                                      : s > a && ((l = !0), (d = !1));
                                  }
                                  let i = "bg-purple-500 text-white",
                                    o = "UPCOMING";
                                  n
                                    ? ((i = "bg-red-500 text-white animate-pulse"), (o = "LIVE"))
                                    : l && ((i = "bg-green-600 text-white"), (o = "ENDED"));
                                  let c = e.startTime
                                    ? new Date(e.startTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "";
                                  return (0, a.jsxs)(
                                    "div",
                                    {
                                      onClick: () => {
                                        var a, r;
                                        if (d)
                                          return void p.o.info("This class has not started yet.");
                                        l
                                          ? s.push(
                                              "/watch?batchId="
                                                .concat(t, "&SubjectId=")
                                                .concat(
                                                  null == (a = e.subjectId) ? void 0 : a._id,
                                                  "&ChildId=",
                                                )
                                                .concat(e._id, "&title=")
                                                .concat(encodeURIComponent(e.topic)),
                                            )
                                          : s.push(
                                              "/live?batchId="
                                                .concat(t, "&SubjectId=")
                                                .concat(
                                                  null == (r = e.subjectId) ? void 0 : r._id,
                                                  "&ChildId=",
                                                )
                                                .concat(e._id, "&title=")
                                                .concat(encodeURIComponent(e.topic), "&Type=")
                                                .concat(e.urlType || "awsVideo", "&startTime=")
                                                .concat(e.startTime),
                                            );
                                      },
                                      className:
                                        "flex-shrink-0 w-72 bg-foreground/5 border rounded-xl overflow-hidden snap-start cursor-pointer hover:border-purple-500/50 transition-colors",
                                      children: [
                                        (0, a.jsxs)("div", {
                                          className:
                                            "relative h-32 bg-foreground/10 flex items-center justify-center",
                                          children: [
                                            (0, a.jsx)("img", {
                                              src: "/assets/img/defaultSubject.svg",
                                              alt: "Teacher",
                                              className: "h-full object-cover opacity-50",
                                            }),
                                            (0, a.jsx)("div", {
                                              className:
                                                "absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end justify-center pb-2",
                                              children: (0, a.jsx)("span", {
                                                className: "font-semibold text-sm text-foreground",
                                                children:
                                                  (null == (r = e.subjectId) ? void 0 : r.name) ||
                                                  "Teacher",
                                              }),
                                            }),
                                          ],
                                        }),
                                        (0, a.jsxs)("div", {
                                          className: "p-4",
                                          children: [
                                            (0, a.jsxs)("div", {
                                              className: "flex items-center justify-between mb-2",
                                              children: [
                                                (0, a.jsx)("span", {
                                                  className:
                                                    "text-[10px] font-bold px-2 py-0.5 rounded ".concat(
                                                      i,
                                                    ),
                                                  children: o,
                                                }),
                                                (0, a.jsxs)("span", {
                                                  className:
                                                    "text-xs text-muted-foreground flex items-center gap-1",
                                                  children: [
                                                    (0, a.jsxs)("svg", {
                                                      xmlns: "http://www.w3.org/2000/svg",
                                                      width: "12",
                                                      height: "12",
                                                      viewBox: "0 0 24 24",
                                                      fill: "none",
                                                      stroke: "currentColor",
                                                      strokeWidth: "2",
                                                      strokeLinecap: "round",
                                                      strokeLinejoin: "round",
                                                      children: [
                                                        (0, a.jsx)("circle", {
                                                          cx: "12",
                                                          cy: "12",
                                                          r: "10",
                                                        }),
                                                        (0, a.jsx)("polyline", {
                                                          points: "12 6 12 12 16 14",
                                                        }),
                                                      ],
                                                    }),
                                                    c,
                                                  ],
                                                }),
                                              ],
                                            }),
                                            (0, a.jsx)("h4", {
                                              className: "text-sm font-semibold line-clamp-2",
                                              title: e.topic,
                                              children: e.topic,
                                            }),
                                          ],
                                        }),
                                      ],
                                    },
                                    e._id,
                                  );
                                }),
                              }),
                            ],
                          }),
                        (0, a.jsxs)("div", {
                          className: "divshadow bg-background border rounded-lg p-6",
                          children: [
                            (0, a.jsx)("h3", {
                              className:
                                "text-2xl font-bold text-static-black max-md:text-xl max-sm:text-base mb-2",
                              children: "Subjects",
                            }),
                            (0, a.jsx)("div", {
                              className:
                                "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6",
                              children: (null == L || null == (Y = L.subjects) ? void 0 : Y.length)
                                ? L.subjects.map((e) => {
                                    let t = e.imageId
                                      ? e.imageId.baseUrl + e.imageId.key
                                      : "/assets/img/defaultSubject.svg";
                                    return (0, a.jsxs)(
                                      "div",
                                      {
                                        className:
                                          "flex items-center gap-3 bg-backgorund border rounded-lg p-4 hover:shadow-md cursor-pointer divshadow transition-shadow",
                                        onClick: () => {
                                          var t, a;
                                          return s.push(
                                            "/study/batches/"
                                              .concat(
                                                null != (a = null != (t = L.batchId) ? t : L._id)
                                                  ? a
                                                  : L.slug,
                                                "/subjects/",
                                              )
                                              .concat(e.slug),
                                          );
                                        },
                                        children: [
                                          (0, a.jsx)("div", {
                                            className: "text-[#2a4365] text-xl flex-shrink-0",
                                            children: (0, a.jsx)(l.default, {
                                              src: t,
                                              alt: e.subject,
                                              width: 40,
                                              height: 40,
                                            }),
                                          }),
                                          (0, a.jsxs)("div", {
                                            children: [
                                              (0, a.jsx)("div", {
                                                className:
                                                  "max-w-full sm:max-w-[140px] overflow-hidden",
                                                children: (0, a.jsx)("p", {
                                                  className:
                                                    "font-semibold text-foreground truncate text-sm sm:text-base md:text-lg",
                                                  children: e.subject,
                                                }),
                                              }),
                                              (0, a.jsxs)("p", {
                                                className: "text-xs text-muted-foreground",
                                                children: [e.tagCount, " Chapters"],
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      e._id,
                                    );
                                  })
                                : (0, a.jsx)(a.Fragment, {
                                    children: [...Array(6)].map((e, s) =>
                                      (0, a.jsxs)(
                                        "div",
                                        {
                                          className: "space-y-3",
                                          children: [
                                            (0, a.jsx)("div", {
                                              className:
                                                "h-4 w-full bg-muted-foreground/30 animate-pulse rounded",
                                            }),
                                            (0, a.jsx)("div", {
                                              className:
                                                "h-4 w-5/6 bg-muted-foreground/30 animate-pulse rounded",
                                            }),
                                            (0, a.jsx)("div", {
                                              className:
                                                "h-4 w-4/6 bg-muted-foreground/30 animate-pulse rounded",
                                            }),
                                          ],
                                        },
                                        s,
                                      ),
                                    ),
                                  }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
                "testSeries" === T &&
                  (0, a.jsx)("div", {
                    className: "container mx-auto px-0 py-6",
                    children: (0, a.jsx)("div", {
                      className: "lg:col-span-2 space-y-6",
                      children: (0, a.jsxs)("div", {
                        className: "divshadow bg-background border rounded-lg p-6",
                        children: [
                          (0, a.jsx)("h3", {
                            className: "text-2xl font-bold max-md:text-xl max-sm:text-base mb-4",
                            children: "\uD83D\uDCDD Tests",
                          }),
                          (null == L ? void 0 : L.batchName) &&
                            (0, a.jsx)("div", {
                              className: "mb-4",
                              children: (0, a.jsx)("span", {
                                className:
                                  "inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30",
                                children: L.batchName,
                              }),
                            }),
                          (0, a.jsx)("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                            children: V
                              ? (0, a.jsxs)("div", {
                                  className: "col-span-full p-8 border rounded-xl text-center",
                                  children: [
                                    (0, a.jsx)("div", {
                                      className:
                                        "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-3",
                                    }),
                                    (0, a.jsx)("p", {
                                      className: "text-muted-foreground",
                                      children: "Loading tests...",
                                    }),
                                  ],
                                })
                              : (null == B ? void 0 : B.length)
                                ? B.map((e) => {
                                    var t, r;
                                    let l = e.name || e.title || e.topic || "Test",
                                      n = e.duration || e.totalDuration || 180,
                                      d =
                                        e.totalQuestions || e.questionCount || e.noOfQuestions || 0,
                                      i = e.totalMarks || e.maxMarks || 4 * d || 0,
                                      o = e.status || "Missed",
                                      c = encodeURIComponent(l),
                                      u =
                                        null != (r = null != (t = L.batchId) ? t : L._id)
                                          ? r
                                          : L.slug;
                                    return (0, a.jsxs)(
                                      "div",
                                      {
                                        className:
                                          "flex flex-col justify-between bg-background border rounded-xl p-5 divshadow hover:shadow-lg transition-shadow",
                                        children: [
                                          (0, a.jsxs)("div", {
                                            children: [
                                              (0, a.jsxs)("div", {
                                                className:
                                                  "flex items-start justify-between gap-2 mb-3",
                                                children: [
                                                  (0, a.jsx)("p", {
                                                    className:
                                                      "font-semibold text-foreground text-sm md:text-base line-clamp-2 flex-1",
                                                    children: l,
                                                  }),
                                                  (0, a.jsx)("span", {
                                                    className:
                                                      "flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ".concat(
                                                        "Live" === o
                                                          ? "bg-green-500/15 text-green-500"
                                                          : "Upcoming" === o
                                                            ? "bg-blue-500/15 text-blue-500"
                                                            : "bg-red-500/15 text-red-500",
                                                      ),
                                                    children: o,
                                                  }),
                                                ],
                                              }),
                                              (0, a.jsxs)("div", {
                                                className: "space-y-1.5 mb-4",
                                                children: [
                                                  (0, a.jsxs)("div", {
                                                    className:
                                                      "flex items-center gap-2 text-xs text-muted-foreground",
                                                    children: [
                                                      (0, a.jsx)("span", { children: "⏱️" }),
                                                      (0, a.jsxs)("span", {
                                                        children: ["Duration: ", n, " mins"],
                                                      }),
                                                    ],
                                                  }),
                                                  d > 0 &&
                                                    (0, a.jsxs)("div", {
                                                      className:
                                                        "flex items-center gap-2 text-xs text-muted-foreground",
                                                      children: [
                                                        (0, a.jsx)("span", {
                                                          children: "\uD83D\uDCCB",
                                                        }),
                                                        (0, a.jsxs)("span", {
                                                          children: ["Questions: ", d],
                                                        }),
                                                      ],
                                                    }),
                                                  i > 0 &&
                                                    (0, a.jsxs)("div", {
                                                      className:
                                                        "flex items-center gap-2 text-xs text-muted-foreground",
                                                      children: [
                                                        (0, a.jsx)("span", {
                                                          children: "\uD83C\uDFAF",
                                                        }),
                                                        (0, a.jsxs)("span", {
                                                          children: ["Marks: ", i],
                                                        }),
                                                      ],
                                                    }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          (0, a.jsxs)("div", {
                                            className: "flex items-center gap-2 mt-auto",
                                            children: [
                                              (0, a.jsx)("button", {
                                                onClick: () =>
                                                  s.push(
                                                    "/test/"
                                                      .concat(u, "?testId=")
                                                      .concat(e._id || e.id, "&testName=")
                                                      .concat(c, "&source=batch&returnTo=")
                                                      .concat(
                                                        encodeURIComponent(
                                                          "/study/batches/".concat(u),
                                                        ),
                                                      ),
                                                  ),
                                                className:
                                                  "flex-1 px-3 py-2 rounded-lg border border-foreground/20 text-sm font-medium hover:bg-foreground/5 transition-colors text-center",
                                                children: "Start Test",
                                              }),
                                              (0, a.jsx)("button", {
                                                onClick: (e) => {
                                                  (e.stopPropagation(),
                                                    p.o.info("Syllabus details coming soon!"));
                                                },
                                                className:
                                                  "flex-1 px-3 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity text-center",
                                                children: "View Syllabus",
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      e._id || e.id,
                                    );
                                  })
                                : (0, a.jsxs)("div", {
                                    className:
                                      "col-span-full py-16 px-6 border-2 border-dashed border-purple-500/30 bg-purple-500/5 rounded-2xl flex flex-col items-center justify-center text-center",
                                    children: [
                                      (0, a.jsx)("div", {
                                        className:
                                          "w-16 h-16 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mb-4",
                                        children: (0, a.jsx)("svg", {
                                          xmlns: "http://www.w3.org/2000/svg",
                                          width: "32",
                                          height: "32",
                                          viewBox: "0 0 24 24",
                                          fill: "none",
                                          stroke: "currentColor",
                                          strokeWidth: "2",
                                          strokeLinecap: "round",
                                          strokeLinejoin: "round",
                                          children: (0, a.jsx)("path", {
                                            d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
                                          }),
                                        }),
                                      }),
                                      (0, a.jsx)("h3", {
                                        className: "text-xl font-bold text-foreground mb-2",
                                        children: "Test Series Under Construction",
                                      }),
                                      (0, a.jsx)("p", {
                                        className: "text-muted-foreground max-w-md mx-auto",
                                        children:
                                          "We are currently upgrading our Test Series engine to bring you the best testing experience. Real tests for this batch will be available soon!",
                                      }),
                                    ],
                                  }),
                          }),
                        ],
                      }),
                    }),
                  }),
                "khazana" === T &&
                  (0, a.jsx)("div", {
                    className: "container mx-auto px-0 py-6",
                    children: (0, a.jsx)("div", {
                      className: "lg:col-span-2 space-y-6",
                      children: (0, a.jsxs)("div", {
                        className: "divshadow bg-background border rounded-lg p-6",
                        children: [
                          (0, a.jsx)("h3", {
                            className:
                              "text-2xl font-bold text-static-black max-md:text-xl max-sm:text-base mb-6",
                            children: "\uD83D\uDC8E Khazana",
                          }),
                          (0, a.jsxs)("div", {
                            className:
                              "col-span-full py-16 px-6 border-2 border-dashed border-purple-500/30 bg-purple-500/5 rounded-2xl flex flex-col items-center justify-center text-center",
                            children: [
                              (0, a.jsx)("div", {
                                className:
                                  "w-16 h-16 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mb-4 text-3xl",
                                children: "\uD83D\uDC8E",
                              }),
                              (0, a.jsx)("h3", {
                                className: "text-xl font-bold text-foreground mb-2",
                                children: "Khazana Vault Under Construction",
                              }),
                              (0, a.jsx)("p", {
                                className: "text-muted-foreground max-w-md mx-auto mb-6",
                                children:
                                  "The Khazana Vault interface is fully built, but we are currently waiting for an account with an active premium Khazana subscription to be added to our pool. Check back later!",
                              }),
                            ],
                          }),
                        ],
                      }),
                    }),
                  }),
              ],
            }),
          });
        }
      }
    },
    96828: (e, s, t) => {
      Promise.resolve().then(t.bind(t, 63159));
    },
  },
  (e) => {
    (e.O(0, [8720, 4909, 7780, 1659, 4348, 6788, 8441, 1255, 7358], () => e((e.s = 96828))),
      (_N_E = e.O()));
  },
]);
