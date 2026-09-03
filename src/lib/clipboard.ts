export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* clipboard API refused, try the legacy fallback */
  }

  try {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const host =
      previous?.closest<HTMLElement>('[role="dialog"]') ?? document.body;
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    host.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    previous?.focus();
    return copied;
  } catch {
    return false;
  }
}
