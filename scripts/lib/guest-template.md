---
# ---------------------------------------------------------------
# CodeFromScratch article template
# Fill in the fields below, then write the article under the
# second "---" line. Delete these comment lines when you are done.
# ---------------------------------------------------------------

title: "How to Cancel Stale Fetch Requests in React"
# 30-70 characters is best. Maximum 120.

excerpt: "Old search results can overwrite new ones. Here is why it happens and how AbortController fixes it in a few lines."
# 1-2 sentences, 60-280 characters. Shown in the blog list and on Google.

lead: "You will learn why fast typing in a search box can show the wrong results, and how to fix it with AbortController in React."
# 2-3 sentences: what the reader will be able to do after reading. 20-400 characters.

difficulty: intermediate
# beginner | intermediate | advanced

tags: [react, javascript, fetch]
# 2-5 short topics, lowercase.

author:
  name: "Your Name"
  bio: "Two or three sentences about you, written in the third person."
  photo: "images/author.jpg"
  github: "https://github.com/your-handle"
  linkedin: ""
  website: ""
  twitter: ""
  # Leave a link empty ("") if you do not want it shown.
---

Start with the problem, in the reader's own words. One or two short paragraphs.
Say who this article is for and what they need to know already.

## First section heading

Normal paragraphs are plain text. Use **bold** for the one thing the reader
must not miss, *italic* for emphasis, and `inline code` for names such as
`useEffect` or `package.json`.

Links look like this: [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

### A smaller heading inside a section

- Bullet lists use a dash.
- Keep each point short.
  - A sub-point is indented by two spaces.

1. Numbered lists are for steps that happen in order.
2. One action per step.

## Code

Every code block says its language. Add a file name when it helps:

```tsx title="app/search/SearchBox.tsx"
const controller = new AbortController();
fetch(url, { signal: controller.signal });
```

```bash
npm install zod
```

Languages we support: javascript, typescript, jsx, tsx, html, css, json,
bash, python, sql, go, rust, java, csharp, php, ruby, yaml, markdown.

## Boxes

> [!TIP]
> A tip: a shortcut or a good habit.

> [!NOTE]
> Extra information that is useful but not required.

> [!WARNING]
> Something that often goes wrong, and how to avoid it.

> [!CAUTION]
> Something that can break production or lose data.

A normal quote, for example from documentation:

> Quoted text goes here.

## Images

![Short description of what the image shows, for readers who cannot see it](images/01-search-results.png "Optional caption shown under the image")

Put the image files in the images folder and name them in order:
01-short-name.png, 02-short-name.png, and so on.

## Tables

Table: Optional caption shown above the table

| Approach        | Cancels the request | Extra code |
| --------------- | ------------------- | ---------- |
| AbortController | Yes                 | 3 lines    |
| Ignore flag     | No                  | 2 lines    |

## Videos and live code

To show a YouTube or Vimeo video, a tweet, a CodePen or a CodeSandbox, put the
link in an embed block:

```embed
https://codepen.io/your-handle/pen/abc123
caption: Try typing quickly in the search box
```

---

A line with only three dashes (like the one above) draws a divider between
two parts of the article.

## Summary

End with what the reader can do now, in a few sentences or a short list.
