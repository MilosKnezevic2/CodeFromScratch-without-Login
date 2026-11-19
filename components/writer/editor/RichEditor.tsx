"use client";

import {
  EditorProvider,
  PortableTextEditable,
  useEditor,
  useEditorSelector,
  type BlockListItemRenderProps,
  type PortableTextBlock,
  type RenderAnnotationFunction,
  type RenderBlockFunction,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
} from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import { CalloutCard, CodeCard, DemoCard, DividerCard, ImageCard, type ObjectValue } from "./ObjectCards";
import { schemaDefinition } from "./schema";
import Toolbar from "./Toolbar";

type Props = {
  draftId: string;
  initialValue: PortableTextBlock[];
  readOnly: boolean;
  onChange: (value: PortableTextBlock[]) => void;
};

// The text looks as it does on the article page: same sizes, weights and colours.
const renderStyle: RenderStyleFunction = (props) => {
  switch (props.schemaType.value) {
    case "h2":
      return <h2 className="mb-3 mt-10 text-2xl font-bold text-foreground">{props.children}</h2>;
    case "h3":
      return <h3 className="mb-3 mt-8 text-xl font-semibold text-foreground">{props.children}</h3>;
    case "h4":
      return <h4 className="mb-2 mt-6 text-lg font-semibold text-muted">{props.children}</h4>;
    case "blockquote":
      return <blockquote className="my-5 rounded-r-lg border-l-4 border-accent bg-accent/5 py-3 pl-5 pr-4 italic text-muted">{props.children}</blockquote>;
    default:
      // A list item's text sits inside the item; the item already spaces it.
      return props.block.listItem ? <>{props.children}</> : <p className="mb-4 text-[1.0625rem] leading-relaxed text-muted">{props.children}</p>;
  }
};

const renderDecorator: RenderDecoratorFunction = (props) => {
  switch (props.value) {
    case "strong":
      return <strong className="font-semibold text-foreground">{props.children}</strong>;
    case "em":
      return <em>{props.children}</em>;
    case "underline":
      return <span className="underline">{props.children}</span>;
    case "strike-through":
      return <s>{props.children}</s>;
    case "code":
      return <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em] text-accent">{props.children}</code>;
    default:
      return <>{props.children}</>;
  }
};

const renderAnnotation: RenderAnnotationFunction = (props) =>
  props.schemaType.name === "link" ? (
    <span className="text-accent underline decoration-accent/40 underline-offset-2" title={String(props.value.href ?? "")}>
      {props.children}
    </span>
  ) : (
    <>{props.children}</>
  );

/** A list item's marker; numbers count the items directly above at the same level, as the article does. */
function ListItem(props: BlockListItemRenderProps) {
  const editor = useEditor();
  const key = props.block._key;
  const number = useEditorSelector(editor, (s) => {
    if (props.value !== "number") return 0;
    const blocks = s.context.value;
    let i = blocks.findIndex((b) => b._key === key);
    let n = 0;
    while (i >= 0) {
      const b = blocks[i] as { listItem?: string; level?: number };
      if (b.listItem === undefined || (b.level ?? 1) < props.level) break;
      if (b.listItem === "number" && (b.level ?? 1) === props.level) n += 1;
      i -= 1;
    }
    return n;
  });
  return (
    <div className="relative mb-1 text-muted" style={{ paddingInlineStart: `${props.level * 1.5}rem` }}>
      <span aria-hidden="true" contentEditable={false} className="absolute select-none text-muted-foreground" style={{ insetInlineStart: `${props.level * 1.5 - 1.25}rem` }}>
        {props.value === "number" ? `${number}.` : props.level > 1 ? "◦" : "•"}
      </span>
      {props.children}
    </div>
  );
}

function makeRenderBlock(readOnly: boolean): RenderBlockFunction {
  return function renderBlock(props) {
    const card = { value: props.value as ObjectValue, path: props.path, selected: props.selected, readOnly };
    switch (props.schemaType.name) {
      case "code":
        return <CodeCard {...card} />;
      case "callout":
        return <CalloutCard {...card} />;
      case "livePreview":
        return <DemoCard {...card} />;
      case "divider":
        return <DividerCard {...card} />;
      case "image":
        return <ImageCard {...card} />;
      default:
        return <div>{props.children}</div>;
    }
  };
}

const renderBlockEditable = makeRenderBlock(false);
const renderBlockReadOnly = makeRenderBlock(true);

/**
 * The article editor: Sanity's own Portable Text editor engine, with the
 * site's article styles. What the author sees while writing is what the
 * article page shows; the value is the same Portable Text the Studio stores.
 */
export default function RichEditor({ draftId, initialValue, readOnly, onChange }: Props) {
  return (
    <EditorProvider initialConfig={{ schemaDefinition, initialValue, readOnly }}>
      <EventListenerPlugin
        on={(event) => {
          if (event.type === "mutation") onChange(event.value ?? []);
        }}
      />
      <div className="rounded-2xl border border-border bg-surface">
        {!readOnly && (
          <div className="sticky top-[7.25rem] z-10 rounded-t-2xl border-b border-border bg-surface/95 p-1.5 backdrop-blur">
            <Toolbar draftId={draftId} />
          </div>
        )}
        <PortableTextEditable
          aria-label="Article text"
          spellCheck
          className="min-h-[60dvh] px-4 py-5 focus:outline-none sm:px-8 sm:py-7 [&_[data-slate-placeholder]]:!opacity-60"
          renderStyle={renderStyle}
          renderDecorator={renderDecorator}
          renderAnnotation={renderAnnotation}
          renderBlock={readOnly ? renderBlockReadOnly : renderBlockEditable}
          renderListItem={(props) => <ListItem {...props} />}
          renderPlaceholder={() => <span className="text-muted-foreground">Start with the problem the reader has…</span>}
          hotkeys={{ marks: { "mod+b": "strong", "mod+i": "em", "mod+u": "underline", "mod+'": "code" } }}
        />
      </div>
    </EditorProvider>
  );
}
