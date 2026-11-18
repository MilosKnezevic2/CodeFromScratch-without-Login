import { Box, Button, Flex } from "@sanity/ui";
import { ArrowLeftIcon } from "@sanity/icons";
import type { NavbarProps } from "sanity";

/**
 * The Studio runs full screen, outside the admin panel, so its top bar gets a
 * way back to the panel next to Sanity's own navigation.
 */
export default function StudioNavbar(props: NavbarProps) {
  return (
    <Flex align="center">
      <Box paddingX={2}>
        <Button as="a" href="/portal-cfs-admin" icon={ArrowLeftIcon} mode="bleed" text="Admin" fontSize={1} padding={2} />
      </Box>
      <Box flex={1}>{props.renderDefault(props)}</Box>
    </Flex>
  );
}
