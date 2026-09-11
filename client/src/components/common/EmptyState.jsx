/**
 * EmptyState — Reusable empty list / zero-result component.
 *
 * Requirement: No list-rendering component should show a blank screen.
 * Every empty state must show a meaningful message.
 */

export function EmptyState({
  icon = 'inbox',
  title = 'Nothing here yet',
  description = '',
  action = null,
}) {
  return (
    <div className="empty-state">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
          {icon}
        </span>
      </div>
      <div>
        <h3 className="text-headline-sm font-semibold text-on-surface mb-1">{title}</h3>
        {description && (
          <p className="text-body-md text-on-surface-variant max-w-[360px] mx-auto">
            {description}
          </p>
        )}
      </div>
      {action || null}
    </div>
  );
}

export default EmptyState;
