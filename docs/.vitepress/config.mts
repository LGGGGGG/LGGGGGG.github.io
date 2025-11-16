// import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  lang: "zh-CN",
  title: "哥们做的东西，喜欢您来",
  description: "A VitePress Site",
  srcDir: "src",
  lastUpdated: true,
  markdown: { math: true },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/index" },
      //{ text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: "games 101",
        collapsed: true,
        items: [
          { text: "作业0", link: "/cg/pa0" },
          { text: "作业1", link: "/cg/pa1" },
          { text: "作业2", link: "/cg/pa2" },
          { text: "作业3", link: "/cg/pa3" },
          { text: "作业4", link: "/cg/pa4" },
          { text: "作业5", link: "/cg/pa5" },
          { text: "作业6", link: "/cg/pa6" },
          { text: "作业7", link: "/cg/pa7" },
          { text: "作业8", link: "/cg/pa8" },
          // {
          //   text: "泛谈编译原理",
          //   link: "/preface/what-why-how",
          // },
        ],
      },
      // {
      //   text: "词法分析器",
      //   items: [
      //     { text: "正则表达式", link: "/scanner/regex" },
      //     { text: "自动机技术", link: "/scanner/auto" },
      //     // { text: "课后题答案", link: "/scanner/answer" },
      //   ],
      // },
      // {
      //   text: "语法分析器",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/parser/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "抽象语法树",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/AST/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "语义分析",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/semantic/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "活动记录",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/activation record/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "中间代码",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/IR/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "基本块",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/Basic Block/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "指令选择",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/instruction select/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "活性分析",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/liveness/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "寄存器分配",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/register allocation/answer",
      //     },
      //   ],
      // },
      // {
      //   text: "垃圾回收",
      //   items: [
      //     {
      //       // text: "课后题答案",
      //       // link: "/GC/answer",
      //     },
      //   ],
      // },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/LGGGGGG/lgggggg.github.io" },
    ],

    search: {
      provider: "local",
    },
    lastUpdated: {
      text: "最后更新于",
      formatOptions: {
        dateStyle: "full",
        timeStyle: "medium",
      },
    },
  },
});
