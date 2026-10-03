(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [1290, 1350, 8909],
  {
    1150: (e, t, n) => {
      "use strict";
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "default", {
          enumerable: !0,
          get: function () {
            return c;
          },
        }));
      let l = n(95155),
        a = n(12115),
        r = n(24437);
      function o(e) {
        return { default: e && "default" in e ? e.default : e };
      }
      n(36552);
      let i = { loader: () => Promise.resolve(o(() => null)), loading: null, ssr: !0 },
        c = function (e) {
          let t = { ...i, ...e },
            n = (0, a.lazy)(() => t.loader().then(o)),
            c = t.loading;
          function s(e) {
            let o = c ? (0, l.jsx)(c, { isLoading: !0, pastDelay: !0, error: null }) : null,
              i = !t.ssr || !!t.loading,
              s = i ? a.Suspense : a.Fragment,
              u = t.ssr
                ? (0, l.jsxs)(l.Fragment, { children: [null, (0, l.jsx)(n, { ...e })] })
                : (0, l.jsx)(r.BailoutToCSR, {
                    reason: "next/dynamic",
                    children: (0, l.jsx)(n, { ...e }),
                  });
            return (0, l.jsx)(s, { ...(i ? { fallback: o } : {}), children: u });
          }
          return ((s.displayName = "LoadableComponent"), s);
        };
    },
    8567: (e, t, n) => {
      "use strict";
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "workAsyncStorage", {
          enumerable: !0,
          get: function () {
            return l.workAsyncStorageInstance;
          },
        }));
      let l = n(17828);
    },
    17828: (e, t, n) => {
      "use strict";
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "workAsyncStorageInstance", {
          enumerable: !0,
          get: function () {
            return l;
          },
        }));
      let l = (0, n(64054).createAsyncLocalStorage)();
    },
    20063: (e, t, n) => {
      "use strict";
      var l = n(47260);
      (n.o(l, "useParams") &&
        n.d(t, {
          useParams: function () {
            return l.useParams;
          },
        }),
        n.o(l, "usePathname") &&
          n.d(t, {
            usePathname: function () {
              return l.usePathname;
            },
          }),
        n.o(l, "useRouter") &&
          n.d(t, {
            useRouter: function () {
              return l.useRouter;
            },
          }),
        n.o(l, "useSearchParams") &&
          n.d(t, {
            useSearchParams: function () {
              return l.useSearchParams;
            },
          }));
    },
    24437: (e, t, n) => {
      "use strict";
      function l(e) {
        let { reason: t, children: n } = e;
        return n;
      }
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "BailoutToCSR", {
          enumerable: !0,
          get: function () {
            return l;
          },
        }),
        n(24553));
    },
    24770: (e, t, n) => {
      Promise.resolve().then(n.bind(n, 44845));
    },
    35299: (e, t, n) => {
      "use strict";
      n.d(t, { A: () => l });
      let l = (0, n(71847).A)("LoaderCircle", [
        ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }],
      ]);
    },
    36552: (e, t, n) => {
      "use strict";
      function l(e) {
        let { moduleIds: t } = e;
        return null;
      }
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "PreloadChunks", {
          enumerable: !0,
          get: function () {
            return l;
          },
        }),
        n(95155),
        n(47650),
        n(8567),
        n(77278));
    },
    41290: () => {},
    44845: (e, t, n) => {
      "use strict";
      n.d(t, { default: () => d });
      var l = n(95155),
        a = n(12115),
        r = n(67909),
        o = n(20063),
        i = n(35299);
      n(41290);
      var c = n(18720);
      let s = (0, r.default)(
          () =>
            Promise.all([n.e(8282), n.e(2501), n.e(2271), n.e(1734), n.e(5626)]).then(
              n.bind(n, 91734),
            ),
          { loadableGenerated: { webpack: () => [91734] }, ssr: !1 },
        ),
        u = (0, r.default)(
          () =>
            Promise.all([n.e(3491), n.e(8270), n.e(8282), n.e(2501), n.e(9137), n.e(3245)]).then(
              n.bind(n, 59137),
            ),
          { loadableGenerated: { webpack: () => [59137] }, ssr: !1 },
        );
      function d() {
        let e = (0, o.useSearchParams)(),
          [t, n] = (0, a.useState)(null),
          [r, d] = (0, a.useState)(null),
          [f, h] = (0, a.useState)(null),
          [p, v] = (0, a.useState)(""),
          [m, b] = (0, a.useState)(!1),
          [y, g] = (0, a.useState)(null),
          [w, j] = (0, a.useState)(null),
          _ = (null == e ? void 0 : e.get("batchId")) || "",
          x = (null == e ? void 0 : e.get("SubjectId")) || "",
          I =
            (null == e ? void 0 : e.get("ContentId")) ||
            (null == e ? void 0 : e.get("ChildId")) ||
            "",
          P = (null == e ? void 0 : e.get("title")) || "";
        null == e || e.get("VideoUrl");
        let k = (null == e ? void 0 : e.get("topicId")) || "";
        return (
          (0, a.useEffect)(() => {
            _ &&
              x &&
              I &&
              (async () => {
                b(!0);
                try {
                  var t, l, a, r, o, i, s, u, f, p, m, y, w, S, O;
                  let [c, b] = await Promise.all([
                      fetch(
                        "/api/Schedule?BatchId="
                          .concat(_, "&SubjectId=")
                          .concat(x, "&ContentId=")
                          .concat(I),
                      ),
                      fetch("/api/auth/serverInfo"),
                    ]),
                    A = await c.json(),
                    C = await b.json();
                  null == C || C.isThirdPartyVideoApiOpen;
                  let E = (null == C ? void 0 : C.isExternalPlayerOpen) === !0,
                    N = (null == A || null == (t = A.data) ? void 0 : t.urlType) || "";
                  if (!(null == A ? void 0 : A.success) || !N) {
                    let t = (null == e ? void 0 : e.get("Type")) || "";
                    if (t) N = t;
                    else throw Error("Invalid Schedule API response and no Type fallback");
                  }
                  let L =
                    P ||
                    (null == (l = A.data) ? void 0 : l.topic) ||
                    (null == (a = A.data) ? void 0 : a.name) ||
                    (null == (o = A.data) || null == (r = o.videoDetails) ? void 0 : r.name) ||
                    null;
                  j(L);
                  let R =
                    null == A || null == (s = A.data) || null == (i = s.homeworkIds)
                      ? void 0
                      : i[0];
                  if ((null == R || null == (u = R.attachmentIds) ? void 0 : u.length) > 0) {
                    let e = R.attachmentIds[0];
                    (null == e ? void 0 : e.baseUrl) && (null == e ? void 0 : e.key) && g(e);
                  }
                  let T = (null == A || null == (f = A.data) ? void 0 : f.url) || "";
                  if ("youtube" === N) {
                    (n("youtube"), d(T));
                    return;
                  }
                  if ("awsVideo" === N || "liveVideo" === N) {
                    n("awsVideo");
                    try {
                      let e = await fetch(
                        "/api/get-video-url?batchId="
                          .concat(_, "&subjectId=")
                          .concat(x, "&childId=")
                          .concat(I, "&videoType=awsVideo"),
                      );
                      if (e.ok) {
                        let t = await e.json();
                        (null == (p = t.data) ? void 0 : p.url) &&
                          (d(t.data.url), v(t.data.signedUrl || ""));
                      }
                    } catch (e) {
                      console.error("Failed to fetch awsVideo url", e);
                    }
                    return;
                  }
                  if ("penpencilvdo" === N) {
                    let e = x;
                    if (e && (e.includes("-") || 24 !== e.length))
                      try {
                        let t = await fetch("/api/BatchInfo?BatchId=".concat(_, "&Type=details"));
                        if (t.ok) {
                          let n = (
                            (null == (w = (await t.json()).data) ? void 0 : w.subjects) || []
                          ).find((t) => t.slug === e || t._id === e);
                          (null == n ? void 0 : n._id) && (e = n._id);
                        }
                      } catch (e) {}
                    let t = (null == (m = A.data) ? void 0 : m.topicId) || k || "";
                    if (t && (t.includes("-") || 24 !== t.length))
                      try {
                        let n = await fetch(
                          "/api/SubjectInfo?BatchId=".concat(_, "&SubjectId=").concat(e),
                        );
                        if (n.ok) {
                          let e = ((await n.json()).data || []).find(
                            (e) => e.slug === t || e._id === t,
                          );
                          (null == e ? void 0 : e._id) && (t = e._id);
                        }
                      } catch (e) {}
                    let l =
                        (null == (y = A.data) ? void 0 : y.typeId) || "6a8dab3ba9fc2530d9243a34",
                      a = encodeURIComponent(L || "Lecture"),
                      r = "https://vidcloud.eu.org/play.php?batch_id="
                        .concat(_, "&subject_id=")
                        .concat(e, "&topic_id=")
                        .concat(t, "&video_id=")
                        .concat(I, "&typeId=")
                        .concat(l, "&video_name=")
                        .concat(a, "&video_img=&video_type=new&play_type=Lecture");
                    if (E) {
                      (n("vidcloud"), window.location.replace(r));
                      return;
                    }
                    let o = "",
                      i = "",
                      c = null;
                    try {
                      let e = await fetch(
                        "/api/get-video-with-keys?batchId="
                          .concat(_, "&subjectId=")
                          .concat(x, "&childId=")
                          .concat(I),
                      );
                      if (e.ok) {
                        let t = await e.json();
                        t.success &&
                          (null == (S = t.data) ? void 0 : S.url) &&
                          ((o = t.data.url),
                          (i = t.data.signedUrl || ""),
                          (c = t.data.clearKeys || null));
                      }
                    } catch (e) {
                      console.error("Native API failed", e);
                    }
                    if (!o)
                      try {
                        let e = await fetch(
                          "/api/public/video-url?parentId="
                            .concat(_, "&subjectId=")
                            .concat(x, "&childId=")
                            .concat(I),
                        );
                        if (e.ok) {
                          let t = await e.json();
                          t.success &&
                            (null == (O = t.data) ? void 0 : O.url) &&
                            ((o = t.data.url), (i = t.data.signedUrl || ""), (c = { isHls: !0 }));
                        }
                      } catch (e) {
                        console.error("[WatchClient] Pimaxer fallback also failed:", e);
                      }
                    if (!o)
                      try {
                        let e = await fetch(
                          "https://www.pwmarco.site/api/public/video-url?parentId="
                            .concat(_, "&subjectId=")
                            .concat(x, "&childId=")
                            .concat(I),
                        );
                        if (e.ok) {
                          let t = await e.json();
                          t.success &&
                            t.streamUrl &&
                            ((o = t.streamUrl), (i = ""), (c = { isHls: !0 }));
                        }
                      } catch (e) {
                        console.error("[WatchClient] PW-MARCO fallback failed:", e);
                      }
                    if (!o) return void n(null);
                    (o.includes(".m3u8") && !c && (c = { isHls: !0 }),
                      d(o),
                      v(i),
                      h(c || { isHls: !1 }),
                      n("penpencilvdo"));
                  } else n(null);
                } catch (t) {
                  console.error("Video setup failed:", t);
                  let e = "Unknown error";
                  ("string" == typeof t
                    ? (e = t)
                    : t &&
                      "object" == typeof t &&
                      "message" in t &&
                      "string" == typeof t.message &&
                      (e = t.message),
                    c.o.error("".concat(e, " - Try refreshing the page!")));
                } finally {
                  b(!1);
                }
              })();
          }, [_, x, I]),
          (0, a.useEffect)(() => {
            let e = () => {
              var e, t, n;
              document.fullscreenElement &&
              screen.orientation &&
              "function" == typeof screen.orientation.lock
                ? screen.orientation.lock("landscape").catch((e) => {})
                : (null == (e = screen.orientation) ? void 0 : e.unlock) &&
                  (null == (t = (n = screen.orientation).unlock) || t.call(n));
            };
            return (
              document.addEventListener("fullscreenchange", e),
              () => {
                document.removeEventListener("fullscreenchange", e);
              }
            );
          }, []),
          (0, l.jsx)("div", {
            className: "h-[100%] md:overflow-auto lg:overflow-hidden select-none",
            children: (0, l.jsxs)("div", {
              className: "relative",
              style: { height: "100%" },
              children: [
                m &&
                  (0, l.jsx)("div", { className: "text-center p-4", children: "Loading video..." }),
                !m &&
                  "youtube" === t &&
                  r &&
                  (0, l.jsx)(s, {
                    videoId: (function (e) {
                      try {
                        let t = new URL(e);
                        if ("youtu.be" === t.hostname) return t.pathname.slice(1);
                        let n = t.searchParams.get("v");
                        if (n && 11 === n.length) return n;
                        let l = t.pathname.match(/\/(embed|v|shorts)\/([a-zA-Z0-9_-]{11})/);
                        if (l && l[2]) return l[2];
                        return "";
                      } catch (e) {
                        return "";
                      }
                    })(r),
                    title: w || void 0,
                  }),
                !m &&
                  "vidcloud" === t &&
                  (0, l.jsxs)("div", {
                    className:
                      "w-full h-full min-h-[300px] flex items-center justify-center flex-col gap-4 text-white",
                    children: [
                      (0, l.jsx)(i.A, { className: "w-8 h-8 animate-spin" }),
                      (0, l.jsx)("p", { children: "Redirecting to external player..." }),
                    ],
                  }),
                !m &&
                  "awsVideo" === t &&
                  r &&
                  (0, l.jsx)(u, {
                    src: r,
                    type: "hls",
                    signedUrlQuery: p,
                    title: w || void 0,
                    Attachment: y || void 0,
                  }),
                !m && "penpencilvdo" === t && r && f
                  ? (0, l.jsx)(u, {
                      src: r,
                      type: f.isHls ? "hls" : "dash",
                      Attachment: y || void 0,
                      signedUrlQuery: p,
                      drmConfig: f.isHls ? void 0 : { clearKeys: f },
                      title: w || void 0,
                    })
                  : m || null !== t
                    ? null
                    : (0, l.jsxs)("div", {
                        className: "text-center p-6 text-white",
                        children: [
                          (0, l.jsx)("p", {
                            className: "mb-3 text-red-400 font-semibold",
                            children: "Video unavailable — all sources failed",
                          }),
                          (0, l.jsx)("p", {
                            className: "mb-4 text-sm text-gray-400",
                            children:
                              "This usually means no enrolled token has access to this batch.",
                          }),
                          (0, l.jsx)("button", {
                            onClick: () => window.location.reload(),
                            className:
                              "bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition",
                            children: "Reload Page",
                          }),
                        ],
                      }),
              ],
            }),
          })
        );
      }
    },
    64054: (e, t) => {
      "use strict";
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        !(function (e, t) {
          for (var n in t) Object.defineProperty(e, n, { enumerable: !0, get: t[n] });
        })(t, {
          bindSnapshot: function () {
            return o;
          },
          createAsyncLocalStorage: function () {
            return r;
          },
          createSnapshot: function () {
            return i;
          },
        }));
      let n = Object.defineProperty(
        Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"),
        "__NEXT_ERROR_CODE",
        { value: "E504", enumerable: !1, configurable: !0 },
      );
      class l {
        disable() {
          throw n;
        }
        getStore() {}
        run() {
          throw n;
        }
        exit() {
          throw n;
        }
        enterWith() {
          throw n;
        }
        static bind(e) {
          return e;
        }
      }
      let a = "undefined" != typeof globalThis && globalThis.AsyncLocalStorage;
      function r() {
        return a ? new a() : new l();
      }
      function o(e) {
        return a ? a.bind(e) : l.bind(e);
      }
      function i() {
        return a
          ? a.snapshot()
          : function (e, ...t) {
              return e(...t);
            };
      }
    },
    67909: (e, t, n) => {
      "use strict";
      n.d(t, { default: () => a.a });
      var l = n(86278),
        a = n.n(l);
    },
    71847: (e, t, n) => {
      "use strict";
      n.d(t, { A: () => i });
      var l = n(12115);
      let a = function () {
        for (var e = arguments.length, t = Array(e), n = 0; n < e; n++) t[n] = arguments[n];
        return t
          .filter((e, t, n) => !!e && "" !== e.trim() && n.indexOf(e) === t)
          .join(" ")
          .trim();
      };
      var r = {
        xmlns: "http://www.w3.org/2000/svg",
        width: 24,
        height: 24,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      };
      let o = (0, l.forwardRef)((e, t) => {
          let {
            color: n = "currentColor",
            size: o = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: c,
            className: s = "",
            children: u,
            iconNode: d,
            ...f
          } = e;
          return (0, l.createElement)(
            "svg",
            {
              ref: t,
              ...r,
              width: o,
              height: o,
              stroke: n,
              strokeWidth: c ? (24 * Number(i)) / Number(o) : i,
              className: a("lucide", s),
              ...f,
            },
            [
              ...d.map((e) => {
                let [t, n] = e;
                return (0, l.createElement)(t, n);
              }),
              ...(Array.isArray(u) ? u : [u]),
            ],
          );
        }),
        i = (e, t) => {
          let n = (0, l.forwardRef)((n, r) => {
            let { className: i, ...c } = n;
            return (0, l.createElement)(o, {
              ref: r,
              iconNode: t,
              className: a(
                "lucide-".concat(e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()),
                i,
              ),
              ...c,
            });
          });
          return ((n.displayName = "".concat(e)), n);
        };
    },
    86278: (e, t, n) => {
      "use strict";
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "default", {
          enumerable: !0,
          get: function () {
            return a;
          },
        }));
      let l = n(28140)._(n(1150));
      function a(e, t) {
        var n;
        let a = {};
        "function" == typeof e && (a.loader = e);
        let r = { ...a, ...t };
        return (0, l.default)({
          ...r,
          modules: null == (n = r.loadableGenerated) ? void 0 : n.modules,
        });
      }
      ("function" == typeof t.default || ("object" == typeof t.default && null !== t.default)) &&
        void 0 === t.default.__esModule &&
        (Object.defineProperty(t.default, "__esModule", { value: !0 }),
        Object.assign(t.default, t),
        (e.exports = t.default));
    },
  },
  (e) => {
    (e.O(0, [1741, 8720, 8441, 1255, 7358], () => e((e.s = 24770))), (_N_E = e.O()));
  },
]);
