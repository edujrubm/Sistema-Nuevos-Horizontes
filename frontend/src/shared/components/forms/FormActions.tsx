interface FormActionsProps {
  onPrevious?: () => void;
  onNext: () => void;
  previousLabel?: string;
  nextLabel?: string;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  busy?: boolean;
  statusMessage?: string;
}

export function FormActions({
  onPrevious,
  onNext,
  previousLabel = "Anterior",
  nextLabel = "Siguiente página",
  previousDisabled = false,
  nextDisabled = false,
  busy = false,
  statusMessage,
}: FormActionsProps) {
  return (
    <footer className="form-footer-actions">
      <span className="form-footer-status" aria-live="polite">
        {statusMessage}
      </span>
      <div>
        {onPrevious ? (
          <button
            type="button"
            className="button secondary"
            disabled={previousDisabled || busy}
            onClick={onPrevious}
          >
            {previousLabel}
          </button>
        ) : null}
        <button
          type="button"
          className="button primary"
          disabled={nextDisabled || busy}
          aria-busy={busy || undefined}
          onClick={onNext}
        >
          {busy ? "Guardando…" : nextLabel}
        </button>
      </div>
    </footer>
  );
}
