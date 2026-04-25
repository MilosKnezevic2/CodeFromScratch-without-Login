import { Stack, Text, Flex, Box } from "@sanity/ui";
import type { StringInputProps, TextInputProps } from "sanity";

type CounterConfig = {
  /** Minimum recommended length. Below this counts as "short". */
  sweetMin: number;
  /** Maximum recommended length. Above this counts as "long". */
  sweetMax: number;
  /** Hard maximum the validator will reject. */
  max: number;
  /** Per-field hint shown beside the counter. */
  hint?: string;
};

type Zone = "empty" | "short" | "good" | "long" | "over";

function classify(length: number, c: CounterConfig): Zone {
  if (length === 0) return "empty";
  if (length < c.sweetMin) return "short";
  if (length <= c.sweetMax) return "good";
  if (length <= c.max) return "long";
  return "over";
}

const zoneStyles: Record<Zone, { tone: "default" | "primary" | "positive" | "caution" | "critical"; label: string }> = {
  empty: { tone: "default", label: "—" },
  short: { tone: "caution", label: "too short" },
  good: { tone: "positive", label: "good" },
  long: { tone: "caution", label: "getting long" },
  over: { tone: "critical", label: "over limit" },
};

function CharCounterBar({ length, c }: { length: number; c: CounterConfig }) {
  const zone = classify(length, c);
  const { tone, label } = zoneStyles[zone];
  const pctRaw = (length / c.max) * 100;
  const pct = Math.min(100, Math.max(0, pctRaw));
  const barTone = zone === "over" ? "critical" : zone === "good" ? "positive" : zone === "empty" ? "default" : "caution";
  return (
    <Stack space={2}>
      <Box style={{ height: 4, borderRadius: 2, background: "var(--card-border-color)", overflow: "hidden" }}>
        <Box
          style={{
            height: "100%",
            width: `${pct}%`,
            transition: "width 150ms ease",
            background:
              barTone === "positive"
                ? "var(--card-success-fg-color, #22c55e)"
                : barTone === "critical"
                  ? "var(--card-critical-fg-color, #ef4444)"
                  : barTone === "caution"
                    ? "var(--card-caution-fg-color, #f59e0b)"
                    : "var(--card-muted-fg-color, #64748b)",
          }}
        />
      </Box>
      <Flex justify="space-between" align="center">
        <Text size={1} muted>
          {c.hint ? `${c.hint} · ` : ""}target {c.sweetMin}-{c.sweetMax} chars
        </Text>
        <Flex gap={2} align="center">
          <Text size={1} weight="medium">
            {length}
          </Text>
          <Text size={1} muted>
            /
          </Text>
          <Text size={1} muted>
            {c.max}
          </Text>
          <Text size={1} style={{ marginLeft: 8 }} muted={tone === "default"}>
            {label}
          </Text>
        </Flex>
      </Flex>
    </Stack>
  );
}

/**
 * Factory for char-counter inputs. We bind a config per field so the
 * sweet-spot warnings match the validation rules in post.ts.
 *
 * Returns BOTH a string-input variant and a text-input variant from a
 * single config so we can wire it onto any field type without re-typing.
 */
export function makeCharCounter(config: CounterConfig) {
  const StringVariant = (props: StringInputProps) => {
    const value = typeof props.value === "string" ? props.value : "";
    return (
      <Stack space={3}>
        {props.renderDefault(props)}
        <CharCounterBar length={value.length} c={config} />
      </Stack>
    );
  };
  StringVariant.displayName = `CharCounterInput(${config.hint ?? "string"})`;

  const TextVariant = (props: TextInputProps) => {
    const value = typeof props.value === "string" ? props.value : "";
    return (
      <Stack space={3}>
        {props.renderDefault(props)}
        <CharCounterBar length={value.length} c={config} />
      </Stack>
    );
  };
  TextVariant.displayName = `CharCounterInput(${config.hint ?? "text"})`;

  return { StringVariant, TextVariant };
}
