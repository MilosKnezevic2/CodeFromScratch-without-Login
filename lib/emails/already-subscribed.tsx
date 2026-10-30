interface AlreadySubscribedEmailProps {
  /** What the address is already signed up for, e.g. "the newsletter". */
  what: string;
  unsubscribeUrl: string;
}

/**
 * Sent when someone submits an address that is already confirmed. The page
 * answers every address with the same message (no list-membership probe), so
 * this email is how a real owner learns that nothing more is needed.
 */
export function AlreadySubscribedEmail({ what, unsubscribeUrl }: AlreadySubscribedEmailProps) {
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <p>Someone entered this email address on codefromscratch.org to join ${what}. It is already on the list, so there is nothing to confirm and nothing more to do.</p>
      <p style="margin-top:24px;color:#666;font-size:14px;">If you want to leave, use this link: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>
      <p style="margin-top:24px;color:#666;font-size:14px;">If this was not you, you can ignore this message.</p>
      <p style="margin-top:24px;color:#666;font-size:12px;">CodeFromScratch · Milos Knezevic · Graz, Austria · office@codefromscratch.org</p>
    </div>
  `;
}
