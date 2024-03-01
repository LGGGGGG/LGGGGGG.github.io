// import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  lang: "zh-CN",
  title: "Compiler Online Doc",
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
        text: "前言",
        items: [
          { text: "电波系的欢迎页", link: "/preface/welcome" },
          {
            text: "泛谈编译原理",
            link: "/preface/what-why-how",
          },
        ],
      },
      {
        text: "词法分析器",
        items: [{ text: "如何识别一个token?", link: "/scanner/regex" }],
      },
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
