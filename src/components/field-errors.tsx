export function FieldErrors({ errors, id }: { errors: readonly unknown[]; id?: string }) {
  const messages = [...new Set(errors.map(error => typeof error === "string" ? error
    : error && typeof error === "object" && "message" in error ? String(error.message) : "Campo inválido."))];
  return messages.length ? <p role="alert" id={id} className="text-xs text-red-600 dark:text-red-400">{messages.join(" ")}</p> : null;
}
